import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { SparklineMap } from '~/appGraphql/data/types'
import { SparklineChart } from '~/components/Charts/SparklineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { pickPrimaryDeployment } from '~/features/Explore/state/listTokens/utils/pickPrimaryDeployment'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'

export const TOKEN_CARD_WIDTH = 168

export const CARD_SPACING = 12

export function TokenCarouselCard({ token, sparklines }: { token: RankedMultichainToken; sparklines: SparklineMap }) {
  const mc = token.multichainToken
  const primary = mc
    ? pickPrimaryDeployment({ addresses: mc.addresses, exploreChainId: undefined, chainStats: token.chainStats })
    : undefined
  if (!mc || !primary) {
    return null
  }
  return (
    <TokenCarouselCardContent
      multichainId={mc.multichainId}
      name={mc.name}
      chainId={primary.chainId as UniverseChainId}
      address={primary.address}
      price={mc.price?.spotUsd}
      priceChange1d={mc.price?.percentChange1d}
      sparklines={sparklines}
    />
  )
}

interface TokenCarouselCardContentProps {
  multichainId: string
  name: string
  chainId: UniverseChainId
  address: string
  price: number | undefined
  priceChange1d: number | undefined
  sparklines: SparklineMap
}

function TokenCarouselCardContent({
  multichainId,
  name,
  chainId,
  address,
  price,
  priceChange1d,
  sparklines,
}: TokenCarouselCardContentProps) {
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const navigateToTokenDetails = useNavigateToTokenDetails()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, address))

  return (
    <TouchableArea
      width={TOKEN_CARD_WIDTH}
      gap="$gap12"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      borderColor="$surface3"
      px={CARD_SPACING}
      py="$spacing16"
      onPress={() => {
        navigateToTokenDetails(currencyInfo?.currency)
      }}
    >
      <Flex row>
        <CurrencyLogo currencyInfo={currencyInfo} size={32} />
        <SparklineChart
          width={64}
          height={32}
          multichainId={multichainId}
          pricePercentChange={priceChange1d}
          sparklineMap={sparklines}
        />
      </Flex>
      <Text numberOfLines={1} variant="body2">
        {name}
      </Text>
      <Flex gap="$gap4">
        <Flex row gap="$gap4" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
          </Text>
        </Flex>
        <Flex row gap="$gap4" alignItems="center">
          <DeltaArrow delta={priceChange1d} formattedDelta={formatPercent(priceChange1d)} />
          <Text variant="body3" color="$neutral2">
            {formatPercent(Math.abs(priceChange1d ?? 0))}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
