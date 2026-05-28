import { getFewTokenAddress } from '@ring-protocol/few-v2-sdk'
import { useTokenDetail } from 'appGraphql/data/ring/useRingTokenWebQuery'
import { getTokenDetailsURL } from 'appGraphql/data/util'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { Computer } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Flex, Text, useMedia } from 'ui/src'
import { AAVE, APE, FEW_WRAPPED_NATIVE_CURRENCY, USDR } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const primary = '#2ABDFF'

const tokens: { chainId: UniverseChainId; address: string }[] = [
  {
    chainId: UniverseChainId.Mainnet,
    address: 'ETH',
  },
  // {
  //   chainId: UniverseChainId.Mainnet,
  //   address: WBTC.address,
  // },
  // {
  //   chainId: UniverseChainId.Mainnet,
  //   address: ZRX[UniverseChainId.Mainnet].address,
  // },
  {
    chainId: UniverseChainId.Mainnet,
    address: USDR.address,
  },
  {
    chainId: UniverseChainId.Mainnet,
    address: AAVE[UniverseChainId.Mainnet].address,
    // },,
  },
  {
    chainId: UniverseChainId.Mainnet,
    address: APE[UniverseChainId.Mainnet].address,
  },
  // {
  //   chainId: UniverseChainId.Base,
  //   address: USDC_BASE.address,
  // },
  // {
  //   chainId: UniverseChainId.Mainnet,
  //   address: UNI[UniverseChainId.Mainnet].address,
  // },
  // {
  //   chainId: UniverseChainId.Mainnet,
  //   address: LDO.address,
  // },
]

function Token({ chainId, address }: { chainId: UniverseChainId; address: string }) {
  const media = useMedia()
  const isSmallScreen = media.md
  const navigate = useNavigate()
  const { formatFiatPrice, formatDelta } = useFormatter()
  const currency = useCurrency(address, chainId)

  // Calculate fewtoken address for querying
  const fewTokenAddress = useMemo(() => {
    if (address === 'ETH') {
      return FEW_WRAPPED_NATIVE_CURRENCY[chainId]?.address
    }
    const wrappedAddress = currency?.wrapped.address
    if (!wrappedAddress) {
      return undefined
    }
    try {
      return getFewTokenAddress(wrappedAddress, chainId)
    } catch {
      return wrappedAddress
    }
  }, [address, chainId, currency?.wrapped.address])

  const tokenDetailQuery = useTokenDetail(fewTokenAddress ?? '', toGraphQLChain(chainId))

  // Calculate price and price change from dayData
  const { price, pricePercentChange } = useMemo(() => {
    const dayDataItems = tokenDetailQuery.token?.dayData?.items
    const latestDayData = dayDataItems?.[0]
    const previousDayData = dayDataItems?.[1]

    const currentPrice = latestDayData?.priceUSD ? Number(latestDayData.priceUSD) : 0
    const previousPrice = previousDayData?.priceUSD ? Number(previousDayData.priceUSD) : 0

    const change = previousPrice > 0 && currentPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0

    return { price: currentPrice, pricePercentChange: change }
  }, [tokenDetailQuery.token?.dayData?.items])

  // Memoize navigation URL
  const tokenDetailsUrl = useMemo(
    () =>
      getTokenDetailsURL({
        address: address === 'ETH' ? NATIVE_CHAIN_ID : address,
        chain: toGraphQLChain(chainId),
      }),
    [address, chainId],
  )

  const handlePress = useCallback(
    (e: any) => {
      e.stopPropagation()
      navigate(tokenDetailsUrl)
    },
    [navigate, tokenDetailsUrl],
  )

  return (
    <Flex
      width="100%"
      height={72}
      overflow="hidden"
      p={16}
      pr={24}
      row
      alignItems="center"
      gap="$gap16"
      borderRadius="$rounded20"
      backgroundColor="$surface1"
      onPress={handlePress}
      $platform-web={{
        transition: 'background-color 125ms ease-in, transform 125ms ease-in',
      }}
      hoverStyle={{
        backgroundColor: '$surface2',
        scale: 1.03,
      }}
      $xl={{
        height: 64,
        pr: 16,
      }}
      $lg={{
        height: 56,
        pr: 16,
      }}
      $xs={{
        height: 48,
        p: 12,
        borderRadius: 16,
      }}
    >
      <PortfolioLogo currencies={[currency]} chainId={chainId} size={isSmallScreen ? 24 : 32} />
      <Flex row flex={1} justifyContent="space-between" gap="$gap16">
        <Flex row width="auto" gap="$gap8" alignItems="center" overflow="hidden">
          <Text
            fontWeight="$medium"
            fontSize={24}
            lineHeight={32}
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            color="$neutral1"
            $xl={{
              fontSize: 18,
              lineHeight: 24,
            }}
            $xs={{
              fontSize: 16,
              lineHeight: 20,
              display: 'none',
            }}
          >
            {currency?.name}
          </Text>
          <Text
            fontWeight="$medium"
            fontSize={24}
            lineHeight={32}
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
            fontSize={24}
            lineHeight={32}
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
            {formatFiatPrice({
              price,
              type: NumberType.FiatTokenPrice,
            })}
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
              display: 'none',
            }}
          >
            <DeltaArrow delta={pricePercentChange} formattedDelta={formatDelta(pricePercentChange)} />
            <Text
              textAlign="right"
              fontSize={24}
              fontWeight="$medium"
              lineHeight={32}
              color={pricePercentChange < 0 ? '$statusCritical' : '$statusSuccess'}
              $xl={{
                fontSize: 18,
                lineHeight: 24,
                width: 50,
              }}
              $xs={{
                fontSize: 16,
                lineHeight: 20,
                width: 50,
              }}
            >
              {formatDelta(pricePercentChange)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function WebappCard() {
  const { t } = useTranslation()
  return (
    <ValuePropCard
      to="/tokens/ethereum"
      minHeight={500}
      color={primary}
      maxWidth="100%"
      $theme-dark={{
        backgroundColor: 'rgba(0, 102, 255, 0.12)',
      }}
      $theme-light={{
        backgroundColor: 'rgba(0, 102, 255, 0.04)',
      }}
      button={<PillButton color={primary} label={t('common.webApp')} icon={<Computer size="24px" fill={primary} />} />}
      titleText={t('landing.swapSimple')}
    >
      <Flex
        gap="$gap8"
        alignItems="center"
        position="absolute"
        width="100%"
        bottom={0}
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
