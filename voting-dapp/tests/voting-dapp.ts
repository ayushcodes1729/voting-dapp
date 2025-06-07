import * as anchor from '@coral-xyz/anchor'
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Program } from '@coral-xyz/anchor'
import { VotingDapp } from '../target/types/voting_dapp'
import { PublicKey } from '@solana/web3.js';
import { expect } from 'chai';

const IDL = require('../target/idl/voting_dapp.json')

const programAddress = new PublicKey("GuHcyUrChc9xo183e3BfKh5VfX7xSKzrndSvPMkoJ35Y")

describe('Voting', () => {
  it('Initialize Poll', async () => {
    const context = await startAnchor('', [{name: "voting_dapp", programId: programAddress}], [])

    const provider = new BankrunProvider(context)

    // Creates a program interface using the compiled IDL of the program
    const votingProgram = new Program<VotingDapp>(
      IDL,
      provider
    )

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "Elon vs Trumph",
      new anchor.BN(0),
      new anchor.BN(1849212601)
    ).rpc();

    // Account Adress derivation: Derives the PDA from poll_id and programAddress
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      programAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).equal(1);
    expect(poll.description).equal("Elon vs Trumph");
    expect(poll.pollStart.toNumber()).lessThan(poll.pollEnd.toNumber())
  })
})