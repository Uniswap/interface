import { useMemo } from 'react'
import { useSWPRClaimerContract } from '../useContract'
import { useClaimWhitelist } from '../../state/claim/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import { solidityKeccak256, solidityPack } from 'ethers/lib/utils'
import { MerkleTree as MerkleTreeJS } from 'merkletreejs'
import { WhitelistItem } from '../../state/claim/actions'

const hashLeaf = (leaf: WhitelistItem) => {
  return solidityKeccak256(['bytes'], [solidityPack(['address', 'uint256'], [leaf.account, leaf.amount])])
}

export class MerkleTree {
  private tree: MerkleTreeJS

  constructor(leaves: WhitelistItem[]) {
    this.tree = new MerkleTreeJS(
      leaves.map(leaf => {
        // preparing the leaves
        return hashLeaf(leaf).replace('0x', '')
      }),
      (data: Buffer) =>
        // leaves hashing
        solidityKeccak256(['bytes'], [`0x${data.toString('hex')}`]).replace('0x', ''),
      { sortPairs: true }
    )
  }

  get root(): string {
    return this.tree.getHexRoot()
  }

  getProof(leaf: WhitelistItem): string[] {
    return this.tree.getHexProof(hashLeaf(leaf))
  }
}

export default function useClaimCallback(account: string | null | undefined): () => Promise<TransactionResponse> {
  const whitelist = useClaimWhitelist()
  const swprClaimerContract = useSWPRClaimerContract()

  return useMemo(
    () => () => {
      if (!swprClaimerContract) {
        console.warn('claimer contract is undefined')
        return
      }
      if (!whitelist) {
        console.warn('no claim whitelist available')
        return
      }
      const whitelistItem = whitelist.find(item => item.account === account)
      if (!whitelistItem) {
        console.warn('no claim available for', account)
        return
      }
      return swprClaimerContract.claim(whitelistItem.amount, new MerkleTree(whitelist).getProof(whitelistItem))
    },
    [account, swprClaimerContract, whitelist]
  )
}
