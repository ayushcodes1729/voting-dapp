import * as anchor from '@coral-xyz/anchor'
import { BankrunProvider, startAnchor } from 'anchor-bankrun'
import { Program } from '@coral-xyz/anchor'
import { VotingDapp } from '../target/types/voting_dapp'
import { PublicKey } from '@solana/web3.js'
import { expect } from 'chai'

const IDL = require('../target/idl/voting_dapp.json')

const programAddress = new PublicKey('GuHcyUrChc9xo183e3BfKh5VfX7xSKzrndSvPMkoJ35Y')

let context
let provider
let votingProgram

before(async () => {
  context = await startAnchor('', [{ name: 'voting_dapp', programId: programAddress }], [])
  provider = new BankrunProvider(context)
  votingProgram = new Program<VotingDapp>(IDL, provider)
})

describe('Voting', () => {
  it('Initialize Poll', async () => {
    await votingProgram.methods
      .initializePoll(new anchor.BN(1), 'Which side you are?', new anchor.BN(0), new anchor.BN(1849212601))
      .rpc()

    // Account Adress derivation: Derives the PDA from poll_id and programAddress
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      programAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    console.log(poll)

    expect(poll.pollId.toNumber()).equal(1)
    expect(poll.description).equal('Which side you are?')
    expect(poll.pollStart.toNumber()).lessThan(poll.pollEnd.toNumber())
  })

  it('Initialize Candidate', async () => {
    await votingProgram.methods.initializeCandidate(new anchor.BN(1), 'Elon').rpc()

    await votingProgram.methods.initializeCandidate(new anchor.BN(1), 'Trump').rpc()

    const [elonAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Elon')],
      programAddress,
    )
    const elonCandidate = await votingProgram.account.candidate.fetch(elonAddress)
    console.log(elonCandidate)
    expect(elonCandidate.candidateVotes.toNumber()).equal(0)

    const [trumpAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Trump')],
      programAddress,
    )
    const trumpCandidate = await votingProgram.account.candidate.fetch(trumpAddress)
    console.log(trumpCandidate)
    expect(trumpCandidate.candidateVotes.toNumber()).equal(0)
  })

  it('vote', async () => {
    await votingProgram.methods.vote(
      "Elon",
      new anchor.BN(1)
    ).rpc();

    const [elonAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Elon')],
      programAddress,
    )
    
    await votingProgram.methods.vote(
      "Trump",
      new anchor.BN(1)
    ).rpc();

    const [trumpAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Trump')],
      programAddress,
    )

    const elonCandidate = await votingProgram.account.candidate.fetch(elonAddress)
    console.log(elonCandidate)
    const trumpCandidate = await votingProgram.account.candidate.fetch(trumpAddress)
    console.log(trumpCandidate)
    expect(elonCandidate.candidateVotes.toNumber()).equal(1)
    expect(trumpCandidate.candidateVotes.toNumber()).equal(1)
  })
})
