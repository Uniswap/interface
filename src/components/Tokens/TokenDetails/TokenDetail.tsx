import { Trans } from '@lingui/macro'
import { ParentSize } from '@visx/responsive'
import CurrencyLogo from 'components/CurrencyLogo'
import PriceChart from 'components/Tokens/TokenDetails/PriceChart'
import { VerifiedIcon } from 'components/TokenSafety/TokenSafetyIcon'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { checkWarning } from 'constants/tokenSafety'
import { gql } from 'graphql-request'
import { useCurrency, useIsUserAddedToken, useToken } from 'hooks/Tokens'
import { useAtomValue } from 'jotai/utils'
import { useCallback } from 'react'
import { useState } from 'react'
<<<<<<< HEAD
import { ArrowLeft, Heart } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ClickableStyle, CopyContractAddress } from 'theme'
=======
import { ArrowLeft, Copy, Heart, TrendingUp } from 'react-feather'
import { useLazyLoadQuery } from 'react-relay'
import { Link, useNavigate } from 'react-router-dom'
import { CHAIN_SUBGRAPH_URL } from 'state/data/slice'
import styled, { useTheme } from 'styled-components/macro'
>>>>>>> fa094936 (query)

import { favoritesAtom, useToggleFavorite } from '../state'
import { ClickFavorited } from '../TokenTable/TokenRow'
import Resource from './Resource'
import ShareButton from './ShareButton'

export const AboutSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 0px;
`
export const AboutHeader = styled.span`
  font-size: 28px;
  line-height: 36px;
`
export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  margin-bottom: 16px;

  &:hover {
    color: ${({ theme }) => theme.textTertiary};
  }
`
export const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textPrimary};
  gap: 4px;
  margin-bottom: 24px;
`
const ContractAddress = styled.button`
  display: flex;
  color: ${({ theme }) => theme.textPrimary};
  gap: 10px;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0px;
  cursor: pointer;
`
export const ContractAddressSection = styled.div`
  padding: 24px 0px;
`
const Contract = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  gap: 4px;
`
export const ChartContainer = styled.div`
  display: flex;
  height: 436px;
  align-items: center;
`
export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  gap: 4px;
  padding: 24px 0px;
`
const StatPrice = styled.span`
  font-size: 28px;
  color: ${({ theme }) => theme.textPrimary};
`
export const StatsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
`
export const StatPair = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`
export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.textSecondary};
`
export const TopArea = styled.div`
  max-width: 832px;
`
export const ResourcesContainer = styled.div`
  display: flex;
  gap: 14px;
`
const NetworkBadge = styled.div<{ networkColor?: string; backgroundColor?: string }>`
  border-radius: 5px;
  padding: 4px 8px;
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  color: ${({ theme, networkColor }) => networkColor ?? theme.textPrimary};
  background-color: ${({ theme, backgroundColor }) => backgroundColor ?? theme.backgroundSurface};
`
const FavoriteIcon = styled(Heart)<{ isFavorited: boolean }>`
  ${ClickableStyle}
  height: 22px;
  width: 24px;
  color: ${({ isFavorited, theme }) => (isFavorited ? theme.accentAction : theme.textSecondary)};
  fill: ${({ isFavorited, theme }) => (isFavorited ? theme.accentAction : 'transparent')};
`

const ChartEmpty = styled.div`
  display: flex;
`
const NoInfoAvailable = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  font-weight: 400;
  font-size: 16px;
`
const MissingChartData = styled.div`
  color: ${({ theme }) => theme.textTertiary};
  display: flex;
  font-weight: 400;
  font-size: 12px;
  gap: 4px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  padding: 8px 0px;
  margin-top: -40px;
`

const tokenDetailsStatsQuery = gql`
  query TokenDetailsStatsQuery($contract: ContractInput) {
    tokenProjects(contracts: [$contract]) {
      description
      homepageUrl
      twitterName
      name
      markets(currencies: [USD]) {
        price {
          value
          currency
        }
        marketCap {
          value
          currency
        }
        fullyDilutedMarketCap {
          value
          currency
        }
        volume24h: volume(duration: DAY) {
          value
          currency
        }
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          value
          currency
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          value
          currency
        }
      }
      tokens {
        chain
        address
        symbol
        decimals
      }
    }
  }
