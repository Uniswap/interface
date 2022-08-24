import { Trans } from '@lingui/macro'
import { ParentSize } from '@visx/responsive'
import CurrencyLogo from 'components/CurrencyLogo'
import PriceChart from 'components/Tokens/TokenDetails/PriceChart'
import { VerifiedIcon } from 'components/TokenSafety/TokenSafetyIcon'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { getChainInfo } from 'constants/chainInfo'
import { checkWarning } from 'constants/tokenSafety'
import { chainIdToChainName, useTokenDetailQuery } from 'graphql/data/TokenDetailQuery'
import { useCurrency, useIsUserAddedToken, useToken } from 'hooks/Tokens'
import { useAtomValue } from 'jotai/utils'
import { darken } from 'polished'
import { useCallback } from 'react'
import { useState } from 'react'
import { ArrowLeft, Heart, TrendingUp } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ClickableStyle, CopyContractAddress } from 'theme'
import { formatDollarAmount } from 'utils/formatDollarAmt'

import { favoritesAtom, filterNetworkAtom, useToggleFavorite } from '../state'
import { ClickFavorited } from '../TokenTable/TokenRow'
import { Wave } from './LoadingTokenDetail'
import Resource from './Resource'
import ShareButton from './ShareButton'

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
  overflow: hidden;
`
export const ResourcesContainer = styled.div`
  display: flex;
  padding-top: 12px;
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
  height: 400px;
  align-items: center;
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
const MissingData = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const AboutContainer = styled.div`
  gap: 16px;
  padding: 24px 0px;
`

const TokenDescriptionContainer = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  max-height: fit-content;
  padding-top: 16px;
  line-height: 24px;
  white-space: pre-wrap;
`

const TruncateDescriptionButton = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 400;
  font-size: 14px;
  padding-top: 14px;

  &:hover,
  &:focus {
    color: ${({ theme }) => darken(0.1, theme.textSecondary)};
    cursor: pointer;
  }
`

const TRUNCATE_CHARACTER_COUNT = 400

type TokenDetailData = {
  description: string | null | undefined
  homepageUrl: string | null | undefined
  twitterName: string | null | undefined
}

const truncateDescription = (desc: string) => {
  //trim the string to the maximum length
  let tokenDescriptionTruncated = desc.slice(0, TRUNCATE_CHARACTER_COUNT)
  //re-trim if we are in the middle of a word
  tokenDescriptionTruncated = `${tokenDescriptionTruncated.slice(
    0,
    Math.min(tokenDescriptionTruncated.length, tokenDescriptionTruncated.lastIndexOf(' '))
  )}...`
  return tokenDescriptionTruncated
}

