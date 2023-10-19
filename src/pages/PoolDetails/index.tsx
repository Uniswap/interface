import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { usePoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import useCopyClipboard from 'hooks/useCopyClipboard'
import NotFound from 'pages/NotFound'
import { useCallback, useReducer } from 'react'
import { ChevronRight, Copy } from 'react-feather'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { isAddress, shortenAddress } from 'utils'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { DoubleCurrencyAndChainLogo, PoolDetailsHeader } from './PoolDetailsHeader'
import { PoolDetailsStats } from './PoolDetailsStats'
import { PoolDetailsStatsButtons } from './PoolDetailsStatsButtons'

const PageWrapper = styled(Row)`
  padding: 48px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: 48px 16px;
  }
`

const RightColumn = styled(Column)`
  gap: 24px;
  margin: 0 48px 0 auto;
  width: 22vw;
  min-width: 360px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    margin: 44px 0px;
    width: 100%;
    min-width: unset;
  }
`

const TokenDetailsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.sm}px) {
    flex-direction: row;
    flex-wrap: wrap;
    padding: unset;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: unset;
  }
`

const TokenDetailsHeader = styled(Text)`
  width: 100%;
  font-size: 24px;
  font-weight: 485;
  line-height: 32px;
`

const LinksContainer = styled(Column)`
  gap: 16px;
  width: 100%;
`

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName: string
  }>()
  const chain = getValidUrlChainName(chainName)
  const chainId = chain && supportedChainIdFromGQLChain(chain)
  const { data: poolData, loading } = usePoolData(poolAddress ?? '', chainId)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const token0 = isReversed ? poolData?.token1 : poolData?.token0
  const token1 = isReversed ? poolData?.token0 : poolData?.token1
  const isInvalidPool = !chainName || !poolAddress || !getValidUrlChainName(chainName) || !isAddress(poolAddress)
  const poolNotFound = (!loading && !poolData) || isInvalidPool

  // TODO(WEB-2814): Add skeleton once designed
  if (loading) return null
  if (poolNotFound) return <NotFound />
  return (
    <PageWrapper>
      <PoolDetailsHeader
        chainId={chainId}
        poolAddress={poolAddress}
        token0={token0}
        token1={token1}
        feeTier={poolData?.feeTier}
        toggleReversed={toggleReversed}
      />
      <RightColumn>
        <PoolDetailsStatsButtons chainId={chainId} token0={token0} token1={token1} feeTier={poolData?.feeTier} />
        {poolData && <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} />}
        {(token0 || token1) && (
          <TokenDetailsWrapper>
            <TokenDetailsHeader>
              <Trans>Links</Trans>
            </TokenDetailsHeader>
            {/* {token0 && <TokenDescription tokenAddress={token0.id} chainId={chainId} />}
            {token1 && <TokenDescription tokenAddress={token1.id} chainId={chainId} />} */}
            {chainId && (
              <LinksContainer>
                <PoolDetailsLink address={poolAddress} chainId={chainId} tokens={[token0, token1]} />
                {token0?.id && <PoolDetailsLink address={token0.id} chainId={chainId} tokens={[token0]} />}
                {token1?.id && <PoolDetailsLink address={token1?.id} chainId={chainId} tokens={[token1]} />}
              </LinksContainer>
            )}
          </TokenDetailsWrapper>
        )}
      </RightColumn>
    </PageWrapper>
  )
}

const TokenName = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`

const SymbolText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`

const CopyAddress = styled(Row)`
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.surface3};
  font-size: 14px;
  font-weight: 535;
  line-height: 16px;
  width: max-content;
  flex-shrink: 0;
  ${ClickableStyle}
`
const StyledCopyIcon = styled(Copy)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.neutral2};
  flex-shrink: 0;
`

const ExplorerWrapper = styled.div`
  padding: 8px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.surface3};
  display: flex;
  ${ClickableStyle}
`

interface PoolDetailsLinkProps {
  address: string
  chainId: number
  tokens: (Token | undefined)[]
}

function PoolDetailsLink({ address, chainId, tokens }: PoolDetailsLinkProps) {
  const theme = useTheme()
  const currencies = [
    useCurrency(tokens[0]?.id, chainId) ?? undefined,
    useCurrency(tokens[1]?.id, chainId) ?? undefined,
  ]
  const [, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(address)
  }, [address, setCopied])

  const isPool = tokens.length === 2
  const explorerUrl = getExplorerLink(chainId, address, isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN)

  return (
    <Row align="space-between">
      <Row gap="8px" marginRight="12px">
        {isPool ? (
          <DoubleCurrencyAndChainLogo chainId={chainId} currencies={currencies} small />
        ) : (
          <CurrencyLogo currency={currencies[0]} size="20px" />
        )}
        <TokenName>{isPool ? <Trans>Pool</Trans> : tokens[0]?.name}</TokenName>
        <SymbolText>
          {isPool ? (
            `${tokens[0]?.symbol} / ${tokens[1]?.symbol}`
          ) : (
            <Row gap="4px">
              {tokens[0]?.symbol} <ChevronRight size={16} color={theme.neutral2} />
            </Row>
          )}
        </SymbolText>
      </Row>
      <Row gap="8px">
        <CopyAddress onClick={copy}>
          {shortenAddress(address)}
          <StyledCopyIcon />
        </CopyAddress>
        {explorerUrl && (
          <ExternalLink href={explorerUrl}>
            <ExplorerWrapper>
              <EtherscanLogo width="16px" height="16px" fill={theme.neutral2} />
            </ExplorerWrapper>
          </ExternalLink>
        )}
      </Row>
    </Row>
  )
}
