import { useCallback, useEffect, useRef, useState } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_WITHDRAW_CHAIN_ID } from 'uniswap/src/features/earn/constants'
import type { EarnPositionInfo, EarnVaultTab } from 'uniswap/src/features/earn/types'
import { getDevLogger } from 'utilities/src/logger/logger'

export type { EarnVaultTab }

export enum EarnVaultView {
  Vault = 'vault',
  NeedToken = 'need-token',
  DepositAmount = 'deposit-amount',
  DepositReview = 'deposit-review',
  WithdrawAmount = 'withdraw-amount',
  WithdrawReview = 'withdraw-review',
}

export type EarnVaultFlow =
  | { view: EarnVaultView.Vault }
  | { view: EarnVaultView.NeedToken }
  | { view: EarnVaultView.DepositAmount; amount: string }
  | { view: EarnVaultView.DepositReview; amount: string }
  | { view: EarnVaultView.WithdrawAmount; amount: string; chainId: UniverseChainId; position: EarnPositionInfo }
  | { view: EarnVaultView.WithdrawReview; amount: string; chainId: UniverseChainId; position: EarnPositionInfo }

export type EarnVaultModalInitialView = Extract<
  EarnVaultView,
  EarnVaultView.Vault | EarnVaultView.DepositAmount | EarnVaultView.WithdrawAmount
>

interface UseEarnVaultModalFlowParams {
  hasPosition: boolean
  initialPosition?: EarnPositionInfo
  initialView: EarnVaultModalInitialView
  isOpen: boolean
  vaultId: string | undefined
}

interface UseEarnVaultModalFlowResult {
  flow: EarnVaultFlow
  selectedTab: EarnVaultTab
  setSelectedTab: (tab: EarnVaultTab) => void
  reset: () => void
  startDeposit: () => void
  startNeedToken: () => void
  submitDepositAmount: (amount: string) => void
  backToDepositAmount: () => void
  startWithdraw: (position: EarnPositionInfo) => void
  submitWithdrawAmount: (params: { amount: string; chainId: UniverseChainId }) => void
  backToWithdrawAmount: () => void
  backToVault: () => void
}

const logger = getDevLogger()

export function useEarnVaultModalFlow({
  hasPosition,
  initialPosition,
  initialView,
  isOpen,
  vaultId,
}: UseEarnVaultModalFlowParams): UseEarnVaultModalFlowResult {
  const previousHasPositionRef = useRef(hasPosition)
  const previousOpenStateRef = useRef<{
    initialView: EarnVaultModalInitialView
    isOpen: boolean
    vaultId: string | undefined
  }>({ initialView, isOpen: false, vaultId: undefined })

  const [selectedTab, setSelectedTab] = useState<EarnVaultTab>(hasPosition ? 'balance' : 'details')
  const [flow, setFlow] = useState<EarnVaultFlow>({ view: EarnVaultView.Vault })

  const getInitialFlow = useCallback((): EarnVaultFlow => {
    switch (initialView) {
      case EarnVaultView.DepositAmount:
        return { view: EarnVaultView.DepositAmount, amount: '' }
      case EarnVaultView.WithdrawAmount: {
        if (!initialPosition) {
          logger.warn(
            'useEarnVaultModalFlow',
            'getInitialFlow',
            'Requested withdraw amount view without an earn position; falling back to vault view.',
          )
          return { view: EarnVaultView.Vault }
        }

        return {
          view: EarnVaultView.WithdrawAmount,
          amount: '',
          chainId: DEFAULT_WITHDRAW_CHAIN_ID,
          position: initialPosition,
        }
      }
      case EarnVaultView.Vault:
        return { view: EarnVaultView.Vault }
    }

    return assertNever(initialView)
  }, [initialPosition, initialView])

  const reset = useCallback(() => {
    setSelectedTab(hasPosition ? 'balance' : 'details')
    setFlow(getInitialFlow())
  }, [getInitialFlow, hasPosition])

  useEffect(() => {
    const previousOpenState = previousOpenStateRef.current
    const shouldReset =
      isOpen &&
      (!previousOpenState.isOpen ||
        previousOpenState.vaultId !== vaultId ||
        previousOpenState.initialView !== initialView)

    previousOpenStateRef.current = { initialView, isOpen, vaultId }

    if (shouldReset) {
      reset()
    }
  }, [initialView, isOpen, reset, vaultId])

  useEffect(() => {
    const previousHasPosition = previousHasPositionRef.current
    previousHasPositionRef.current = hasPosition

    if (!previousHasPosition && hasPosition && flow.view === EarnVaultView.Vault) {
      setSelectedTab('balance')
    }
  }, [flow.view, hasPosition])

  const startDeposit = useCallback(() => {
    setFlow({ view: EarnVaultView.DepositAmount, amount: '' })
  }, [])

  const startNeedToken = useCallback(() => {
    setFlow({ view: EarnVaultView.NeedToken })
  }, [])

  const submitDepositAmount = useCallback((amount: string) => {
    setFlow({ view: EarnVaultView.DepositReview, amount })
  }, [])

  const backToDepositAmount = useCallback(() => {
    setFlow((current) => ({
      view: EarnVaultView.DepositAmount,
      amount: current.view === EarnVaultView.DepositReview ? current.amount : '',
    }))
  }, [])

  const startWithdraw = useCallback((position: EarnPositionInfo) => {
    setFlow({ view: EarnVaultView.WithdrawAmount, amount: '', chainId: DEFAULT_WITHDRAW_CHAIN_ID, position })
  }, [])

  const submitWithdrawAmount = useCallback((params: { amount: string; chainId: UniverseChainId }) => {
    setFlow((current) => {
      if (current.view !== EarnVaultView.WithdrawAmount) {
        return current
      }

      return {
        view: EarnVaultView.WithdrawReview,
        amount: params.amount,
        chainId: params.chainId,
        position: current.position,
      }
    })
  }, [])

  const backToWithdrawAmount = useCallback(() => {
    setFlow((current) => {
      if (current.view !== EarnVaultView.WithdrawReview) {
        return current
      }

      return {
        view: EarnVaultView.WithdrawAmount,
        amount: current.amount,
        chainId: current.chainId,
        position: current.position,
      }
    })
  }, [])

  const backToVault = useCallback(() => {
    setFlow({ view: EarnVaultView.Vault })
  }, [])

  return {
    flow,
    selectedTab,
    setSelectedTab,
    reset,
    startDeposit,
    startNeedToken,
    submitDepositAmount,
    backToDepositAmount,
    startWithdraw,
    submitWithdrawAmount,
    backToWithdrawAmount,
    backToVault,
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected earn vault modal initial view: ${value}`)
}
