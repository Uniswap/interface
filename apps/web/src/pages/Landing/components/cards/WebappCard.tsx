import { getTokenDetailsURL } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { Computer } from 'pages/Landing/components/Icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, useMedia } from 'ui/src'
import { MATIC_MAINNET, UNI, USDC_BASE } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

const primary = '#2ABDFF'

const tokens: { chainId: UniverseChainId; address: string }[] = [
  {
    chainId: UniverseChainId.Mainnet,
    address: 'ETH',
  },
  {
    chainId: UniverseChainId.Base,
    address: USDC_BASE.address,
  },
  {
    chainId: UniverseChainId.Mainnet,
    address: UNI[UniverseChainId.Mainnet].address,
  },
  {
    chainId: UniverseChainId.Mainnet,
    address: MATIC_MAINNET.address,
  },
]

function Token({ chainId, address }: { chainId: UniverseChainId; address: string }) {
  const media = useMedia()
  const isSmallScreen = media.md

  const navigate = useNavigate()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const currency = useCurrency({
    address,
    chainId,
  })
  const tokenPromoQuery = GraphQLApi.useTokenPromoQuery({
    variables: {
      address: currency?.wrapped.address,
      chain: toGraphQLChain(chainId),
    },
  })
  const price = tokenPromoQuery.data?.token?.market?.price?.value ?? 0
  const pricePercentChange = tokenPromoQuery.data?.token?.market?.pricePercentChange?.value ?? 0

  return (
    <Flex
      width="100%"
      height={80}
      overflow="hidden"
      p={16}
      pr={24}
      row
      alignItems="center"
      gap="$gap16"
      borderRadius="$rounded20"
      backgroundColor="$surface1"
      onPress={(e) => {
        e.stopPropagation()
        navigate(
          getTokenDetailsURL({
            address: address === 'ETH' ? NATIVE_CHAIN_ID : address,
            chain: toGraphQLChain(chainId),
          }),
        )
      }}
      $platform-web={{
        transition: 'background-color 125ms ease-in, transform 125ms ease-in',
      }}
      hoverStyle={{
        backgroundColor: '$surface2',
        scale: 1.03,
      }}
      $xl={{
        height: 56,
        pr: 16,
      }}
      $lg={{
        height: 80,
        pr: 24,
      }}
      $xs={{
        height: 48,
        p: 12,
        pr: 16,
      }}
    >
      <PortfolioLogo currencies={[currency]} chainId={chainId} size={isSmallScreen ? 24 : 32} />
      <Flex row flex={1} justifyContent="space-between" gap="$gap16">
        <Flex row width="auto" gap="$gap8" alignItems="center" overflow="hidden">
          <Text
            fontWeight="$medium"
            variant="heading3"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            color="$neutral1"
            $xxl={{
              display: 'none',
            }}
            $lg={{
              fontSize: 18,
              lineHeight: 24,
              display: 'flex',
            }}
            $xs={{
              display: 'none',
            }}
          >
            {currency?.name}
          </Text>
          <Text
            fontWeight="$medium"
            variant="heading3"
            color="$neutral2"
            $xl={{
              fontSize: 18,
              lineHeight: 24,
            }}
            $xs={{
              fontSize: 16,
              lineHeight: 20,
              color: '$neutral1',
            }}
          >
            {currency?.symbol}
          </Text>
        </Flex>
        <Flex row width="auto" gap="$gap8" alignItems="center">
          <Text
            fontWeight="$medium"
            variant="heading3"
            color="$neutral1"
            $xl={{
              fontSize: 18,
              lineHeight: 24,
            }}
            $xs={{
              fontSize: 16,
              lineHeight: 20,
            }}
          >
            {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
          </Text>
          <Flex
            row
            gap="$gap4"
            alignItems="center"
            justifyContent="flex-end"
            $xl={{
              display: 'none',
            }}
            $lg={{
              display: 'flex',
            }}
            $sm={{
              display: 'none',
            }}
          >
            <DeltaArrow delta={pricePercentChange} formattedDelta={formatPercent(Math.abs(pricePercentChange))} />
            <Text
              textAlign="right"
              variant="heading3"
              fontWeight="$medium"
              color={pricePercentChange < 0 ? '$statusCritical' : '$statusSuccess'}
              $xl={{
                fontSize: 18,
                lineHeight: 24,
              }}
              $xs={{
                fontSize: 16,
                lineHeight: 20,
              }}
            >
              {formatPercent(Math.abs(pricePercentChange))}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function WebappCard() {
  const { t } = useTranslation()
  const { chains } = useEnabledChains()

  return (
    <ValuePropCard
      to="/tokens/ethereum"
      minHeight={500}
      color={primary}
      $theme-dark={{
        backgroundColor: 'rgba(0, 102, 255, 0.12)',
      }}
      $theme-light={{
        backgroundColor: 'rgba(176, 207, 252, 0.04)',
      }}
      title={<PillButton color={primary} label={t('common.webApp')} icon={<Computer size="24px" fill={primary} />} />}
      subtitle={t('landing.swapSubtitle')}
      bodyText={t('landing.swapBody', { amount: chains.length })}
      button={<PillButton color={primary} label={t('common.exploreTokens')} backgroundColor="$surface1" />}
    >
      <Flex
        gap="$gap8"
        alignItems="center"
        width="100%"
        p={32}
        pb={32}
        $xl={{
          p: 24,
          pb: 32,
        }}
        $xs={{
          p: 16,
          pb: 24,
        }}
      >
        {tokens.map((token) => (
          <Token key={`tokenRow-${token.address}`} chainId={token.chainId} address={token.address} />
        ))}
      </Flex>
    </ValuePropCard>
  )
}
