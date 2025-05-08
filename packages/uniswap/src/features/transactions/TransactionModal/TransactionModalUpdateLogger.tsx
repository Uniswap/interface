import { useEffect } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export function TransactionModalUpdateLogger({ modalName }: { modalName: ModalNameType }): null {
  const { screen } = useTransactionModalContext()
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  useEffect(() => {
    if (modalName === ModalName.Swap) {
      logContextUpdate('TransactionModal', { screen, modalName }, datadogEnabled)
    }
  }, [modalName, screen, datadogEnabled])

  return null
}
