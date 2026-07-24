import { type TransactionRequest } from '@ethersproject/providers'
import { isMobileApp } from '@universe/environment'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Gas } from 'ui/src/components/icons/Gas'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { computeMaxCost } from 'uniswap/src/features/gas/components/NetworkCostEditor/computeMaxCost'
import { GasFieldInput } from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldInput'
import { weiToGwei } from 'uniswap/src/features/gas/components/NetworkCostEditor/gweiToWei'
import { useGasFieldValidation } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasFieldValidation'
import {
  type RecommendedGasFieldValues,
  useRecommendedGasFields,
} from 'uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

/** Renders the "Max cost" summary row with native token amount and USD value. */
function MaxCostRow({
  chainId,
  maxCostWei,
}: {
  chainId: number | undefined
  maxCostWei: string | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { value: maxCostUsd } = useUSDValueOfGasFee(chainId, maxCostWei)
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const gasToken = chainId ? getChainGasToken(chainId) : undefined
  const gasTokenAmount =
    maxCostWei && gasToken
      ? getCurrencyAmount({ currency: gasToken, value: maxCostWei, valueType: ValueType.Raw })
      : undefined
  const gasTokenAmountFormatted = gasTokenAmount
    ? formatNumberOrString({ value: gasTokenAmount.toExact(), type: NumberType.TokenNonTx })
    : undefined
  // Format the fiat max cost the same way other gas-fee surfaces do: localized to
  // the user's fiat currency and capped at 2 decimals (or "<$0.01" below a cent),
  // rather than the raw full-precision USD string.
  const maxCostFiatFormatted = convertFiatAmountFormatted(maxCostUsd, NumberType.FiatGasPrice, '—')

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="$spacing6">
        <Gas color="$neutral2" size="$icon.16" />
        <Text variant="body3" color="$neutral2">
          {t('gas.override.maxCost')}
        </Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        {gasTokenAmountFormatted && gasToken && (
          <Text variant="body3" color="$neutral3">
            {gasTokenAmountFormatted} {gasToken.symbol}
          </Text>
        )}
        <Text variant="body3" color="$neutral1">
          {maxCostFiatFormatted}
        </Text>
      </Flex>
    </Flex>
  )
}

interface TxGasFields {
  maxBaseFeeGwei: string
  priorityFeeGwei: string
  gasLimit: string
}

/** Convert a populated `TransactionRequest`'s wei/decimal gas fields into the
 *  GWEI / count strings the editor's inputs render. Returns `undefined` if any
 *  field is missing or malformed — the caller then falls back to the gas-service
 *  recommended baseline. */
function extractGasFieldsFromTx(tx: TransactionRequest | undefined): TxGasFields | undefined {
  if (!tx?.maxFeePerGas || !tx.maxPriorityFeePerGas || !tx.gasLimit) {
    return undefined
  }
  try {
    const maxFee = BigInt(tx.maxFeePerGas.toString())
    const prio = BigInt(tx.maxPriorityFeePerGas.toString())
    const limit = BigInt(tx.gasLimit.toString())
    // Floor at 0 — a misbehaving service returning prio > maxFee would otherwise
    // produce a malformed GWEI string from sign-preserving BigInt modulo.
    const baseFee = maxFee > prio ? maxFee - prio : BigInt(0)
    return {
      maxBaseFeeGwei: weiToGwei(baseFee),
      priorityFeeGwei: weiToGwei(prio),
      gasLimit: limit.toString(),
    }
  } catch {
    return undefined
  }
}

type DirtyFields = { maxBaseFee: boolean; priorityFee: boolean; gasLimit: boolean }

