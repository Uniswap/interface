import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Flex, Separator, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getRWAIssuerDisplayName } from 'uniswap/src/features/rwa/issuers'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import type { RWAIssuerMarketData } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { getTokenDetailsURL } from '~/appGraphql/data/util'

interface IssuerTokenCardProps {
  token: RWAToken
  assetName: string
  marketData: RWAIssuerMarketData
}

function IssuerTokenCardStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Flex fill gap="$gap2">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Text variant="body2" color="$neutral1">
        {value}
      </Text>
    </Flex>
  )
}

export function IssuerTokenCard({ token, assetName, marketData }: IssuerTokenCardProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const displayName = getRWAIssuerDisplayName(token.issuer)
  const { priceUsd, marketCapUsd, volume24hUsd } = marketData
  // Logo + symbol come from the token's own per-issuer RWA branding, not the shared RWA asset branding.
  const tokenSymbol = token.symbol

  const url = getTokenDetailsURL({ address: token.address, chainUrlParam: getChainInfo(token.chainId).urlParam })

  return (
    <Link to={url} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
      <Flex
        fill
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing16"
        gap="$spacing16"
        hoverStyle={{ borderColor: '$surface3Hovered' }}
        testID={TestID.TokenDetailsRWAIssuerCard}
      >
        <Flex row alignItems="center" justifyContent="space-between" gap="$gap12">
          <Flex row alignItems="center" gap="$gap12" flexShrink={1} minWidth={0}>
            <TokenLogo url={token.logoUrl} symbol={token.symbol} name={token.name} size={iconSizes.icon36} />
            <Flex flexShrink={1} minWidth={0}>
              <Flex row alignItems="baseline" gap="$gap8">
                <Text variant="body2" color="$neutral1" numberOfLines={1}>
                  {assetName}
                </Text>
                <Text variant="body3" color="$neutral2" numberOfLines={1}>
                  {displayName}
                </Text>
              </Flex>
              {tokenSymbol ? (
                <Text variant="body3" color="$neutral2" numberOfLines={1}>
                  {tokenSymbol}
                </Text>
              ) : null}
            </Flex>
          </Flex>
          <Text variant="body1" color="$neutral1" whiteSpace="nowrap">
            {convertFiatAmountFormatted(priceUsd, NumberType.FiatTokenDetails)}
          </Text>
        </Flex>
        <Flex row gap="$gap16">
          <IssuerTokenCardStat
            label={t('stats.marketCap')}
            value={convertFiatAmountFormatted(marketCapUsd, NumberType.FiatTokenStats)}
          />
          <Separator vertical />
          <IssuerTokenCardStat
            label={t('stats.volume.1d.long')}
            value={convertFiatAmountFormatted(volume24hUsd, NumberType.FiatTokenStats)}
          />
        </Flex>
      </Flex>
    </Link>
  )
}
