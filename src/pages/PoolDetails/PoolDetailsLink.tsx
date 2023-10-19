import { Trans } from '@lingui/macro'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { chainIdToBackendName, getTokenDetailsURL } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useCallback } from 'react'
import { ChevronRight, Copy } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { DoubleCurrencyAndChainLogo } from './PoolDetailsHeader'

const TokenName = styled(ThemedText.BodyPrimary)`
  display: none;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.xs}px) {
    display: block;
  }
  ${EllipsisStyle}
`

const TokenTextWrapper = styled(Row)<{ isClickable?: boolean }>`
  gap: 8px;
  margin-right: 12px;
  ${({ isClickable }) => isClickable && ClickableStyle}
`

const SymbolText = styled(ThemedText.BodyPrimary)`
  flex-shrink: 0;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.xs}px) {
    color: ${({ theme }) => theme.neutral2};
  }
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

const ButtonsRow = styled(Row)`
  gap: 8px;
  flex-shrink: 0;
  width: max-content;
`

interface PoolDetailsLinkProps {
  address: string
  chainId: number
  tokens: (Token | undefined)[]
}

export function PoolDetailsLink({ address, chainId, tokens }: PoolDetailsLinkProps) {
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

  const navigate = useNavigate()
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()
  const chainName = chainIdToBackendName(chainId)
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.id, chain: chainName, isInfoExplorePageEnabled }))
    }
  }, [navigate, tokens, isPool, chainName, isInfoExplorePageEnabled])

  return (
    <Row align="space-between">
      <TokenTextWrapper isClickable={!isPool} onClick={handleTokenTextClick}>
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
      </TokenTextWrapper>
      <ButtonsRow>
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
      </ButtonsRow>
    </Row>
  )
}
