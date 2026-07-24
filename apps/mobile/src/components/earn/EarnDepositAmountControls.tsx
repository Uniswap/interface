import type { RefObject } from 'react'
import type { LayoutChangeEvent, TextInput as RNTextInput } from 'react-native'
import { MAX_INPUT_FONT_SIZE } from 'src/components/earn/useEarnAmountInputFontSizing'
import { Flex, SpaceTokens, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import { WithdrawLiquidityInfoPopover } from 'uniswap/src/features/earn/WithdrawLiquidityInfoPopover'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import {
  type LocalizationContextState,
  useLocalizationContext,
} from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const
const QUICK_SELECT_ROW_MIN_HEIGHT = fonts.buttonLabel3.lineHeight + 18

export function EarnHelpIconButton({ onPress }: { onPress: () => void }): JSX.Element {
  return (
    <Flex position="absolute" right={0} top={0} bottom={0} justifyContent="center">
      <TouchableArea testID={TestID.HelpIcon} onPress={onPress}>
        <InfoCircleFilled color="$neutral3" size="$icon.20" />
      </TouchableArea>
    </Flex>
  )
}

export function getFormattedAlternateAmount({
  isFiatInput,
  exactAmountFiat,
  exactAmountToken,
  symbol,
  currencyCode,
  formatNumberOrString,
}: {
  isFiatInput: boolean
  exactAmountFiat: string
  exactAmountToken: string
  symbol: string
  currencyCode: string
  formatNumberOrString: LocalizationContextState['formatNumberOrString']
}): string {
  if (isFiatInput) {
    return `${formatNumberOrString({
      value: exactAmountToken || 0,
      type: NumberType.TokenNonTx,
    })} ${symbol}`
  }
  return formatNumberOrString({
    value: exactAmountFiat || 0,
    type: NumberType.FiatStandard,
    currencyCode,
  })
}

/**
 * Explicit spacing for the amount entry so the default layout stays pixel-equivalent to the prior
 * uniform 12px gap + 16px padding, while short devices reclaim vertical space when the inline error
 * mounts (which would otherwise push the network/balance selector behind the decimal keypad).
 */
export function getAmountEntrySpacing({
  isShortMobileDevice,
  hasInlineError,
}: {
  isShortMobileDevice: boolean
  hasInlineError: boolean
}): { errorGap: SpaceTokens; pb: SpaceTokens } {
  const compact = isShortMobileDevice && hasInlineError
  return {
    errorGap: compact ? '$spacing4' : '$spacing12',
    pb: compact ? '$none' : '$spacing16',
  }
}

export function AmountEntrySection({
  fiatCurrencyInfo,
  fontSize,
  formattedAlternateAmount,
  hasAmount,
  inputRef,
  inlineError,
  isFiatInput,
  isShortMobileDevice,
  maxDecimals,
  maxLabel,
  onInputLayout,
  onPercentPress,
  onToggleInputMode,
  setActiveAmount,
  symbol,
  value,
}: {
  fiatCurrencyInfo: FiatCurrencyInfo
  fontSize: number
  formattedAlternateAmount: string
  hasAmount: boolean
  inputRef: RefObject<RNTextInput | null>
  inlineError?: string
  isFiatInput: boolean
  isShortMobileDevice: boolean
  maxDecimals: number
  maxLabel: string
  onInputLayout: (event: LayoutChangeEvent) => void
  onPercentPress: (pct: number) => void
  onToggleInputMode: () => void
  setActiveAmount: (next: string) => void
  symbol: string
  value: string
}): JSX.Element {
  const { errorGap, pb } = getAmountEntrySpacing({ isShortMobileDevice, hasInlineError: Boolean(inlineError) })

  return (
    <Flex alignItems="center" pt="$spacing16" pb={pb} onLayout={onInputLayout}>
      {/* Mirrors FiatOnRampAmountSection: center-aligned row, symbol as a TextInput sized like the
          amount input (Text vs TextInput baselines diverge on iOS), and no lineHeight — heading1's
          0.96 line height clips ascenders when applied to a TextInput. The key remounts the symbol
          on mode toggle: a non-editing TextInput doesn't re-measure its intrinsic width when `value`
          changes ($ ↔ symbol), which strands the row off-center until an unrelated re-render. */}
      <Flex alignItems="center" justifyContent="center" flexDirection={isFiatInput ? 'row' : 'row-reverse'}>
        <TextInput
          key={isFiatInput ? 'fiat-symbol' : 'token-symbol'}
          allowFontScaling
          disabled
          color={value ? '$neutral1' : '$neutral3'}
          fontFamily="$heading"
          fontSize={fontSize}
          fontWeight="$book"
          height={fontSize + 5}
          maxFontSizeMultiplier={fonts.heading1.maxFontSizeMultiplier}
          minHeight={MAX_INPUT_FONT_SIZE}
          px="$none"
          py="$none"
          testID={TestID.EarnAmountSymbol}
          value={isFiatInput ? fiatCurrencyInfo.symbol : ` ${symbol}`}
        />
        <AmountInput
          ref={inputRef}
          adjustWidthToContent
          autoFocus
          alignSelf="stretch"
          backgroundColor="$transparent"
          borderWidth="$none"
          fiatCurrencyInfo={fiatCurrencyInfo}
          fontFamily="$heading"
          fontSize={fontSize}
          fontWeight="$book"
          height={fontSize + 5}
          maxDecimals={maxDecimals}
          maxFontSizeMultiplier={fonts.heading1.maxFontSizeMultiplier}
          minHeight={MAX_INPUT_FONT_SIZE}
          placeholder="0"
          placeholderTextColor="$neutral3"
          px="$none"
          py="$none"
          returnKeyType={undefined}
          showSoftInputOnFocus={false}
          textAlign={isFiatInput ? 'left' : 'right'}
          value={value}
          onChangeText={setActiveAmount}
        />
      </Flex>

      <Flex centered mt="$spacing12" minHeight={QUICK_SELECT_ROW_MIN_HEIGHT}>
        {hasAmount ? (
          <TouchableArea onPress={onToggleInputMode}>
            <Flex row alignItems="center" gap="$spacing4">
              <Text color="$neutral2" variant="subheading1">
                {formattedAlternateAmount}
              </Text>
              <ArrowDownArrowUp color="$neutral2" size="$icon.16" />
            </Flex>
          </TouchableArea>
        ) : (
          <Flex row gap="$spacing8" justifyContent="center">
            {PERCENT_OPTIONS.map((pct) => (
              <PercentPill
                key={pct}
                label={pct === 1 ? maxLabel : `${Math.round(pct * 100)}%`}
                onPress={() => onPercentPress(pct)}
              />
            ))}
          </Flex>
        )}
      </Flex>

      {inlineError && (
        <Flex mt={errorGap}>
          <EarnInlineError message={inlineError} />
        </Flex>
      )}
    </Flex>
  )
}

export function DepositSourceRowContent({
  apyLabel,
  availableLabel,
  currencyInfo,
  isWithdrawing,
  lowLiquidityAvailableAmount,
  lowLiquidityTotalAmount,
  showLowLiquidityInfo = false,
  showChevron = false,
}: {
  apyLabel: string
  availableLabel: string
  currencyInfo: CurrencyInfo | undefined
  isWithdrawing: boolean
  lowLiquidityAvailableAmount?: string
  lowLiquidityTotalAmount?: string
  showLowLiquidityInfo?: boolean
  showChevron?: boolean
}): JSX.Element {
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <Flex row alignItems="center" gap="$spacing12">
        <TokenLogo
          url={currencyInfo?.logoUrl}
          size={iconSizes.icon36}
          chainId={currency?.chainId}
          symbol={symbol}
          name={currency?.name}
        />
        <Flex>
          <Text color="$neutral1" variant="body2">
            {currency?.name ?? symbol}
          </Text>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" variant="body3">
              {availableLabel}
            </Text>
            {showLowLiquidityInfo && (
              <WithdrawLiquidityInfoPopover
                currencyInfo={currencyInfo}
                depositedBalanceFormatted={lowLiquidityTotalAmount ?? ''}
                withdrawableBalanceFormatted={lowLiquidityAvailableAmount ?? ''}
              />
            )}
          </Flex>
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        {isWithdrawing && (
          <Text color="$accent1" variant="body3">
            {apyLabel}
          </Text>
        )}
        {showChevron && <RotatableChevron color="$neutral3" direction="end" size="$icon.16" />}
      </Flex>
    </Flex>
  )
}

