import { memo } from 'react'
import { Flex, getTokenValue, Icons, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface TokenBalanceItemProps {
  portfolioBalance: PortfolioBalance
  onPressToken?: (currencyId: CurrencyId) => void
  isWarmLoading?: boolean
  loading?: boolean
}

export const TOKEN_BALANCE_ITEM_HEIGHT = 56

export const TokenBalanceItem = memo(function _TokenBalanceItem({
  portfolioBalance,
  onPressToken,
  loading,
}: TokenBalanceItemProps) {
  const { quantity, relativeChange24, balanceUSD, currencyInfo } = portfolioBalance
  const { currency } = currencyInfo
  const colors = useSporeColors()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const balanceFormatted = convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenQuantity)

  const onPress = (): void => {
    onPressToken?.(currencyInfo.currencyId)
  }

  // TODO (EXT-297): encapsulate to share better
  const change = relativeChange24 ?? 0

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange ? colors.statusSuccess : colors.statusCritical

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'

  return (
    <Flex
      row
      alignItems="flex-start"
      justifyContent="space-between"
      minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
      py="$spacing8"
      width="100%"
      onPress={onPress}>
      {loading ? (
        <Flex
          backgroundColor="$neutral3"
          borderRadius="$rounded16"
          px="$spacing16"
          py="$spacing12"
        />
      ) : (
        <Flex row alignItems="center" gap="$spacing12" width="100%">
          {/* Currency logo */}
          <RemoteImage
            height={iconSizes.icon40}
            uri={currencyInfo.logoUrl ?? ''}
            width={iconSizes.icon40}
          />

          {/* Currency name */}
          <Flex flex={1.5} flexBasis={0}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="body1">
              {currency.name ?? getSymbolDisplayText(currency.symbol)}
            </Text>
            <Text color="$neutral2" numberOfLines={1} variant="body1">
              {`${formatNumberOrString({
                value: quantity,
                type: NumberType.TokenNonTx,
              })}`}{' '}
              {getSymbolDisplayText(currency.symbol)}
            </Text>
          </Flex>

          {/* Portfolio balance */}
          <Flex fill alignItems="flex-end" justifyContent="flex-end" width={0}>
            <Text ellipsizeMode="tail" numberOfLines={1} variant="body1">
              {balanceUSD === 0 ? 'N/A' : balanceFormatted}
            </Text>
            <Flex row alignItems="center" gap="$spacing4">
              <Icons.ArrowChange
                color={arrowColor.get()}
                rotation={isPositiveChange ? 180 : 0}
                size={getTokenValue('$icon.20')}
              />
              <Text color="$neutral2" numberOfLines={1} variant="body1">
                {formattedChange}
              </Text>
            </Flex>
            <Flex maxWidth={100} />
          </Flex>
        </Flex>
      )}
    </Flex>
  )
})
