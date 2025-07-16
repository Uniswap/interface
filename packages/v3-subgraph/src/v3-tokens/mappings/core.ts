import { Collect, Initialize, Mint, Swap } from '../../../generated/templates/Pool/Pool'
import { handleCollect as handleCollectHelper } from './collect'
import { handleInitialize as handleInitializeHelper } from './initialize'
import { handleMint as handleMintHelper } from './mint'
import { handleSwap as handleSwapHelper } from './swap'

// Workaround for limited export types in Assemblyscript.
export function handleInitialize(event: Initialize): void {
  handleInitializeHelper(event)
}

export function handleMint(event: Mint): void {
  handleMintHelper(event)
}

export function handleSwap(event: Swap): void {
  handleSwapHelper(event)
}

export function handleCollect(event: Collect): void {
  handleCollectHelper(event)
}
