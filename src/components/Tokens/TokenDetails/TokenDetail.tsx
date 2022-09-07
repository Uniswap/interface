import { Trans } from '@lingui/macro'
import { ParentSize } from '@visx/responsive'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/CurrencyLogo'
import PriceChart from 'components/Tokens/TokenDetails/PriceChart'
import { VerifiedIcon } from 'components/TokenSafety/TokenSafetyIcon'
import { getChainInfo } from 'constants/chainInfo'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { chainIdToChainName, useTokenDetailQuery } from 'graphql/data/TokenDetailQuery'
import { useCurrency, useToken } from 'hooks/Tokens'
import { useAtomValue } from 'jotai/utils'
import { darken } from 'polished'
import { Suspense } from 'react'
import { useState } from 'react'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components/macro'
import { CopyContractAddress } from 'theme'
import { formatDollarAmount } from 'utils/formatDollarAmt'

import { filterNetworkAtom, useIsFavorited, useToggleFavorite } from '../state'
import { ClickFavorited, FavoriteIcon } from '../TokenTable/TokenRow'
import LoadingTokenDetail from './LoadingTokenDetail'
import Resource from './Resource'
import ShareButton from './ShareButton'
import {
  AboutContainer,
  AboutHeader,
  BreadcrumbNavLink,
  ChartContainer,
  ChartHeader,
  ContractAddressSection,
  ResourcesContainer,
  Stat,
  StatPair,
  StatsSection,
  TokenInfoContainer,
  TokenNameCell,
  TopArea,
} from './TokenDetailContainers'

const ContractAddress = styled.button`
  display: flex;
  color: ${({ theme }) => theme.textPrimary};
  gap: 10px;
  align-items: center;
  background: transparent;
  border: none;
  min-height: 38px;
  padding: 0px;
  cursor: pointer;
`
const Contract = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  gap: 4px;
`
const StatPrice = styled.span`
  font-size: 28px;
  color: ${({ theme }) => theme.textPrimary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
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

const NoInfoAvailable = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  font-weight: 400;
  font-size: 16px;
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
  const { chainId: connectedChainId } = useWeb3React()
  const token = useToken(address)
  let currency = useCurrency(address)
  const isFavorited = useIsFavorited(address)
  const toggleFavorite = useToggleFavorite(address)
  const warning = checkWarning(address)
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

  if (!token || !token.name || !token.symbol || !connectedChainId) {
    return <LoadingTokenDetail />
  }

  const wrappedNativeCurrency = WRAPPED_NATIVE_CURRENCY[connectedChainId]
  const isWrappedNativeToken = wrappedNativeCurrency?.address === token.address

  if (isWrappedNativeToken) {
    currency = nativeOnChain(connectedChainId)
  }

  const tokenName = isWrappedNativeToken && currency ? currency.name : tokenDetailData.name
  const defaultTokenSymbol = tokenDetailData.tokens?.[0]?.symbol ?? token.symbol
  const tokenSymbol = isWrappedNativeToken && currency ? currency.symbol : defaultTokenSymbol

  return (
    <Suspense fallback={<LoadingTokenDetail />}>
      <TopArea>
        <BreadcrumbNavLink to="/tokens">
          <ArrowLeft size={14} /> Tokens
        </BreadcrumbNavLink>
        <ChartHeader>
          <TokenInfoContainer>
            <TokenNameCell>
              <CurrencyLogo currency={currency} size={'32px'} symbol={tokenSymbol} />
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
        <StatsSection>
          <StatPair>
            <Stat>
              <Trans>Market cap</Trans>
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
        <AboutSection address={address} tokenDetailData={relevantTokenDetailData} />
        <ContractAddressSection>
          <Contract>
            <Trans>Contract address</Trans>
            <ContractAddress>
              <CopyContractAddress address={address} />
            </ContractAddress>
          </Contract>
        </ContractAddressSection>
      </TopArea>
    </Suspense>
  )
}