export function DepositSourceMenuItem({
  canonicalTokenName,
  option,
}: {
  canonicalTokenName?: string
  option: EarnDepositSourceOption
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { currencyInfo, balanceQuantity, balanceUsd } = option
  const { currency } = currencyInfo
  const tokenName = canonicalTokenName ?? currency.name ?? currency.symbol ?? ''
  const chainScopedName = `${getChainInfo(option.chainId).label} ${currency.symbol ?? ''}`.trim()

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing12"
      minWidth={260}
      px="$spacing8"
      py="$spacing8"
    >
      <Flex row alignItems="center" gap="$spacing12" flexShrink={1}>
        <TokenLogo
          url={currencyInfo.logoUrl}
          size={iconSizes.icon32}
          chainId={currency.chainId}
          symbol={currency.symbol}
          name={currency.name}
        />
        <Flex flexShrink={1}>
          <Text color="$neutral1" variant="body2" numberOfLines={1}>
            {tokenName}
          </Text>
          <Text color="$neutral2" variant="body3" numberOfLines={1}>
            {chainScopedName}
          </Text>
        </Flex>
      </Flex>
      <Flex alignItems="flex-end">
        <Text color="$neutral1" variant="body2">
          {convertFiatAmountFormatted(balanceUsd, NumberType.FiatStandard)}
        </Text>
        <Text color="$neutral2" variant="body3">
          {formatNumberOrString({
            value: balanceQuantity,
            type: NumberType.TokenNonTx,
          })}
        </Text>
      </Flex>
    </Flex>
  )
}

export function PercentPill({ label, onPress }: { label: string; onPress: () => void }): JSX.Element {
  const colors = useSporeColors()
  return (
    <TouchableArea onPress={onPress}>
      <Pill
        backgroundColor="$surface1"
        customBorderColor={colors.surface3.val}
        foregroundColor={colors.neutral2.val}
        label={label}
        px="$spacing12"
        py="$spacing8"
        textVariant="buttonLabel3"
      />
    </TouchableArea>
  )
}