function useFieldState({
  initialOverrides,
  initialFromTx,
  recommended,
}: {
  initialOverrides: GasFeeOverrides | undefined
  initialFromTx: TxGasFields | undefined
  recommended: { recommendedMaxBaseFeeGwei?: string; recommendedPriorityFeeGwei?: string; recommendedGasLimit?: string }
}): {
  maxBaseFeeGwei: string
  priorityFeeGwei: string
  gasLimit: string
  isDirty: DirtyFields
  handleChangeMaxBaseFee: (next: string) => void
  handleChangePriorityFee: (next: string) => void
  handleChangeGasLimit: (next: string) => void
} {
  const [maxBaseFeeGwei, setMaxBaseFeeGwei] = useState<string>(
    initialOverrides?.maxBaseFeeGwei ?? initialFromTx?.maxBaseFeeGwei ?? recommended.recommendedMaxBaseFeeGwei ?? '',
  )
  const [priorityFeeGwei, setPriorityFeeGwei] = useState<string>(
    initialOverrides?.priorityFeeGwei ?? initialFromTx?.priorityFeeGwei ?? recommended.recommendedPriorityFeeGwei ?? '',
  )
  const [gasLimit, setGasLimit] = useState<string>(
    initialOverrides?.gasLimit ?? initialFromTx?.gasLimit ?? recommended.recommendedGasLimit ?? '',
  )
  const [isDirty, setIsDirty] = useState<DirtyFields>({ maxBaseFee: false, priorityFee: false, gasLimit: false })

  // Backfill empty, undirty inputs once the gas-service recommended baseline
  // resolves after mount. Without this, callers that open the editor before
  // `useRecommendedGasFields` has data would see permanently-blank inputs.
  useEffect(() => {
    if (!isDirty.maxBaseFee && !maxBaseFeeGwei && recommended.recommendedMaxBaseFeeGwei) {
      setMaxBaseFeeGwei(recommended.recommendedMaxBaseFeeGwei)
    }
  }, [recommended.recommendedMaxBaseFeeGwei, isDirty.maxBaseFee, maxBaseFeeGwei])
  useEffect(() => {
    if (!isDirty.priorityFee && !priorityFeeGwei && recommended.recommendedPriorityFeeGwei) {
      setPriorityFeeGwei(recommended.recommendedPriorityFeeGwei)
    }
  }, [recommended.recommendedPriorityFeeGwei, isDirty.priorityFee, priorityFeeGwei])
  useEffect(() => {
    if (!isDirty.gasLimit && !gasLimit && recommended.recommendedGasLimit) {
      setGasLimit(recommended.recommendedGasLimit)
    }
  }, [recommended.recommendedGasLimit, isDirty.gasLimit, gasLimit])

  const handleChangeMaxBaseFee = useEvent((next: string): void => {
    setMaxBaseFeeGwei(next)
    setIsDirty((prev) => (prev.maxBaseFee ? prev : { ...prev, maxBaseFee: true }))
  })
  const handleChangePriorityFee = useEvent((next: string): void => {
    setPriorityFeeGwei(next)
    setIsDirty((prev) => (prev.priorityFee ? prev : { ...prev, priorityFee: true }))
  })
  const handleChangeGasLimit = useEvent((next: string): void => {
    setGasLimit(next)
    setIsDirty((prev) => (prev.gasLimit ? prev : { ...prev, gasLimit: true }))
  })

  return {
    maxBaseFeeGwei,
    priorityFeeGwei,
    gasLimit,
    isDirty,
    handleChangeMaxBaseFee,
    handleChangePriorityFee,
    handleChangeGasLimit,
  }
}

export interface NetworkCostEditorProps {
  /** Populated transaction for the user's pending swap (or dapp tx). Drives the
   *  instant pre-fill (so the inputs aren't blank while the gas-service query
   *  resolves) AND is the input the gas service consults for the recommended
   *  baseline. */
  tx?: TransactionRequest
  /** Optional fallback chain for the USD conversion of the live max-cost
   *  preview when `tx?.chainId` is unavailable. */
  chainId?: number
  initialOverrides?: GasFeeOverrides
  onSave: (overrides: GasFeeOverrides) => void
  onCancel: () => void
  /** Called when the user taps Reset. The parent is expected to clear the
   *  override state (so `/swap` refetches without urgency) and close the
   *  editor in one motion. */
  onReset: () => void
  /** Which UI surface mounted this editor — used to attribute the
   *  `CustomGasOverridesApplied` analytics event to the correct flow. */
  surface: 'swap_form' | 'dapp_request'
  /** Quote-derived recommended baseline, used when `tx` is unavailable (e.g. a
   *  Permit2-signature swap whose `/swap` is deferred until the user signs).
   *  Snapshotted by the caller so it doesn't jitter across quote polls. */
  recommendedFallback?: RecommendedGasFieldValues
}

