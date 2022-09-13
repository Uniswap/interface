import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import type { BaseProvider } from '@ethersproject/providers'

const looksRareContract = new Contract('0xea37093ce161f090e443f304e1bf3a8f14d7bb40', [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'rewardRound', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'RewardsClaim',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32[]', name: 'merkleProof', type: 'bytes32[]' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'amountClaimedByUser',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
])

export const getClaimedAmount = async ({ address, provider }: { address: string; provider: BaseProvider }) =>
  provider && (await looksRareContract.connect(provider).amountClaimedByUser(address))

export const claimLooks = async ({
  signer,
  looksTotal,
  proof,
}: {
  signer: Signer
  looksTotal: string
  proof: string[]
}) => {
  await looksRareContract.connect(signer).functions.claim(looksTotal, proof)
}
