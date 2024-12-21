import { ChainId } from '@ubeswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { chainIdToBackendName, getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/useScreenSize'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { Box } from '../Generics'

// Her bir token satırı için temel konteyner stili
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
  cursor: pointer;

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

// Token adı için stil
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

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    display: none;
  }
`

// Token sembolü için stil
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

  @media (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    color: ${(props) => props.color || props.theme.neutral1};
  }
`

// Token fiyatı için stil
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

// Değişim yüzdesi için stil
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

// Delta container için stil
const DeltaContainer = styled(Box)`
  @media (min-width: 1030px) and (max-width: 1150px) {
    display: none;
  }
  @media (min-width: 767px) and (max-width: 915px) {
    display: none;
  }
`

// Pool verisi için tip
type PoolData = {
  type: 'stake' | 'farm'
  contractAddress: string
  stakingToken?: string
  token0?: string
  token1?: string
  protocolVersion?: number
  apr: number
  url: string
  poolAddress?: string
}

// Top Gainers için token satırı bileşeni
export function GainerTokenRow({
  tokenAddress,
  price,
  change24h,
}: {
  tokenAddress: string
  price: number
  change24h: number
}) {
  const screenIsSmall = useScreenSize()['sm']
  const navigate = useNavigate()
  const { formatFiatPrice, formatDelta } = useFormatter()
  const currency = useCurrency(tokenAddress, ChainId.CELO)

  return (
    <TokenRow
      onClick={() =>
        navigate(
          getTokenDetailsURL({
            address: tokenAddress,
            chain: chainIdToBackendName(ChainId.CELO),
          })
        )
      }
    >
      <PortfolioLogo currencies={[currency]} chainId={ChainId.CELO} size={screenIsSmall ? '32px' : '24px'} />
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
          <DeltaContainer gap="4px" align="center" justify="flex-end">
            <DeltaArrow delta={change24h} />
            <DeltaText color={change24h < 0 ? 'red' : 'green'}>{formatDelta(change24h)}</DeltaText>
          </DeltaContainer>
        </Box>
      </Box>
    </TokenRow>
  )
}

// Top Earners için token satırı bileşeni
export function EarnerTokenRow({ poolData }: { poolData: PoolData }) {
  const screenIsSmall = useScreenSize()['sm']
  const navigate = useNavigate()
  const { formatNumber } = useFormatter()

  const handleClick = () => {
    navigate(poolData.url) // poolData içindeki url'yi kullan
  }

  const stakingToken = useCurrency(poolData.stakingToken, ChainId.CELO)
  const token0 = useCurrency(poolData.token0, ChainId.CELO)
  const token1 = useCurrency(poolData.token1, ChainId.CELO)

  // Stake durumu için render
  if (poolData.type === 'stake') {
    return (
      <TokenRow onClick={handleClick}>
        <PortfolioLogo currencies={[stakingToken]} chainId={ChainId.CELO} size={screenIsSmall ? '32px' : '24px'} />
        <Box justify="space-between" gap="16px">
          <Box width="auto" gap="8px" align="center" overflow="hidden">
            <TokenName>{`${stakingToken?.symbol} Stake`}</TokenName>
          </Box>
          <Box width="auto" gap="8px" align="center">
            <TokenPrice>
              {formatNumber({
                input: poolData.apr,
                type: NumberType.FiatTokenStats,
              })}
              % APR
            </TokenPrice>
          </Box>
        </Box>
      </TokenRow>
    )
  }

  return (
    <TokenRow onClick={handleClick}>
      <PortfolioLogo currencies={[token0, token1]} chainId={ChainId.CELO} size={screenIsSmall ? '32px' : '24px'} />
      <Box justify="space-between" gap="16px">
        <Box width="auto" gap="8px" align="center" overflow="hidden">
          <TokenName>{`${token0?.symbol}-${token1?.symbol} Farm (v${poolData.protocolVersion})`}</TokenName>
        </Box>
        <Box width="auto" gap="8px" align="center">
          <TokenPrice>
            {formatNumber({
              input: poolData.apr,
              type: NumberType.FiatTokenStats,
            })}
            % APR
          </TokenPrice>
        </Box>
      </Box>
    </TokenRow>
  )
}
