import type { RefObject } from 'react'
import type { LayoutChangeEvent, TextInput as RNTextInput } from 'react-native'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import { WithdrawLiquidityInfoPopover } from 'uniswap/src/features/earn/WithdrawLiquidityInfoPopover'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { openUri } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'

const SUFFIX_FONT_RATIO = 0.4
const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const
const QUICK_SELECT_ROW_MIN_HEIGHT = fonts.buttonLabel3.lineHeight + 18

export function EarnHelpIconButton(): JSX.Element {
  return (
    <TouchableArea
      position="absolute"
      right={0}
      top="$spacing6"
      onPress={() =>
        openUri({ uri: UniswapHelpUrls.articles.earnHelp, openExternalBrowser: true, isSafeUri: true }).catch(
          () => undefined,
        )
      }
    >
      <InfoCircleFilled color="$neutral3" size="$icon.20" />
    </TouchableArea>
  )
}

export function getFormattedAlternateAmount({
  isFiatInput,
  exactAmountFiat,
  exactAmountToken,
  symbol,
  fiatCurrencyInfo,
}: {
  isFiatInput: boolean
  exactAmountFiat: string
  exactAmountToken: string
  symbol: string
  fiatCurrencyInfo: FiatCurrencyInfo
}): string {
  if (isFiatInput) {
    return `${exactAmountToken || '0'} ${symbol}`
  }
  return `${fiatCurrencyInfo.symbol}${exactAmountFiat || '0'}`
}

export function AmountEntrySection({
  fiatCurrencyInfo,
  fontSize,
  formattedAlternateAmount,
  hasAmount,
  inputRef,
  inlineError,
  isFiatInput,
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
  maxDecimals: number
  maxLabel: string
  onInputLayout: (event: LayoutChangeEvent) => void
  onPercentPress: (pct: number) => void
  onToggleInputMode: () => void
  setActiveAmount: (next: string) => void
  symbol: string
  value: string
}): JSX.Element {
  const inputLineHeight = fontSize + 4
  const showFiatPlaceholder = isFiatInput && !value
  const focusInput = (): void => {
    inputRef.current?.focus()
  }

  return (
    <Flex alignItems="center" gap="$spacing12" py="$spacing16" onLayout={onInputLayout}>
      <Flex row alignItems="center" justifyContent="center">
        {showFiatPlaceholder ? (
          <TouchableArea onPress={focusInput}>
            <Text
              color="$neutral3"
              fontFamily="$heading"
              fontSize={fontSize}
              fontWeight="$book"
              lineHeight={inputLineHeight}
              maxFontSizeMultiplier={fonts.heading1.maxFontSizeMultiplier}
            >
              {`${fiatCurrencyInfo.symbol}0`}
            </Text>
          </TouchableArea>
        ) : null}
        {isFiatInput && !showFiatPlaceholder && (
          <Text
            color="$neutral1"
            fontFamily="$heading"
            fontSize={fontSize}
            fontWeight="$book"
            lineHeight={inputLineHeight}
            maxFontSizeMultiplier={fonts.heading1.maxFontSizeMultiplier}
          >
            {fiatCurrencyInfo.symbol}
          </Text>
        )}
        <AmountInput
          ref={inputRef}
          adjustWidthToContent
          autoFocus
          opacity={showFiatPlaceholder ? 0 : undefined}
          pointerEvents={showFiatPlaceholder ? 'none' : undefined}
          position={showFiatPlaceholder ? 'absolute' : undefined}
          backgroundColor="$transparent"
          borderWidth="$none"
          fiatCurrencyInfo={fiatCurrencyInfo}
          fontFamily="$heading"
          fontSize={fontSize}
          fontWeight="$book"
          height={inputLineHeight}
          lineHeight={inputLineHeight}
          maxDecimals={maxDecimals}
          maxFontSizeMultiplier={fonts.heading1.maxFontSizeMultiplier}
          minHeight={inputLineHeight}
          placeholder="0"
          placeholderTextColor="$neutral3"
          px="$none"
          py="$none"
          returnKeyType={undefined}
          showSoftInputOnFocus={false}
          value={value}
          onChangeText={setActiveAmount}
        />
        {!isFiatInput && (
          <Text color="$neutral2" fontSize={fontSize * SUFFIX_FONT_RATIO} ml="$spacing4">
            {symbol}
          </Text>
        )}
      </Flex>

      <Flex centered minHeight={QUICK_SELECT_ROW_MIN_HEIGHT}>
        {hasAmount ? (
          <TouchableArea onPress={onToggleInputMode}>
            <Flex row alignItems="center" gap="$spacing4">
              <ArrowDownArrowUp color="$neutral2" size="$icon.16" />
              <Text color="$neutral2" variant="subheading2">
                {formattedAlternateAmount}
              </Text>
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

      {inlineError && <EarnInlineError message={inlineError} />}
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
          size={iconSizes.icon32}
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
        {showChevron && <RotatableChevron color="$neutral3" direction="down" size="$icon.16" />}
      </Flex>
    </Flex>
  )
}

export function DepositSourceMenuItem({ option }: { option: EarnDepositSourceOption }): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { currencyInfo, balanceQuantity, balanceUsd } = option
  const { currency } = currencyInfo
  const tokenName = currency.name ?? currency.symbol ?? ''
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