`

export default function LoadedTokenDetail({ address }: { address: string }) {
  const token = useToken(address)
  const currency = useCurrency(address)
  const favoriteTokens = useAtomValue<string[]>(favoritesAtom)
  const isFavorited = favoriteTokens.includes(address)
  const toggleFavorite = useToggleFavorite(address)
  const warning = checkWarning(address)
  const navigate = useNavigate()
  const isUserAddedToken = useIsUserAddedToken(token)
  const [warningModalOpen, setWarningModalOpen] = useState(!!warning && !isUserAddedToken)

  const handleDismissWarning = useCallback(() => {
    setWarningModalOpen(false)
  }, [setWarningModalOpen])
  const chainInfo = getChainInfo(token?.chainId)
  const networkLabel = chainInfo?.label
  const networkBadgebackgroundColor = chainInfo?.backgroundColor
  const truncatedTokenAddress = `${address.slice(0, 4)}...${address.slice(-3)}`
  const tokenDetailsData = useLazyLoadQuery(tokenDetailsStatsQuery, {
    contract: {
      address,
      chain: token ? CHAIN_SUBGRAPH_URL[token.chainId] : CHAIN_SUBGRAPH_URL[SupportedChainId.MAINNET],
    },
  })

  // catch token error and loading state
  if (!token || !token.name || !token.symbol) {
    return (
      <TopArea>
        <BreadcrumbNavLink to="/explore">
          <ArrowLeft size={14} /> Explore
        </BreadcrumbNavLink>
        <ChartHeader>
          <TokenInfoContainer>
            <TokenNameCell>
              <CurrencyLogo currency={currency} size={'32px'} />
              {!token ? 'No token name available' : token.name} <TokenSymbol>{token && token.symbol}</TokenSymbol>
              {!warning && <VerifiedIcon size="24px" />}
              {networkBadgebackgroundColor && (
                <NetworkBadge networkColor={chainInfo?.color} backgroundColor={networkBadgebackgroundColor}>
                  {networkLabel}
                </NetworkBadge>
              )}
            </TokenNameCell>
            <TokenActions></TokenActions>
          </TokenInfoContainer>
          <ChartContainer>
            <ChartEmpty>
              <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#99A1BD" fill="transparent" strokeWidth="2" />
              </svg>
              <svg width="416" height="160" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 80 Q 104 10, 208 80 T 416 80" stroke="#99A1BD" fill="transparent" strokeWidth="2" />
              </svg>
            </ChartEmpty>
          </ChartContainer>
          <MissingChartData>
            <TrendingUp size={12} />
            Missing chart data
          </MissingChartData>
        </ChartHeader>

        <AboutSection>
          <AboutHeader>
            <Trans>About</Trans>
          </AboutHeader>
          <NoInfoAvailable>No token information available</NoInfoAvailable>
          <ResourcesContainer>
            <Resource name={'Etherscan'} link={'https://etherscan.io/'} />
            <Resource name={'Protocol Info'} link={`https://info.uniswap.org/#/tokens/${address}`} />
          </ResourcesContainer>
        </AboutSection>
        <StatsSection>
          <NoInfoAvailable>No stats available</NoInfoAvailable>
        </StatsSection>
        <ContractAddressSection>
          <Contract>
            Contract Address
            <ContractAddress onClick={() => navigator.clipboard.writeText(address)}>
              <FullAddress>{address}</FullAddress>
              <TruncatedAddress>{truncatedTokenAddress}</TruncatedAddress>
              <Copy size={13} color={theme.textSecondary} />
            </ContractAddress>
          </Contract>
        </ContractAddressSection>
        <TokenSafetyModal
          isOpen={warningModalOpen}
          tokenAddress={address}
          onCancel={() => navigate(-1)}
          onContinue={handleDismissWarning}
        />
      </TopArea>
    )
  }
  const tokenName = tokenDetailsData.name
  const tokenSymbol = tokenDetailsData.symbol

  // TODO: format price, add sparkline
  const aboutToken =
    'Ethereum is a decentralized computing platform that uses ETH (Ether) to pay transaction fees (gas). Developers can use Ethereum to run decentralized applications (dApps) and issue new crypto assets, known as Ethereum tokens.'
  const tokenMarketCap = '23.02B'
  const tokenVolume = '1.6B'

  return (
    <TopArea>
      <BreadcrumbNavLink to="/explore">
        <ArrowLeft size={14} /> Explore
      </BreadcrumbNavLink>
      <ChartHeader>
        <TokenInfoContainer>
          <TokenNameCell>
            <CurrencyLogo currency={currency} size={'32px'} />
            {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
            {!warning && <VerifiedIcon size="20px" />}
            {networkBadgebackgroundColor && (
              <NetworkBadge networkColor={chainInfo?.color} backgroundColor={networkBadgebackgroundColor}>
                {networkLabel}
              </NetworkBadge>
            )}
          </TokenNameCell>
          <TokenActions>
            <ShareButton tokenName={tokenName} tokenSymbol={tokenSymbol} />
            <ClickFavorited onClick={toggleFavorite}>
              <FavoriteIcon isFavorited={isFavorited} />
            </ClickFavorited>
          </TokenActions>
        </TokenInfoContainer>
        <ChartContainer>
          <ParentSize>{({ width, height }) => <PriceChart width={width} height={height} />}</ParentSize>
        </ChartContainer>
      </ChartHeader>
      <AboutSection>
        <AboutHeader>
          <Trans>About</Trans>
        </AboutHeader>
        {aboutToken}
        <ResourcesContainer>
          <Resource name={'Etherscan'} link={'https://etherscan.io/'} />
          <Resource name={'Protocol Info'} link={`https://info.uniswap.org/#/tokens/${address}`} />
        </ResourcesContainer>
      </AboutSection>
      <StatsSection>
        <StatPair>
          <Stat>
            Market cap<StatPrice>${tokenMarketCap}</StatPrice>
          </Stat>
          <Stat>
            {/* TODO: connect to chart's selected time */}
            24H volume
            <StatPrice>${tokenVolume}</StatPrice>
          </Stat>
        </StatPair>
        <StatPair>
          <Stat>
            52W low
            <StatPrice>$1,790.01</StatPrice>
          </Stat>
          <Stat>
            52W high
            <StatPrice>$4,420.71</StatPrice>
          </Stat>
        </StatPair>
      </StatsSection>
      <ContractAddressSection>
        <Contract>
          Contract Address
          <ContractAddress>
            <CopyContractAddress address={address} />
          </ContractAddress>
        </Contract>
      </ContractAddressSection>
      <TokenSafetyModal
        isOpen={warningModalOpen}
        tokenAddress={address}
        onCancel={() => navigate(-1)}
        onContinue={handleDismissWarning}
      />
    </TopArea>
  )
}
