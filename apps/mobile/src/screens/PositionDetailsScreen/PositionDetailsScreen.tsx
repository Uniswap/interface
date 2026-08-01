import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { PositionDetailsHero } from 'src/screens/PositionDetailsScreen/components/PositionDetailsHero'
import { PositionDetailsLoader } from 'src/screens/PositionDetailsScreen/components/PositionDetailsLoader'
import { PositionDetailsMenu } from 'src/screens/PositionDetailsScreen/components/PositionDetailsMenu'
import { PositionDetailsStats } from 'src/screens/PositionDetailsScreen/components/PositionDetailsStats'
import { PositionFeesUnavailable } from 'src/screens/PositionDetailsScreen/components/PositionFeesUnavailable'
import { PositionTokenBreakdown } from 'src/screens/PositionDetailsScreen/components/PositionTokenBreakdown'
import { Flex, ScrollView, Separator, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { usePriceRangeUsd } from 'uniswap/src/features/positions/hooks/usePriceRangeUsd'
import { parseRestPosition } from 'uniswap/src/features/positions/parseRestPosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function PositionDetailsScreen({ route }: AppStackScreenProp<MobileScreens.PositionDetails>): JSX.Element {
  const { poolId, tokenId, chainId, protocolVersion, owner: ownerParam } = route.params
  const { t } = useTranslation()
  const insets = useAppInsets()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const owner = ownerParam ?? activeAccountAddress
  const isOwnPosition = areEvmAddressesEqual(owner, activeAccountAddress)

  const isV2 = protocolVersion === ProtocolVersion.V2
  const { data, isLoading } = useGetPositionQuery({
    owner,
    chainId,
    protocolVersion,
    tokenId: tokenId ?? '',
    pairAddress: isV2 ? poolId : '',
  })

  const positionInfo = useMemo(() => parseRestPosition(data?.position), [data?.position])

  return (
    <Trace directFromPage logImpression screen={MobileScreens.PositionDetails}>
      <ScreenWithHeader
        rightElement={positionInfo && isOwnPosition ? <PositionDetailsMenu positionInfo={positionInfo} /> : undefined}
      >
        {positionInfo ? (
          <PositionDetailsContent positionInfo={positionInfo} bottomInset={insets.bottom} />
        ) : isLoading ? (
          <PositionDetailsLoader />
        ) : (
          <Flex fill alignItems="center" justifyContent="center" px="$spacing24">
            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('position.notFound')}
            </Text>
          </Flex>
        )}
      </ScreenWithHeader>
    </Trace>
  )
}

function PositionDetailsContent({
  positionInfo,
  bottomInset,
}: {
  positionInfo: PositionInfo
  bottomInset: number
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString, formatPercent } = useLocalizationContext()
  const [priceInverted, setPriceInverted] = useState(false)

  const {
    currency0Amount,
    currency1Amount,
    status,
    version,
    totalValueUsd,
    uncollectedFeesUsd,
    fee0Amount,
    fee1Amount,
    apr,
  } = positionInfo

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(currency0Amount.currency),
    currencyId(currency1Amount.currency),
  ])

  // Pair (V2), V3Pool, and V4Pool all expose token0Price/token1Price, which drive the conversion
  // text and the allocation bar split.
  const token0Price = positionInfo.poolOrPair?.token0Price
  const token1Price = positionInfo.poolOrPair?.token1Price

  const rangePrices = useMemo(() => {
    if (positionInfo.version === ProtocolVersion.V2 || !positionInfo.position) {
      return {}
    }
    const sdkPosition = positionInfo.position
    return {
      priceLower: sdkPosition.token0PriceLower,
      priceUpper: sdkPosition.token0PriceUpper,
    }
  }, [positionInfo])

  const { minPrice, maxPrice, marketPrice } = usePriceRangeUsd({
    priceLower: rangePrices.priceLower,
    priceUpper: rangePrices.priceUpper,
    token0Price,
    token1Price,
    priceInverted,
    tickSpacing: positionInfo.tickSpacing,
    tickLower: positionInfo.tickLower,
    tickUpper: positionInfo.tickUpper,
  })

  const conversionText = useMemo(() => {
    const directionalPrice = priceInverted ? token1Price : token0Price
    if (!directionalPrice) {
      return undefined
    }
    const baseSymbol = priceInverted ? currency1Amount.currency.symbol : currency0Amount.currency.symbol
    const quoteSymbol = priceInverted ? currency0Amount.currency.symbol : currency1Amount.currency.symbol
    const formattedPrice = formatNumberOrString({ value: directionalPrice.toSignificant(), type: NumberType.TokenTx })
    return `1 ${baseSymbol} = ${formattedPrice} ${quoteSymbol}`
  }, [
    priceInverted,
    token0Price,
    token1Price,
    currency0Amount.currency.symbol,
    currency1Amount.currency.symbol,
    formatNumberOrString,
  ])

  const positionValueFormatted = convertFiatAmountFormatted(
    status === PositionStatus.CLOSED ? 0 : totalValueUsd,
    NumberType.FiatTokenQuantity,
  )
  const feesValueFormatted = convertFiatAmountFormatted(uncollectedFeesUsd, NumberType.FiatRewards)

  const totalApr = version === ProtocolVersion.V4 ? (positionInfo.totalApr ?? apr) : apr
  const aprText = totalApr !== undefined ? formatPercent(totalApr) : undefined

  const isV2 = version === ProtocolVersion.V2
  const isClosed = status === PositionStatus.CLOSED

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Flex gap="$spacing20" pb={bottomInset + spacing.spacing24} pt="$spacing12" px="$spacing24">
        <PositionDetailsHero
          conversionText={conversionText}
          currency0Info={currency0Info}
          currency1Info={currency1Info}
          formattedValue={positionValueFormatted}
          positionInfo={positionInfo}
          onTogglePriceDirection={() => setPriceInverted((prev) => !prev)}
        />

        <PositionDetailsStats
          aprText={aprText}
          isV2={isV2}
          marketPrice={marketPrice}
          maxPrice={maxPrice}
          minPrice={minPrice}
          status={status}
        />

        <Separator />

        <PositionTokenBreakdown
          amount0={isClosed ? undefined : currency0Amount}
          amount1={isClosed ? undefined : currency1Amount}
          currency0Info={currency0Info}
          currency1Info={currency1Info}
          formattedValue={positionValueFormatted}
          label={t('pool.position.your')}
          token0Price={token0Price}
        />

        {isV2 ? (
          <>
            <Separator />
            <PositionFeesUnavailable />
          </>
        ) : isClosed ? (
          <>
            <Separator />
            <PositionTokenBreakdown
              currency0Info={currency0Info}
              currency1Info={currency1Info}
              formattedValue={feesValueFormatted}
              label={t('common.feesEarned')}
            />
          </>
        ) : fee0Amount && fee1Amount ? (
          <>
            <Separator />
            <PositionTokenBreakdown
              amount0={fee0Amount}
              amount1={fee1Amount}
              currency0Info={currency0Info}
              currency1Info={currency1Info}
              formattedValue={feesValueFormatted}
              label={t('common.feesEarned')}
              token0Price={token0Price}
            />
          </>
        ) : null}
      </Flex>
    </ScrollView>
  )
}
