import type { PayloadAction } from '@reduxjs/toolkit'
import type { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import type { Logger } from 'utilities/src/logger/logger'

type StateGetter = () => { delegation: DelegatedState }

export function getHandleOnUpdateDelegatedState(ctx: {
  getOriginalState: StateGetter
  getState: StateGetter
  onDelegationDetected: (input: { chainId: number; address: string; isActiveChain: boolean }) => void
  onNewDelegateState: (input: { delegations: Record<string, string> }) => void
  logger?: Logger
}): (input: { action: PayloadAction<{ chainId: string; address: string }> }) => void {
  const { getOriginalState, getState, logger } = ctx
  function handleOnUpdateDelegatedState(input: { action: PayloadAction<{ chainId: string; address: string }> }): void {
    const { action } = input
    logger?.debug(
      'effects.ts',
      'handleOnUpdateDelegatedState',
      `Updating delegated state for chain id ${action.payload.chainId}`,
    )
    const originalState = getOriginalState()
    const currentState = getState()
    // we compare the original state to the current state
    const delegatedState = originalState.delegation.delegations
    const isNewDelegatedState =
      !delegatedState[action.payload.chainId] || delegatedState[action.payload.chainId] !== action.payload.address
    // we want the latest state (not the original state) for activeChainId
    const activeChainId = currentState.delegation.activeChainId?.toString()
    const isActiveChain = (chainId: string): boolean => activeChainId === chainId
    if (isNewDelegatedState) {
      logger?.info(
        'effects.ts',
        'handleOnUpdateDelegatedState',
        `New delegated state detected for chain id ${JSON.stringify(action.payload)}`,
      )
      ctx.onNewDelegateState({
        delegations: currentState.delegation.delegations,
      })
      // track delegation detected event
      logger?.info(
        'effects.ts',
        'handleOnUpdateDelegatedState',
        `Tracking delegation detected event for chain id ${JSON.stringify(action.payload)}`,
      )
      ctx.onDelegationDetected({
        chainId: parseInt(action.payload.chainId, 10),
        address: action.payload.address,
        isActiveChain: isActiveChain(action.payload.chainId),
      })
    }
  }
  return handleOnUpdateDelegatedState
}

export function getHandleOnSetActiveChainId(ctx: {
  getState: StateGetter
  onDelegationDetected: (input: { chainId: number; address: string; isActiveChain: boolean }) => void
  logger?: Logger
}): (input: { action: PayloadAction<{ chainId?: number }> }) => void {
  const { getState, logger } = ctx
  function handleOnSetActiveChainId(input: { action: PayloadAction<{ chainId?: number }> }): void {
    const { action } = input
    if (action.payload.chainId) {
      logger?.info('effects.ts', 'handleOnSetActiveChainId', `Setting active chain id to ${action.payload.chainId}`)
      const chainId = action.payload.chainId.toString()
      const state = getState()
      const delegationAddress = state.delegation.delegations[chainId]

      if (delegationAddress) {
        logger?.info('effects.ts', 'handleOnSetActiveChainId', `Delegation address found for chain id ${chainId}`)
        ctx.onDelegationDetected({
          chainId: parseInt(chainId, 10),
          address: delegationAddress,
          isActiveChain: true,
        })
      }
    }
  }
  return handleOnSetActiveChainId
}
