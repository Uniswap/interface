import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Gas } from 'ui/src/components/icons/Gas'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SponsoredFeeWithModal, UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { useFormGasOverridesController } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/useFormGasOverridesController'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isZero } from 'uniswap/src/utils/number'

/**
 * Custom-gas variant of `<GasInfoRow>`, rendered when
 * `FeatureFlags.GasFeeOverrides` is on AND the wallet-level mode is `'custom'`
 * (the caller in `<TradeInfoRow>` enforces both gates). Renders the two
 * Figma-mandated visual states:
 *
 *  - No overrides saved: appends an "Auto" pill next to the gas amount.
 *    Annotation (Figma node 5602:56307): "'Auto' label appended to gas
 *    estimate when: 1. Custom gas enabled  2. User has not edited default
 *    amount.  Tapping displays custom network cost sheet."
 *  - Overrides saved: appends a chevron next to the gas amount.
 *    Annotation (Figma node 5613:94085): "Chevron replaces 'Auto' label when
 *    values have been edited. On tap, open custom gas settings sheet."
 *
 * For parity with the web `<NetworkCostRow>`, an amber alert icon also renders
 * when saved overrides trigger a validation warning.
 *
 * Styling intentionally mirrors the existing mobile `<GasInfoRow>` aesthetic
 * (gas amount in `$neutral2`, `$statusCritical` when the fee is high relative
 * to the input value) rather than the web `<NetworkCostRow>` (which uses
 * `$neutral1` since it's a labeled row, not a chip). The Auto pill / chevron
 * / amber-warning affordances are the points of parity with the web row;
 * the underlying amount-text color follows mobile precedent.
 *
 * Tap routes — via the shared `useFormGasOverridesController` — to the editor
 * or the crosschain-not-supported modal. (The auto-tooltip branch is
 * unreachable here because Auto-mode users see `<GasInfoRow>` upstream, but
 * the controller hook is generic across web + native and keeps that branch.)
 */
export function GasInfoRowWithCustomGasEnabled({ gasInfo }: { gasInfo: GasInfo }): JSX.Element {
  const { txRequests, isUniswapXTrade } = useSwapTxStore((s) => ({
    txRequests: isUniswapX(s) ? undefined : 'txRequests' in s ? s.txRequests : undefined,
    isUniswapXTrade: isUniswapX(s),
  }))
  const gasOverrides = useTransactionSettingsStore((s) => s.gasOverrides)
  const tx = txRequests?.[0]
  const { hasOverrides, hasWarning } = useGasOverridesWarningState({ tx, gasOverrides })
  const { onPress, modals } = useFormGasOverridesController({ tx, chainId: gasInfo.chainId })

  // `{modals}` and `<CustomGasChip>` are two fixed-position siblings. The open
  // editor sheet inside `{modals}` holds the user's in-progress input
  // (`useFieldState`), which React discards if it remounts the subtree — so the
  // modal must keep a stable position across quote polls and EVM↔UniswapX trade
  // changes. Isolating the chip's no-fiat / UniswapX / normal render states
  // inside `<CustomGasChip>` is what guarantees that: the chip is a single
  // stable-typed sibling here, so its internal branches can never shift
  // `{modals}` out of index 0 (React reconciles a keyless Fragment's children
  // by position).
  return (
    <>
      {modals}

      <CustomGasChip
        gasInfo={gasInfo}
        isUniswapXTrade={isUniswapXTrade}
        hasOverrides={hasOverrides}
        hasWarning={hasWarning}
        onPress={onPress}
      />
    </>
  )
}

/**
 * The tappable gas chip itself. Encapsulating its render states behind a stable
 * component boundary keeps the sibling `{modals}` at a fixed position in the
 * parent (see the note in `GasInfoRowWithCustomGasEnabled`). Returning `null`
 * or switching between the UniswapX/normal layouts only re-renders this
 * component's own subtree — it never reorders the parent's children.
 */
function CustomGasChip({
  gasInfo,
  isUniswapXTrade,
  hasOverrides,
  hasWarning,
  onPress,
}: {
  gasInfo: GasInfo
  isUniswapXTrade: boolean
  hasOverrides: boolean
  hasWarning: boolean
  onPress: () => void
}): JSX.Element | null {
  const { t } = useTranslation()

  if (!gasInfo.fiatPriceFormatted) {
    return null
  }

  const uniswapXSavings = gasInfo.uniswapXGasFeeInfo?.preSavingsGasFeeFormatted
  const isGasFeeFree = gasInfo.gasFee.value !== undefined && isZero(gasInfo.gasFee.value)

  // Do not render custom gas tap handler for sponsored swaps
  if (gasInfo.sponsorshipInfo?.sponsorMetadata) {
    return (
      <Flex
        centered
        row
        gap="$spacing4"
        animation="quick"
        enterStyle={{ opacity: 0 }}
        opacity={gasInfo.isLoading ? 0.6 : 1}
      >
        <SponsoredFeeWithModal
          sponsorMetadata={gasInfo.sponsorshipInfo.sponsorMetadata}
          campaign={gasInfo.sponsorshipInfo.campaign}
          preSavingsGasFee={gasInfo.fiatPriceFormatted}
        />
      </Flex>
    )
  }

  // UniswapX trades have no editable EVM tx (txRequests is forced to undefined
  // upstream), so opening the editor would yield no recommended baseline and
  // any saved overrides would carry into the next EVM swap. Render the static
  // UniswapX fee display without a tap handler.
  if (isUniswapXTrade) {
    return uniswapXSavings ? (
      <Flex
        centered
        row
        gap="$spacing4"
        animation="quick"
        enterStyle={{ opacity: 0 }}
        opacity={gasInfo.isLoading ? 0.6 : 1}
      >
        <UniswapXFee gasFee={gasInfo.fiatPriceFormatted} isFree={isGasFeeFree} preSavingsGasFee={uniswapXSavings} />
      </Flex>
    ) : null
  }

  const showAutoPill = !hasOverrides
  const showWarning = hasOverrides && hasWarning
  const amountColor = showWarning ? '$statusWarning' : gasInfo.isHighRelativeToValue ? '$statusCritical' : '$neutral2'

  return (
    <TouchableArea testID="gas-info-row-custom-gas" onPress={onPress}>
      <Flex
        centered
        row
        gap="$spacing4"
        animation="quick"
        enterStyle={{ opacity: 0 }}
        opacity={gasInfo.isLoading ? 0.6 : 1}
      >
        <Gas color={amountColor} size="$icon.16" />
        {showWarning && (
          <AlertTriangleFilled testID="gas-info-row-custom-gas-warning-icon" color="$statusWarning" size="$icon.16" />
        )}
        <Text color={amountColor} variant="body3">
          {gasInfo.fiatPriceFormatted}
        </Text>
        {showAutoPill && (
          <Flex centered backgroundColor="$surface3" borderRadius="$rounded6" height={20} px="$spacing8">
            <Text color="$neutral1" variant="buttonLabel4" lineHeight={16}>
              {t('common.auto')}
            </Text>
          </Flex>
        )}
        {hasOverrides && (
          <RotatableChevron
            testID="gas-info-row-custom-gas-chevron"
            color="$neutral3"
            direction="right"
            size="$icon.16"
          />
        )}
      </Flex>
    </TouchableArea>
  )
}
