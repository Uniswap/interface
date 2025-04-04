import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useSrcColor } from 'hooks/useColor'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityPositionAmountRows({
  currency0Amount,
  currency1Amount,
  fiatValue0,
  fiatValue1,
}: {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  fiatValue0?: CurrencyAmount<Currency>
  fiatValue1?: CurrencyAmount<Currency>
}) {
  const navigate = useNavigate()
  // TODO(WEB-4920): skip GraphQL call once backend provides image URLs
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const totalFiatValue = fiatValue0?.add(fiatValue1 ?? CurrencyAmount.fromRawAmount(fiatValue0.currency, 0))

  const chainUrlParam = getChainInfo(currencyInfo0?.currency.chainId || UniverseChainId.Mainnet).urlParam
  const currency0Link = getTokenDetailsURL({
    address: currencyInfo0?.currency.isToken ? currencyInfo0?.currency.address : undefined, // util handles native addresses
    chainUrlParam,
  })
  const currency1Link = getTokenDetailsURL({
    address: currencyInfo1?.currency.isToken ? currencyInfo1?.currency.address : undefined, // util handles native addresses
    chainUrlParam,
  })

  const [amount0Percent, amount1Percent] = useMemo(() => {
    const percent0 =
      totalFiatValue && totalFiatValue?.toExact() !== '0' && fiatValue0
        ? new Percent(fiatValue0.quotient, totalFiatValue.quotient)
        : undefined

    const percent1 =
      totalFiatValue && totalFiatValue?.toExact() !== '0' && fiatValue1
        ? new Percent(fiatValue1.quotient, totalFiatValue.quotient)
        : undefined

    return [percent0, percent1]
  }, [totalFiatValue, fiatValue0, fiatValue1])

  const colors = useSporeColors()
  const token0Color = useSrcColor(
    currencyInfo0?.logoUrl ?? undefined,
    currencyInfo0?.currency.name,
    colors.surface2.val,
  ).tokenColor
  const token1Color = useSrcColor(
    currencyInfo1?.logoUrl ?? undefined,
    currencyInfo1?.currency.name,
    colors.surface2.val,
  ).tokenColor

  return (
    <Flex gap="$gap8">
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={() => navigate(currency0Link)} {...ClickableTamaguiStyle}>
          <Flex row alignItems="center" gap="$gap12" maxWidth={160}>
            <CurrencyLogo currencyInfo={currencyInfo0} size={20} />
            <Text variant="subheading1" color="neutral1" $lg={{ variant: 'subheading2' }} numberOfLines={1}>
              {formatCurrencyAmount({ value: fiatValue0, type: NumberType.FiatTokenPrice })}
            </Text>
          </Flex>
        </TouchableArea>
        <Flex alignItems="flex-end" gap="$gap4">
          <Flex row alignItems="center" justifyContent="flex-end" gap="$gap4">
            <Text variant="body3" color="$neutral2">
              {formatCurrencyAmount({ value: currency0Amount, type: NumberType.TokenNonTx })}{' '}
              {currency0Amount.currency.symbol}
            </Text>
            {amount0Percent && (
              <Text variant="body3" color="$neutral2">
                ({formatPercent(amount0Percent.toFixed(6))})
              </Text>
            )}
          </Flex>
          {amount0Percent && (
            <Flex borderRadius="$roundedFull" height={4} width={124} backgroundColor="$surface3">
              <Flex
                borderRadius="$roundedFull"
                height={4}
                backgroundColor={token0Color as any}
                position="absolute"
                left={0}
                width={`${formatPercent(amount0Percent.toFixed(6))}`}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={() => navigate(currency1Link)} {...ClickableTamaguiStyle}>
          <Flex row alignItems="center" gap="$gap12" maxWidth={160}>
            <CurrencyLogo currencyInfo={currencyInfo1} size={20} />
            <Text variant="subheading1" color="neutral1" $lg={{ variant: 'subheading2' }} numberOfLines={1}>
              {formatCurrencyAmount({ value: fiatValue1, type: NumberType.FiatTokenPrice })}
            </Text>
          </Flex>
        </TouchableArea>
        <Flex alignItems="flex-end" gap="$gap4">
          <Flex row alignItems="center" justifyContent="flex-end" gap="$gap4">
            <Text variant="body3" color="neutral2">
              {formatCurrencyAmount({ value: currency1Amount, type: NumberType.TokenNonTx })}{' '}
              {currency1Amount.currency.symbol}
            </Text>
            {amount1Percent && (
              <Text variant="body3" color="$neutral2">
                ({formatPercent(amount1Percent.toFixed(6))})
              </Text>
            )}
          </Flex>
          {amount1Percent && (
            <Flex borderRadius="$roundedFull" height={4} width={124} backgroundColor="$surface3">
              <Flex
                borderRadius="$roundedFull"
                height={4}
                backgroundColor={token1Color as any}
                position="absolute"
                right={0}
                width={`${formatPercent(amount1Percent.toFixed(6))}`}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