/**
 * Editor for the three user-facing gas fields (max base fee, priority fee, gas limit).
 *
 * - Pre-fills from `initialOverrides` (the user's saved override in the settings
 *   store) → falls back to the populated `tx`'s gas fields (which reflect the
 *   current swap response — overrides-applied when saved, baseline otherwise)
 *   → falls back to the gas-service recommended baseline.
 * - Live-validates via `useGasFieldValidation` against the recommended baseline;
 *   Save is blocked while any field has an error, but warnings (e.g.
 *   priority-fee-low) do not block.
 * - Live-computes the projected max cost via `computeMaxCost`, converting to USD.
 * - Reset is a one-tap destructive action: it invokes `onReset`, which clears
 *   the saved override and closes the editor (the resulting `/swap` refetch
 *   shows the baseline values the next time the user opens the editor).
 */
export function NetworkCostEditor({
  tx,
  chainId,
  initialOverrides,
  onSave,
  onCancel,
  onReset,
  surface,
  recommendedFallback,
}: NetworkCostEditorProps): JSX.Element {
  const { t } = useTranslation()
  const { keyboardHeight } = useBottomSheetSafeKeyboard()
  const recommended = useRecommendedGasFields({ tx, fallback: recommendedFallback })
  const initialFromTx = useMemo(() => extractGasFieldsFromTx(tx), [tx])
  const usdChainId = tx?.chainId ?? chainId

  const {
    maxBaseFeeGwei,
    priorityFeeGwei,
    gasLimit,
    isDirty,
    handleChangeMaxBaseFee,
    handleChangePriorityFee,
    handleChangeGasLimit,
  } = useFieldState({ initialOverrides, initialFromTx, recommended })

  const isDirtyAny = isDirty.maxBaseFee || isDirty.priorityFee || isDirty.gasLimit
  const initialHadOverrides = Boolean(
    initialOverrides?.maxBaseFeeGwei || initialOverrides?.priorityFeeGwei || initialOverrides?.gasLimit,
  )
  /** Reset is visible when the user has typed in any field OR when the editor
   *  was opened with pre-existing saved overrides. */
  const shouldShowReset = isDirtyAny || initialHadOverrides

  const validation = useGasFieldValidation({
    values: { maxBaseFeeGwei, priorityFeeGwei, gasLimit },
    recommended,
  })

  const maxCostWei = useMemo(
    () => computeMaxCost({ maxBaseFeeGwei, priorityFeeGwei, gasLimit }),
    [maxBaseFeeGwei, priorityFeeGwei, gasLimit],
  )

  const handleSave = useEvent((): void => {
    if (!validation.canSave || !isDirtyAny) {
      return
    }

    // Build a partial overrides object. Include a field if either:
    //   (a) the user typed into it this session (`isDirty`), OR
    //   (b) it was already present in `initialOverrides` (preserve existing
    //       customizations the user didn't touch this session).
    // Reset is the only way to clear an existing field's override.
    const overrides: GasFeeOverrides = {
      ...(isDirty.maxBaseFee || initialOverrides?.maxBaseFeeGwei
        ? { maxBaseFeeGwei: maxBaseFeeGwei || undefined }
        : {}),
      ...(isDirty.priorityFee || initialOverrides?.priorityFeeGwei
        ? { priorityFeeGwei: priorityFeeGwei || undefined }
        : {}),
      ...(isDirty.gasLimit || initialOverrides?.gasLimit ? { gasLimit: gasLimit || undefined } : {}),
    }

    sendAnalyticsEvent(WalletEventName.CustomGasOverridesApplied, {
      chainId: usdChainId,
      hasMaxBaseFeeOverride: Boolean(overrides.maxBaseFeeGwei),
      hasPriorityFeeOverride: Boolean(overrides.priorityFeeGwei),
      hasGasLimitOverride: Boolean(overrides.gasLimit),
      hasWarning: isDirty.priorityFee && Boolean(validation.priorityFee.warning),
      surface,
    })
    onSave(overrides)
  })

  // Reset sits on the left on web/extension and on the right on mobile (per
  // design); the X close lives on the right and is omitted on mobile.
  const ResetButton = useMemo(
    () =>
      shouldShowReset ? (
        <TouchableArea onPress={onReset}>
          <Text variant="buttonLabel3" color="$accent1">
            {t('common.button.reset')}
          </Text>
        </TouchableArea>
      ) : null,
    [shouldShowReset, onReset, t],
  )

  return (
    <Flex
      gap="$spacing24"
      px={isMobileApp ? '$spacing16' : '$spacing24'}
      pt={isMobileApp ? '$spacing12' : '$spacing24'}
      pb={keyboardHeight || (isMobileApp ? '$spacing12' : '$spacing24')}
    >
      <Flex row alignItems="center">
        <Flex flex={1} flexDirection="row" alignItems="center" justifyContent="flex-start">
          {!isMobileApp && ResetButton}
        </Flex>
        <Text variant="subheading1" textAlign="center">
          {t('gas.override.title')}
        </Text>
        <Flex flex={1} flexDirection="row" alignItems="center" justifyContent="flex-end" gap="$spacing12">
          {isMobileApp && ResetButton}
          {!isMobileApp && (
            <Flex testID="network-cost-editor-close">
              <CloseIconWithHover size="$icon.20" onClose={onCancel} />
            </Flex>
          )}
        </Flex>
      </Flex>

      <Flex gap="$spacing20">
        <GasFieldInput
          autoFocus
          label={t('gas.override.field.maxBaseFee')}
          value={maxBaseFeeGwei}
          hint={
            recommended.recommendedMaxBaseFeeGwei
              ? t('gas.override.current', { value: recommended.recommendedMaxBaseFeeGwei })
              : undefined
          }
          unit="GWEI"
          tooltipKey="maxBaseFee"
          error={isDirty.maxBaseFee ? validation.maxBaseFee.error : undefined}
          warning={isDirty.maxBaseFee ? validation.maxBaseFee.warning : undefined}
          onChangeValue={handleChangeMaxBaseFee}
        />
        <GasFieldInput
          label={t('gas.override.field.priorityFee')}
          value={priorityFeeGwei}
          hint={
            recommended.recommendedPriorityFeeGwei
              ? t('gas.override.auto', { value: recommended.recommendedPriorityFeeGwei })
              : undefined
          }
          unit="GWEI"
          tooltipKey="priorityFee"
          error={isDirty.priorityFee ? validation.priorityFee.error : undefined}
          warning={isDirty.priorityFee ? validation.priorityFee.warning : undefined}
          onChangeValue={handleChangePriorityFee}
        />
        <GasFieldInput
          label={t('gas.override.field.gasLimit')}
          value={gasLimit}
          tooltipKey="gasLimit"
          error={isDirty.gasLimit ? validation.gasLimit.error : undefined}
          warning={isDirty.gasLimit ? validation.gasLimit.warning : undefined}
          onChangeValue={handleChangeGasLimit}
        />

        <MaxCostRow chainId={usdChainId} maxCostWei={maxCostWei} />

        <Flex row gap="$spacing8">
          <Button flex={1} emphasis="secondary" onPress={onCancel}>
            {t('common.button.cancel')}
          </Button>
          <Button flex={1} emphasis="primary" disabled={!isDirtyAny || !validation.canSave} onPress={handleSave}>
            {t('common.button.save')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
