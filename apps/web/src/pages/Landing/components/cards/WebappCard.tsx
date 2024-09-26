import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { SupportedInterfaceChainId, chainIdToBackendChain } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { Computer } from 'pages/Landing/components/Icons'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import ValuePropCard from 'pages/Landing/components/cards/ValuePropCard'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'ui/src'
import { LDO, UNI, USDC_BASE } from 'uniswap/src/constants/tokens'
import { useTokenPromoQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { t } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const primary = '#2ABDFF'

const tokens: { chainId: SupportedInterfaceChainId; address: string }[] = [
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
    address: LDO.address,
  },
]

function Token({ chainId, address }: { chainId: SupportedInterfaceChainId; address: string }) {
  const screenIsSmall = useScreenSize()['sm']
  const navigate = useNavigate()
  const { formatFiatPrice, formatDelta } = useFormatter()
  const currency = useCurrency(address, chainId)
  const tokenPromoQuery = useTokenPromoQuery({
    variables: {
      address: currency?.wrapped.address,
      chain: chainIdToBackendChain({ chainId }),
    },
  })
  const price = tokenPromoQuery.data?.token?.market?.price?.value ?? 0
  const pricePercentChange = tokenPromoQuery.data?.token?.market?.pricePercentChange?.value ?? 0

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
      onPress={(e) => {
        e.stopPropagation()
        navigate(
          getTokenDetailsURL({
            address: address === 'ETH' ? NATIVE_CHAIN_ID : address,
            chain: chainIdToBackendChain({ chainId }),
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
      <PortfolioLogo currencies={[currency]} chainId={chainId} size={screenIsSmall ? 32 : 24} />
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
            <DeltaArrow delta={pricePercentChange} />
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
  return (
    <ValuePropCard
      to="/tokens/ethereum"
      minHeight={500}
      color={primary}
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
