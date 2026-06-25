import { type TransactionRequest } from '@ethersproject/providers'
import type { GasFeeResult } from '@universe/api'
import { useMemo, useState } from 'react'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AutoGasTooltipModal } from 'uniswap/src/features/gas/components/AutoGasTooltipModal'
import { NetworkCostEditorModal } from 'uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditorModal'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import { NetworkCostRow } from 'uniswap/src/features/gas/components/NetworkCostRow'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { useGasChipDispatch } from 'uniswap/src/features/gas/hooks/useGasChipDispatch'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { useEvent } from 'utilities/src/react/hooks'

type OpenModal = 'editor' | 'auto-tooltip' | undefined

export interface DappNetworkCostRowProps {
  chainId: UniverseChainId
  gasFee: GasFeeResult | undefined
  tx: TransactionRequest | undefined
  showSmartWalletActivation?: boolean
  /** Controlled override state. Owned by the screen that hosts the gas
   *  estimation + tx submission so changes round-trip into both. */
  gasOverrides: GasFeeOverrides | undefined
  onChangeGasOverrides: (overrides: GasFeeOverrides | undefined) => void
}

/**
 * Network cost row for the generic dapp transaction request modal (mobile +
 * extension), mirroring the swap-review treatment. Renders the row, the gas
 * editor modal, and the auto-mode tooltip modal.
 *
 * Dapp transaction requests are always single-chain, so the gas-chip
 * dispatcher is called with `isCrossChain: false` and the crosschain
 * "not supported" modal is intentionally omitted — it can never fire here.
 *
 * Override state is controlled by the parent screen (no `TransactionSettingsStore`
 * exists for dapp flows — that store is scoped to swap/send). The parent
 * threads `gasOverrides` into the gas-fee estimation + the tx submission via
 * `buildGasServiceUrgencyOverride`.
 *
 * Callers should guard rendering with `FeatureFlags.GasFeeOverrides`.
 */
export function DappNetworkCostRow({
  chainId,
  gasFee,
  tx,
  showSmartWalletActivation,
  gasOverrides,
  onChangeGasOverrides,
}: DappNetworkCostRowProps): JSX.Element {
  const { enableCustomGasFeeEntry, hasOverrides, hasWarning } = useGasOverridesWarningState({ tx, gasOverrides })
  const { dispatch } = useGasChipDispatch({ isCrossChain: false })

  const [openModal, setOpenModal] = useState<OpenModal>(undefined)

  /** Merge resolved gas params onto the raw dapp tx so the editor's
   *  `extractGasFieldsFromTx` returns real values on first mount, populating
   *  the inputs instead of leaving them empty until the user closes + reopens.
   *  By the time this row is visible the gas estimate has resolved (the row
   *  itself displays the formatted USD cost), so `gasFee.params` is populated. */
  const editorTx = useMemo(() => {
    if (!tx) {
      return undefined
    }
    if (!gasFee?.params) {
      return tx
    }
    return { ...tx, ...gasFee.params }
  }, [tx, gasFee?.params])

  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
    includesDelegation: showSmartWalletActivation,
  })

  const onPressRow = useEvent((): void => {
    const action = dispatch()
    if (action.type === 'auto-tooltip') {
      setOpenModal('auto-tooltip')
    } else if (action.type === 'editor') {
      setOpenModal('editor')
    }
    // 'crosschain-not-supported' is unreachable here — dispatch is called with
    // `isCrossChain: false`. We intentionally omit the crosschain modal.
  })

  const onCloseModal = useEvent((): void => setOpenModal(undefined))

  const onSaveOverrides = useEvent((overrides: GasFeeOverrides): void => {
    onChangeGasOverrides(overrides)
    setOpenModal(undefined)
  })

  const onResetOverrides = useEvent((): void => {
    onChangeGasOverrides(undefined)
    setOpenModal(undefined)
  })

  return (
    <Flex px="$spacing8" py="$spacing8">
      <NetworkCostRow
        gasFeeUsd={gasFeeFormatted}
        enableCustomGasFeeEntry={enableCustomGasFeeEntry}
        hasOverrides={hasOverrides}
        hasWarning={hasWarning}
        includesDelegation={showSmartWalletActivation}
        onPress={onPressRow}
      />
      <NetworkCostEditorModal
        isOpen={openModal === 'editor'}
        tx={editorTx}
        initialOverrides={gasOverrides}
        surface="dapp_request"
        onSave={onSaveOverrides}
        onCancel={onCloseModal}
        onReset={onResetOverrides}
      />
      <AutoGasTooltipModal isOpen={openModal === 'auto-tooltip'} onClose={onCloseModal} />
    </Flex>
  )
}
