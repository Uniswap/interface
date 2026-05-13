import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { fonts } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { PercentButton } from '~/pages/Liquidity/CreateAuction/components/PercentButton'
import {
  expandCompactNumberInput,
  isAllowedCompactNumberInput,
  percentOfAmount,
} from '~/pages/Liquidity/CreateAuction/utils'

const QUICK_SELECT_PERCENTS = [2, 5, 10] as const

/**
 * Parses a suffixed input string into a CurrencyAmount with exact precision.
 */
function parseSuffixedAmount(input: string, currency: Currency): CurrencyAmount<Currency> | null {
  const expanded = expandCompactNumberInput(input)
  if (!expanded) {
    return null
  }
  return tryParseCurrencyAmount(expanded, currency) ?? null
}

interface AuctionSupplySelectorProps {
  auctionSupplyAmount: CurrencyAmount<Currency>
  tokenTotalSupply: CurrencyAmount<Currency>
  tokenSymbol: string
  onSelectPercent: (percent: number) => void
  onAmountChange: (amount: CurrencyAmount<Currency>) => void
}

export function AuctionSupplySelector({
  auctionSupplyAmount,
  tokenTotalSupply,
  tokenSymbol,
  onSelectPercent,
  onAmountChange,
}: AuctionSupplySelectorProps) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const currency = tokenTotalSupply.currency

  const formatAmount = (amount: CurrencyAmount<Currency>): string =>
    formatNumberOrString({
      value: amount.toExact(),
      type: NumberType.TokenQuantityStats,
      placeholder: '0',
    })

  const displayValue = formatAmount(auctionSupplyAmount)
  const totalSupplyFormatted = formatAmount(tokenTotalSupply)

  // While focused, parse typed value into a CurrencyAmount for exact comparison
  const parsedAmount = useMemo(
    () => (isFocused ? parseSuffixedAmount(rawInput, currency) : null),
    [isFocused, rawInput, currency],
  )
  const exceedsTotalSupply = parsedAmount !== null && parsedAmount.greaterThan(tokenTotalSupply)

  const handleChange = useCallback(
    (value: string) => {
      if (!isAllowedCompactNumberInput(value)) {
        return
      }
      setRawInput(value)

      const parsed = parseSuffixedAmount(value, currency)
      if (!parsed) {
        return
      }

      // Live-update with exact amount; cap to total supply so the store stays valid
      const capped = parsed.greaterThan(tokenTotalSupply) ? tokenTotalSupply : parsed
      onAmountChange(capped)
    },
    [currency, tokenTotalSupply, onAmountChange],
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // Seed the input with the current raw numeric value (unformatted)
    const exactValue = auctionSupplyAmount.toExact()
    setRawInput(exactValue === '0' ? '' : exactValue)
  }, [auctionSupplyAmount])

  const handleBlur = useCallback(() => {
    setIsFocused(false)

    const parsed = parseSuffixedAmount(rawInput, currency)
    if (!parsed) {
      return
    }

    // Cap to total supply on blur
    const capped = parsed.greaterThan(tokenTotalSupply) ? tokenTotalSupply : parsed
    onAmountChange(capped)
  }, [rawInput, currency, tokenTotalSupply, onAmountChange])

  const handleSelectPercent = useCallback(
    (percent: number) => {
      setIsFocused(false)
      setRawInput('')
      onSelectPercent(percent)
    },
    [onSelectPercent],
  )

  return (
    <Flex
      backgroundColor="$surface2"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing8"
    >
      {/* Header: "Deposit amount" + help icon */}
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="buttonLabel3" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.depositAmount')}
        </Text>
        <QuestionInCircleFilled size="$icon.16" color="$neutral3" />
      </Flex>

      {/* Input row: amount + symbol on left, quick selects on right */}
      <Flex row alignItems="center">
        <Flex flex={1} flexBasis={0} minWidth={0} gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing4">
            {isFocused ? (
              <Input
                autoFocus
                height={fonts.heading3.lineHeight}
                $platform-web={{
                  fieldSizing: 'content',
                  minWidth: '1ch',
                  maxWidth: '100%',
                }}
                value={rawInput}
                onChangeText={handleChange}
                onBlur={handleBlur}
                placeholder="0"
                placeholderTextColor="$neutral3"
                fontSize={fonts.heading3.fontSize}
                lineHeight={fonts.heading3.lineHeight}
                fontWeight={fonts.heading3.fontWeight}
                color={exceedsTotalSupply ? '$statusCritical' : '$neutral1'}
                px="$none"
                backgroundColor="$transparent"
              />
            ) : (
              <Text variant="heading3" color="$neutral1" cursor="text" onPress={handleFocus}>
                {displayValue}
              </Text>
            )}
            <Text variant="heading3" color="$neutral3">
              {tokenSymbol}
            </Text>
          </Flex>
          <Text variant="body4" color="$neutral2">
            {t('toucan.auction.totalSupply')}: {totalSupplyFormatted} {tokenSymbol}
          </Text>
        </Flex>

        <Flex row flex={1} flexBasis={0} minWidth={0} gap="$spacing2">
          {QUICK_SELECT_PERCENTS.map((pillPercent) => (
            <PercentButton
              key={pillPercent}
              label={`${pillPercent}%`}
              isActive={auctionSupplyAmount.equalTo(percentOfAmount(tokenTotalSupply, pillPercent))}
              onPress={handleSelectPercent.bind(null, pillPercent)}
            />
          ))}
          <PercentButton
            label={t('common.max')}
            isActive={auctionSupplyAmount.equalTo(tokenTotalSupply)}
            onPress={handleSelectPercent.bind(null, 100)}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