export function AboutSection({ address, tokenDetailData }: { address: string; tokenDetailData: TokenDetailData }) {
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(true)

  const shouldTruncate =
    tokenDetailData && tokenDetailData.description
      ? tokenDetailData.description.length > TRUNCATE_CHARACTER_COUNT
      : false

  const tokenDescription =
    tokenDetailData && tokenDetailData.description && shouldTruncate && isDescriptionTruncated
      ? truncateDescription(tokenDetailData.description)
      : tokenDetailData.description

  return (
    <AboutContainer>
      <AboutHeader>
        <Trans>About</Trans>
      </AboutHeader>
      <TokenDescriptionContainer>
        {(!tokenDetailData || !tokenDetailData.description) && (
          <NoInfoAvailable>
            <Trans>No token information available</Trans>
          </NoInfoAvailable>
        )}
        {tokenDescription}
        {shouldTruncate && (
          <TruncateDescriptionButton onClick={() => setIsDescriptionTruncated(!isDescriptionTruncated)}>
            {isDescriptionTruncated ? <Trans>Read more</Trans> : <Trans>Hide</Trans>}
          </TruncateDescriptionButton>
        )}
      </TokenDescriptionContainer>
      <ResourcesContainer>
        <Resource name={'Etherscan'} link={`https://etherscan.io/address/${address}`} />
        <Resource name={'Protocol info'} link={`https://info.uniswap.org/#/tokens/${address}`} />
        {tokenDetailData?.homepageUrl && <Resource name={'Website'} link={tokenDetailData.homepageUrl} />}
        {tokenDetailData?.twitterName && (
          <Resource name={'Twitter'} link={`https://twitter.com/${tokenDetailData.twitterName}`} />
        )}
      </ResourcesContainer>
    </AboutContainer>
  )
}

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
  const filterNetwork = useAtomValue(filterNetworkAtom)
  const tokenDetailData = useTokenDetailQuery(address, chainIdToChainName(filterNetwork))
  const relevantTokenDetailData = (({ description, homepageUrl, twitterName }) => ({
    description,
    homepageUrl,
    twitterName,
  }))(tokenDetailData)

  // catch token error and loading state
  if (!token || !token.name || !token.symbol) {
    return (
      <TopArea>
        <BreadcrumbNavLink to="/tokens">
          <ArrowLeft size={14} /> Tokens
        </BreadcrumbNavLink>
        <ChartHeader>
          <TokenInfoContainer>
            <TokenNameCell>
              <CurrencyLogo currency={currency} size={'32px'} />
              <Trans>{!token ? 'Name not found' : token.name}</Trans>
              <TokenSymbol>{token && token.symbol}</TokenSymbol>
              {!warning && <VerifiedIcon size="20px" />}
              {networkBadgebackgroundColor && (
                <NetworkBadge networkColor={chainInfo?.color} backgroundColor={networkBadgebackgroundColor}>
                  {networkLabel}
                </NetworkBadge>
              )}
            </TokenNameCell>
          </TokenInfoContainer>
          <ChartEmpty>
            <Wave />
            <Wave />
          </ChartEmpty>
          <MissingChartData>
            <TrendingUp size={12} />
            Missing chart data
          </MissingChartData>
        </ChartHeader>
        <MissingData>
          <AboutSection address={address} tokenDetailData={relevantTokenDetailData} />
          <StatsSection>
            <NoInfoAvailable>
              <Trans>No stats available</Trans>
            </NoInfoAvailable>
          </StatsSection>
          <ContractAddressSection>
            <Contract>
              Contract address
              <ContractAddress>
                <CopyContractAddress address={address} />
              </ContractAddress>
            </Contract>
          </ContractAddressSection>
        </MissingData>
        <TokenSafetyModal
          isOpen={warningModalOpen}
          tokenAddress={address}
          onCancel={() => navigate(-1)}
          onContinue={handleDismissWarning}
        />
      </TopArea>
    )
  }

  const tokenName = tokenDetailData.name
  const tokenSymbol = tokenDetailData.tokens?.[0].symbol?.toUpperCase()

  return (
    <TopArea>
      <BreadcrumbNavLink to="/tokens">
        <ArrowLeft size={14} /> Tokens
      </BreadcrumbNavLink>
      <ChartHeader>
        <TokenInfoContainer>
          <TokenNameCell>
            <CurrencyLogo currency={currency} size={'32px'} />
            {tokenName ?? <Trans>Name not found</Trans>}
            <TokenSymbol>{tokenSymbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
            {!warning && <VerifiedIcon size="20px" />}
            {networkBadgebackgroundColor && (
              <NetworkBadge networkColor={chainInfo?.color} backgroundColor={networkBadgebackgroundColor}>
                {networkLabel}
              </NetworkBadge>
            )}
          </TokenNameCell>
          <TokenActions>
            {tokenName && tokenSymbol && (
              <ShareButton tokenName={tokenName} tokenSymbol={tokenSymbol} tokenAddress={address} />
            )}
            <ClickFavorited onClick={toggleFavorite}>
              <FavoriteIcon isFavorited={isFavorited} />
            </ClickFavorited>
          </TokenActions>
        </TokenInfoContainer>
        <ChartContainer>
          <ParentSize>{({ width, height }) => <PriceChart token={token} width={width} height={height} />}</ParentSize>
        </ChartContainer>
      </ChartHeader>
      <AboutSection address={address} tokenDetailData={relevantTokenDetailData} />
      <StatsSection>
        <StatPair>
          <Stat>
            Market cap
            <StatPrice>
              {tokenDetailData.marketCap?.value ? formatDollarAmount(tokenDetailData.marketCap?.value) : '-'}
            </StatPrice>
          </Stat>
          <Stat>
            24H volume
            <StatPrice>
              {tokenDetailData.volume24h?.value ? formatDollarAmount(tokenDetailData.volume24h?.value) : '-'}
            </StatPrice>
          </Stat>
        </StatPair>
        <StatPair>
          <Stat>
            52W low
            <StatPrice>
              {tokenDetailData.priceLow52W?.value ? formatDollarAmount(tokenDetailData.priceLow52W?.value) : '-'}
            </StatPrice>
          </Stat>
          <Stat>
            52W high
            <StatPrice>
              {tokenDetailData.priceHigh52W?.value ? formatDollarAmount(tokenDetailData.priceHigh52W?.value) : '-'}
            </StatPrice>
          </Stat>
        </StatPair>
      </StatsSection>
      <ContractAddressSection>
        <Contract>
          Contract address
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
