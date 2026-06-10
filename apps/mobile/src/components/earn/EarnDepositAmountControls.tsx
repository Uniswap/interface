import type { RefObject } from 'react'
import type { LayoutChangeEvent, TextInput as RNTextInput } from 'react-native'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const SUFFIX_FONT_RATIO = 0.4
const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const

export function AmountEntrySection({
  fiatCurrencyInfo,
  fontSize,
  formattedAlternateAmount,
  hasAmount,
  inputRef,
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
  return (
    <Flex alignItems="center" gap="$spacing12" py="$spacing16" onLayout={onInputLayout}>
      <Flex row alignItems="center" justifyContent="center">
        {isFiatInput && (
          <Text
            color={value ? '$neutral1' : '$neutral3'}
            fontSize={fontSize}
            fontWeight="$book"
            lineHeight={fontSize + 4}
          >
            {fiatCurrencyInfo.symbol}
          </Text>
        )}
        <AmountInput
          ref={inputRef}
          adjustWidthToContent
          autoFocus
          backgroundColor="$transparent"
          borderWidth="$none"
          fiatCurrencyInfo={fiatCurrencyInfo}
          fontFamily="$heading"
          fontSize={fontSize}
          fontWeight="$book"
          height={fontSize + 5}
          maxDecimals={maxDecimals}
          maxFontSizeMultiplier={fonts.heading1.maxFontSizeMultiplier}
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
  )
}

export function DepositSourceRowContent({
  apyLabel,
  availableLabel,
  currencyInfo,
  isWithdrawing,
  showChevron = false,
}: {
  apyLabel: string
  availableLabel: string
  currencyInfo: CurrencyInfo | undefined
  isWithdrawing: boolean
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
          {!isWithdrawing && (
            <Text color="$neutral2" variant="body3">
              {availableLabel}
            </Text>
          )}
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
        px="$spacing16"
        textVariant="buttonLabel3"
      />
    </TouchableArea>
  )
}
