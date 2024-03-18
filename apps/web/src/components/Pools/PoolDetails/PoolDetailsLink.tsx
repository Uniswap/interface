import { t, Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import Tooltip, { TooltipSize } from 'components/Tooltip'
import { Token } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useCallback, useState } from 'react'
import { ChevronRight, Copy } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { isAddress, shortenAddress } from 'utilities/src/addresses'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { DoubleTokenAndChainLogo } from './PoolDetailsHeader'
import { DetailBubble, SmallDetailBubble } from './shared'

const TokenName = styled(ThemedText.BodyPrimary)`
  display: none;

  @media (max-width: ${BREAKPOINTS.lg}px) and (min-width: ${BREAKPOINTS.xs}px) {
    display: block;
  }
  ${EllipsisStyle}
`

const TokenTextWrapper = styled(Row)<{ isClickable?: boolean }>`
  gap: 8px;
  margin-right: 12px;
  ${EllipsisStyle}
  ${({ isClickable }) => isClickable && ClickableStyle}
`

const SymbolText = styled(ThemedText.BodyPrimary)`
  flex-shrink: 0;

  @media (max-width: ${BREAKPOINTS.lg}px) and (min-width: ${BREAKPOINTS.xs}px) {
    color: ${({ theme }) => theme.neutral2};
  }
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
  address?: string
  chainId?: number
  tokens: (Token | undefined)[]
  loading?: boolean
}

export function PoolDetailsLink({ address, chainId, tokens, loading }: PoolDetailsLinkProps) {
  const theme = useTheme()
  const isNative = address === NATIVE_CHAIN_ID
  const currency = tokens[0] && gqlToCurrency(tokens[0])
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    const checksummedAddress = isAddress(address)
    checksummedAddress && setCopied(checksummedAddress)
  }, [address, setCopied])

  const isPool = tokens.length === 2
  const explorerUrl =
    address &&
    chainId &&
    getExplorerLink(
      chainId,
      address,
      isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN
    )

  const navigate = useNavigate()
  const chainName = chainIdToBackendName(chainId)
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.address, chain: chainName }))
    }
  }, [navigate, tokens, isPool, chainName])

  const [truncateAddress, setTruncateAddress] = useState<false | 'start' | 'both'>(false)
  const onTextRender = useCallback(
    (textRef: HTMLElement) => {
      if (textRef) {
        const hasOverflow = textRef.clientWidth < textRef.scrollWidth
        if (hasOverflow) {
          setTruncateAddress((prev) => (prev ? 'both' : 'start'))
        }
      }
    },
    // This callback must run after it sets truncateAddress to 'start' to see if it needs to 'both'.
    // It checks if the textRef has overflow, and sets truncateAddress accordingly to avoid it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [truncateAddress]
  )

  if (loading || !address || !chainId) {
    return (
      <Row gap="8px" padding="6px 0px">
        <SmallDetailBubble />
        <DetailBubble $width={117} />
      </Row>
    )
  }

  return (
    <Row align="space-between">
      <TokenTextWrapper
        data-testid={
          isPool ? `pdp-pool-logo-${tokens[0]?.symbol}-${tokens[1]?.symbol}` : `pdp-token-logo-${tokens[0]?.symbol}`
        }
        isClickable={!isPool}
        onClick={handleTokenTextClick}
        ref={onTextRender}
      >
        {isPool ? (
          <DoubleTokenAndChainLogo chainId={chainId} tokens={tokens} size={20} />
        ) : (
          <CurrencyLogo currency={currency} size="20px" />
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
        {!isNative && (
          <Tooltip placement="bottom" size={TooltipSize.Max} show={isCopied} text={t`Copied`}>
            <CopyAddress data-testid={`copy-address-${address}`} onClick={copy}>
              {shortenAddress(address, truncateAddress ? 2 : undefined, truncateAddress === 'both' ? 2 : undefined)}
              <StyledCopyIcon />
            </CopyAddress>
          </Tooltip>
        )}
        {explorerUrl && (
          <ExternalLink href={explorerUrl} data-testid={`explorer-url-${explorerUrl}`}>
            <ExplorerWrapper>
              {chainId === ChainId.MAINNET ? (
                <EtherscanLogo width="16px" height="16px" fill={theme.neutral1} />
              ) : (
                <ExplorerIcon width="16px" height="16px" fill={theme.neutral1} />
              )}
            </ExplorerWrapper>
          </ExternalLink>
        )}
      </ButtonsRow>
    </Row>
  )
}
