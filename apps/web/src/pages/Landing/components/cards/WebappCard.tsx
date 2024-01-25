import { t } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { OP, UNI, USDC_BASE } from 'constants/tokens'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useTokenPromoQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/useScreenSize'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { Box } from '../Generics'
import { Computer } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

const Contents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  position: absolute;
  width: 100%;
  bottom: 0;
  padding: 32px;
  padding-bottom: 32px;
  @media (max-width: 1024px) {
    padding: 24px;
    padding-bottom: 32px;
  }
  @media (max-width: 396px) {
    padding: 16px;
    padding-bottom: 24px;
  }
`

const TokenRow = styled.div`
  width: 100%;
  height: 72px;
  overflow: hidden;
  padding: 16px;
  padding-right: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.surface1};
  @media (max-width: 1024px) {
    height: 64px;
    padding-right: 16px;
  }
  @media (max-width: 768px) {
    height: 56px;
    padding-right: 16px;
  }
  @media (max-width: 468px) {
    height: 48px;
    padding: 12px;
    border-radius: 16px;
  }
  transition: background-color 125ms ease-in, transform 125ms ease-in;
  &:hover {
    background-color: ${({ theme }) => theme.surface2};
    transform: scale(1.03);
  }
`
const TokenName = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${(props) => props.color || props.theme.neutral1};
  @media (max-width: 1024px) {
    font-size: 18px;
    line-height: 24px;
  }
  @media (max-width: 468px) {
    font-size: 16px;
    line-height: 20px;
  }
`
const TokenTicker = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px;
  color: ${(props) => props.color || props.theme.neutral2};
  @media (max-width: 1024px) {
    font-size: 18px;
    line-height: 24px;
  }
  @media (max-width: 468px) {
    font-size: 16px;
    line-height: 20px;
  }
`
const TokenPrice = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 32px;
  color: ${(props) => props.color || props.theme.neutral1};
  @media (max-width: 1024px) {
    font-size: 18px;
    line-height: 24px;
  }
  @media (max-width: 468px) {
    font-size: 16px;
    line-height: 20px;
  }
`
const DeltaText = styled.h3`
  text-align: right;
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 32px;
  color: ${(props) => (props.color === 'red' ? props.theme.critical : props.theme.success)};
  @media (max-width: 1024px) {
    font-size: 18px;
    line-height: 24px;
    width: 50px;
  }
  @media (max-width: 468px) {
    font-size: 16px;
    line-height: 20px;
    width: 50px;
  }
`
const UnstyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  width: 100%;
`

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#2ABDFF'

const tokens = [
  {
    chainId: ChainId.MAINNET,
    address: 'ETH',
  },
  {
    chainId: ChainId.BASE,
    address: USDC_BASE.address,
  },
  {
    chainId: ChainId.MAINNET,
    address: UNI[ChainId.MAINNET].address,
  },
  {
    chainId: ChainId.OPTIMISM,
    address: OP.address,
  },
]

function Token({ chainId, address }: { chainId: ChainId; address: string }) {
  const screenIsSmall = useScreenSize()['sm']

  const { formatFiatPrice, formatDelta } = useFormatter()
  const currency = useCurrency(address, chainId)
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()
  const tokenPromoQuery = useTokenPromoQuery({
    variables: {
      address: currency?.wrapped.address,
      chain: chainIdToBackendName(chainId),
    },
  })
  const price = tokenPromoQuery.data?.token?.market?.price?.value ?? 0
  const pricePercentChange = tokenPromoQuery.data?.token?.market?.pricePercentChange?.value ?? 0

  return (
    <UnstyledLink
      to={getTokenDetailsURL({
        address: address === 'ETH' ? 'NATIVE' : address,
        chain: chainIdToBackendName(chainId),
        isInfoExplorePageEnabled,
      })}
    >
      <TokenRow>
        <PortfolioLogo currencies={[currency]} chainId={chainId} size={screenIsSmall ? '32px' : '24px'} />
        <Box justify="space-between" gap="16px">
          <Box width="auto" gap="8px" align="center" overflow="hidden">
            <TokenName>{currency?.name}</TokenName>
            <TokenTicker>{currency?.symbol}</TokenTicker>
          </Box>
          <Box width="auto" gap="8px" align="center">
            <TokenPrice>
              {formatFiatPrice({
                price,
                type: NumberType.FiatTokenPrice,
              })}
            </TokenPrice>
            <Box gap="4px" align="center" justify="flex-end">
              <DeltaArrow delta={pricePercentChange} />
              <DeltaText color={pricePercentChange < 0 ? 'red' : 'green'}>{formatDelta(pricePercentChange)}</DeltaText>
            </Box>
          </Box>
        </Box>
      </TokenRow>
    </UnstyledLink>
  )
}

export function WebappCard(props: WebappCardProps) {
  return (
    <ValuePropCard
      to="/tokens/ethereum"
      minHeight="450px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(0, 102, 255, 0.12)', light: 'rgba(0, 102, 255, 0.04)' }}
      button={<PillButton color={primary} label={t`Web app`} icon={<Computer size="24px" fill={primary} />} />}
      titleText={t`Swapping made simple. Access thousands of tokens on 8+ chains.`}
    >
      <Contents>
        {tokens.map((token) => (
          <Token key={`tokenRow-${token.address}`} chainId={token.chainId} address={token.address} />
        ))}
      </Contents>
    </ValuePropCard>
  )
}
