import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { Platform } from '@universe/chains'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useGetPositionInfo } from 'uniswap/src/features/positions/hooks/useGetPositionInfo'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getIsPermissioned } from 'uniswap/src/features/positions/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { ValidatedDecreasePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getCurrencyWithOptionalUnwrap } from '~/features/Liquidity/utils/currency'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { LiquidityModalInitialState } from '~/state/application/reducer'
import { PositionField } from '~/types/position'

export enum DecreaseLiquidityStep {
  Input = 0,
  Review = 1,
}

/** Position and decrease calldata are re-read on the same cadence so the amounts shown track the quoted transaction. */
export const REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS = 5 * ONE_SECOND_MS

/** What the saga was handed when the user confirmed: the transaction and the position it was built from. */
export type CommittedDecrease = {
  positionInfo: PositionInfo
  txContext: ValidatedDecreasePositionTxAndGasInfo
}

type RemoveLiquidityModalState = {
  step: DecreaseLiquidityStep
  setStep: Dispatch<SetStateAction<DecreaseLiquidityStep>>
  percent: string
  setPercent: (percent: string) => void
  positionInfo?: LiquidityModalInitialState
  currencies?: { [key in PositionField]: Currency }
  percentInvalid?: boolean
  unwrapNativeCurrency: boolean
  setUnwrapNativeCurrency: Dispatch<SetStateAction<boolean>>
  currentTransactionStep?: { step: TransactionStep; accepted: boolean }
  setCurrentTransactionStep: Dispatch<SetStateAction<{ step: TransactionStep; accepted: boolean } | undefined>>
  /**
   * Set from the moment the user confirms until the flow fails or is cancelled. While set, `positionInfo` is the
   * frozen snapshot the transaction was built from and nothing is re-read, so the UI cannot drift from what the
   * saga is submitting during a chain switch, approval or the decrease itself.
   */
  committedDecrease?: CommittedDecrease
  commitDecrease: (txContext: ValidatedDecreasePositionTxAndGasInfo) => void
  resetCommittedDecrease: () => void
  /** Returns to the form. Leaving the review un-freezes the position, so the next Confirm commits what is shown. */
  backToInput: () => void
}

const RemoveLiquidityModalContext = createContext<RemoveLiquidityModalState>({
  step: DecreaseLiquidityStep.Input,
  setStep: () => null,
  percent: '',
  setPercent: () => null,
  percentInvalid: true,
  unwrapNativeCurrency: true,
  setUnwrapNativeCurrency: () => null,
  currentTransactionStep: undefined,
  setCurrentTransactionStep: () => null,
  committedDecrease: undefined,
  commitDecrease: () => null,
  resetCommittedDecrease: () => null,
  backToInput: () => null,
})

export function RemoveLiquidityModalContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [step, setStep] = useState(DecreaseLiquidityStep.Input)
  const [unwrapNativeCurrency, setUnwrapNativeCurrency] = useState(true)
  const [percent, setPercent] = useState<string>('')
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const [committedDecrease, setCommittedDecrease] = useState<CommittedDecrease>()
  const initialPositionInfo = useModalInitialState(ModalName.RemoveLiquidity)
  const evmAddress = useActiveAddress(Platform.EVM)

  // The PositionInfo handed over at click time is a snapshot of the list/page query, while the decrease
  // calldata is quoted from live state. Re-read the position while the modal is open. Once the user has
  // committed, go dormant: a late poll must not change what is shown while the saga runs. Disabling alone
  // does not stop a read already in flight, which is why the committed snapshot below takes precedence.
  const hasCommitted = committedDecrease !== undefined
  const { positionInfo: refreshedPositionInfo } = useGetPositionInfo(
    initialPositionInfo
      ? {
          owner: evmAddress ?? ZERO_ADDRESS,
          chainId: initialPositionInfo.chainId,
          protocolVersion: initialPositionInfo.version,
          tokenId: initialPositionInfo.tokenId,
          pairAddress:
            initialPositionInfo.version === ProtocolVersion.V2 ? initialPositionInfo.liquidityToken.address : undefined,
          permissioned: getIsPermissioned(initialPositionInfo),
        }
      : undefined,
    { refetchInterval: hasCommitted ? false : REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS, enabled: !hasCommitted },
  )
  const livePositionInfo = refreshedPositionInfo ?? initialPositionInfo
  const positionInfo = committedDecrease?.positionInfo ?? livePositionInfo

  // The saga restarts on a re-trigger while it awaits a chain switch, so a second confirm keeps the first snapshot.
  const commitDecrease = useCallback(
    (txContext: ValidatedDecreasePositionTxAndGasInfo) => {
      if (livePositionInfo) {
        setCommittedDecrease((current) => current ?? { positionInfo: livePositionInfo, txContext })
      }
    },
    [livePositionInfo],
  )
  const resetCommittedDecrease = useCallback(() => setCommittedDecrease(undefined), [])
  // Back stays enabled while the saga runs; the saga keeps its own calldata, and the form must edit the live
  // position, not the snapshot.
  const backToInput = useCallback(() => {
    setCommittedDecrease(undefined)
    setStep(DecreaseLiquidityStep.Input)
  }, [])

  const percentInvalid = percent === '0' || percent === '' || !percent
  const currencies = useMemo(() => {
    const currency0 = getCurrencyWithOptionalUnwrap({
      currency: positionInfo?.currency0Amount.currency,
      shouldUnwrap: unwrapNativeCurrency && positionInfo?.version !== ProtocolVersion.V4,
    })
    const currency1 = getCurrencyWithOptionalUnwrap({
      currency: positionInfo?.currency1Amount.currency,
      shouldUnwrap: unwrapNativeCurrency && positionInfo?.version !== ProtocolVersion.V4,
    })

    if (!currency0 || !currency1) {
      return undefined
    }

    return {
      TOKEN0: currency0,
      TOKEN1: currency1,
    }
  }, [
    positionInfo?.version,
    positionInfo?.currency0Amount.currency,
    positionInfo?.currency1Amount.currency,
    unwrapNativeCurrency,
  ])

  const ctx = useMemo(
    () => ({
      percent,
      setPercent,
      step,
      setStep,
      positionInfo,
      currencies,
      percentInvalid,
      unwrapNativeCurrency,
      setUnwrapNativeCurrency,
      currentTransactionStep,
      setCurrentTransactionStep,
      committedDecrease,
      commitDecrease,
      resetCommittedDecrease,
      backToInput,
    }),
    [
      percent,
      step,
      positionInfo,
      currencies,
      percentInvalid,
      unwrapNativeCurrency,
      currentTransactionStep,
      committedDecrease,
      commitDecrease,
      resetCommittedDecrease,
      backToInput,
    ],
  )

  return <RemoveLiquidityModalContext.Provider value={ctx}>{children}</RemoveLiquidityModalContext.Provider>
}

export function useRemoveLiquidityModalContext() {
  const removeModalContext = useContext(RemoveLiquidityModalContext)

  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (removeModalContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeModalContext
}
