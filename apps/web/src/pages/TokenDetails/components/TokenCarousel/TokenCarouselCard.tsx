import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { SparklineMap } from '~/appGraphql/data/types'
import SparklineChart from '~/components/Charts/SparklineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { TokenStat } from '~/state/explore/types'

export const TOKEN_CARD_WIDTH = 168

export const CARD_SPACING = 12

export function TokenCarouselCard({ token, sparklines }: { token: TokenStat; sparklines: SparklineMap }) {
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const navigateToTokenDetails = useNavigateToTokenDetails()

  const currencyInfo = useCurrencyInfo(
    buildCurrencyId(fromGraphQLChain(token.chain) ?? UniverseChainId.Mainnet, token.address),
  )

  const delta1d = token.pricePercentChange1Day?.value

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
          tokenData={token}
          pricePercentChange={token.pricePercentChange1Day?.value}
          sparklineMap={sparklines}
        />
      </Flex>
      <Text numberOfLines={1} variant="body2">
        {token.name}
      </Text>
      <Flex gap="$gap4">
        <Flex row gap="$gap4" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {convertFiatAmountFormatted(token.price?.value, NumberType.FiatTokenPrice)}
          </Text>
        </Flex>
        <Flex row gap="$gap4" alignItems="center">
          <DeltaArrow delta={delta1d} formattedDelta={formatPercent(delta1d)} />
          <Text variant="body3" color="$neutral2">
            {formatPercent(Math.abs(delta1d ?? 0))}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
