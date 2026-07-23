import { act, renderHook } from '@testing-library/react'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnVaultView, useEarnVaultModalFlow } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnPositionInfo } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance, resolveEarnWithdrawPosition } from 'uniswap/src/features/earn/utils'

const POSITION: EarnPositionInfo = {
  vaultId: 'vault-1',
  depositedUsd: 12,
  depositedRaw: '12000000',
  apyPercent: 5,
  sharesRaw: '12000000',
}

function renderFlow(): ReturnType<typeof renderHook<ReturnType<typeof useEarnVaultModalFlow>, void>> {
  return renderHook(() =>
    useEarnVaultModalFlow({
      hasPosition: true,
      initialPosition: POSITION,
      initialView: EarnVaultView.WithdrawAmount,
      isOpen: true,
      vaultId: POSITION.vaultId,
    }),
  )
}

describe(useEarnVaultModalFlow, () => {
  it('preserves a MAX_SHARES withdraw mode when navigating review -> back', () => {
    const { result } = renderFlow()

    act(() => result.current.startWithdraw(POSITION))
    act(() =>
      result.current.submitWithdrawAmount({
        amount: '12',
        chainId: UniverseChainId.Mainnet,
        withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
      }),
    )

    const reviewFlow = result.current.flow
    if (reviewFlow.view !== EarnVaultView.WithdrawReview) {
      throw new Error(`expected WithdrawReview, got ${reviewFlow.view}`)
    }
    expect(reviewFlow.withdrawMode).toBe(TradingApi.EarnWithdrawMode.MAX_SHARES)

    act(() => result.current.backToWithdrawAmount())

    const amountFlow = result.current.flow
    if (amountFlow.view !== EarnVaultView.WithdrawAmount) {
      throw new Error(`expected WithdrawAmount, got ${amountFlow.view}`)
    }
    // The regression: without carrying withdrawMode back, this reset to EXACT_ASSETS and the restored
    // max amount re-read as "insufficient".
    expect(amountFlow.withdrawMode).toBe(TradingApi.EarnWithdrawMode.MAX_SHARES)
    expect(amountFlow.amount).toBe('12')
    expect(amountFlow.chainId).toBe(UniverseChainId.Mainnet)
  })

  it('keeps an EXACT_ASSETS withdraw mode across review -> back', () => {
    const { result } = renderFlow()

    act(() => result.current.startWithdraw(POSITION))
    act(() =>
      result.current.submitWithdrawAmount({
        amount: '5',
        chainId: UniverseChainId.Mainnet,
        withdrawMode: TradingApi.EarnWithdrawMode.EXACT_ASSETS,
      }),
    )
    act(() => result.current.backToWithdrawAmount())

    const amountFlow = result.current.flow
    if (amountFlow.view !== EarnVaultView.WithdrawAmount) {
      throw new Error(`expected WithdrawAmount, got ${amountFlow.view}`)
    }
    expect(amountFlow.withdrawMode).toBe(TradingApi.EarnWithdrawMode.EXACT_ASSETS)
  })

  it('carries a Max deposit selection (and exact token amount) through review -> back', () => {
    const { result } = renderFlow()

    act(() => result.current.startDeposit())
    act(() =>
      result.current.submitDepositAmount({
        amount: '12.01',
        sourceChainId: UniverseChainId.Mainnet,
        sourceCurrencyId: '1-0xusdc',
        isMax: true,
        tokenAmount: '12.005000',
      }),
    )

    const reviewFlow = result.current.flow
    if (reviewFlow.view !== EarnVaultView.DepositReview) {
      throw new Error(`expected DepositReview, got ${reviewFlow.view}`)
    }
    expect(reviewFlow.isMax).toBe(true)
    expect(reviewFlow.tokenAmount).toBe('12.005000')

    act(() => result.current.backToDepositAmount())

    const amountFlow = result.current.flow
    if (amountFlow.view !== EarnVaultView.DepositAmount) {
      throw new Error(`expected DepositAmount, got ${amountFlow.view}`)
    }
    // The regression: without carrying isMax back, the restored fiat amount (rounded up for
    // display) re-ran the over-balance check and read as "insufficient".
    expect(amountFlow.isMax).toBe(true)
    expect(amountFlow.amount).toBe('12.01')
  })

  it('un-gates withdraw once the live position confirms raw balances after an optimistic snapshot', () => {
    // After a user's FIRST deposit, the position exists only as an optimistic entry with zero raw
    // balances. startWithdraw snapshots it one-shot into flow state and nothing refreshes the
    // snapshot — so the withdraw views resolve against the latest queried position instead.
    const optimisticZeroRawPosition: EarnPositionInfo = {
      vaultId: POSITION.vaultId,
      depositedUsd: 12,
      depositedRaw: '0',
      apyPercent: 5,
      sharesRaw: '0',
    }

    const { result } = renderFlow()

    act(() => result.current.startWithdraw(optimisticZeroRawPosition))

    const amountFlow = result.current.flow
    if (amountFlow.view !== EarnVaultView.WithdrawAmount) {
      throw new Error(`expected WithdrawAmount, got ${amountFlow.view}`)
    }

    // While the live GetEarnPosition query is unresolved, the view consumes the snapshot and the
    // review CTA stays gated on 'Loading'.
    const pendingPosition = resolveEarnWithdrawPosition({
      livePosition: undefined,
      snapshotPosition: amountFlow.position,
    })
    expect(hasConfirmedEarnPositionRawBalance(pendingPosition)).toBe(false)

    // The live query resolves with confirmed raw balances. The flow snapshot is untouched, but the
    // position the withdraw view consumes updates — the CTA is no longer gated.
    const confirmedLivePosition: EarnPositionInfo = {
      vaultId: POSITION.vaultId,
      depositedUsd: 11.98,
      depositedRaw: '11980000',
      apyPercent: 5,
      sharesRaw: '11900000',
    }
    const resolvedPosition = resolveEarnWithdrawPosition({
      livePosition: confirmedLivePosition,
      snapshotPosition: amountFlow.position,
    })
    expect(resolvedPosition).toBe(confirmedLivePosition)
    expect(hasConfirmedEarnPositionRawBalance(resolvedPosition)).toBe(true)

    // The same resolution feeds WithdrawReview, so a MAX_SHARES quote gets confirmed sharesRaw.
    act(() =>
      result.current.submitWithdrawAmount({
        amount: '11.98',
        chainId: UniverseChainId.Mainnet,
        withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
      }),
    )
    const reviewFlow = result.current.flow
    if (reviewFlow.view !== EarnVaultView.WithdrawReview) {
      throw new Error(`expected WithdrawReview, got ${reviewFlow.view}`)
    }
    const reviewPosition = resolveEarnWithdrawPosition({
      livePosition: confirmedLivePosition,
      snapshotPosition: reviewFlow.position,
    })
    expect(reviewPosition.sharesRaw).toBe('11900000')
  })
})
