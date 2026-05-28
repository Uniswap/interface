import { getTokenDetailsURL, unwrapFewToken } from 'appGraphql/data/util'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import Row from 'components/deprecated/Row'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useCopyClipboard from 'hooks/useCopyClipboard'
import styled, { useTheme } from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { ChevronRight, Copy } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDefaultRingActiveTokens } from 'state/lists/hooks'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { ClickableStyle, EllipsisStyle } from 'theme/components/styles'
import { Flex } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { Token as RingToken, Standard } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isAddress, shortenAddress } from 'utilities/src/addresses'
import { getChainUrlParam } from 'utils/chainParams'

const TokenName = styled(ThemedText.BodyPrimary)`
  display: none;

  @media (max-width: ${breakpoints.xl}px) and (min-width: ${breakpoints.xs}px) {
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

  @media (max-width: ${breakpoints.xl}px) and (min-width: ${breakpoints.xs}px) {
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
  chainId?: UniverseChainId
  tokens: ((RingToken & { logoUrl?: string; isNative?: boolean }) | undefined)[]
  loading?: boolean
}

export function PoolDetailsLink({ address, chainId, tokens, loading }: PoolDetailsLinkProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    const checksummedAddress = isAddress(address)
    checksummedAddress && setCopied(checksummedAddress)
  }, [address, setCopied])
  const isPool = tokens.length === 2
  const ringTokens = useDefaultRingActiveTokens(chainId)
  const token0Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === tokens[0]?.originToken?.address?.toLowerCase(),
  ) as any
  const token1Info = Object.values(ringTokens).find(
    (item) => item.address.toLowerCase() === tokens[1]?.originToken?.address?.toLowerCase(),
  ) as any
  const unwrappedToken0 = unwrapFewToken(chainId ?? UniverseChainId.Mainnet, tokens[0], token0Info?.logoURI)
  const unwrappedToken1 = isPool
    ? unwrapFewToken(chainId ?? UniverseChainId.Mainnet, tokens[1], token1Info?.logoURI)
    : undefined
  const isNative = address === NATIVE_CHAIN_ID || (tokens[0] && !isPool && tokens[0].standard === Standard.Native)
  const nativeLogo = getChainInfo(chainId ?? UniverseChainId.Mainnet).nativeCurrency.logo
  const explorerUrl =
    chainId &&
    getExplorerLink(
      chainId,
      address ?? '',
      isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    )

  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()
  const chainUrlParam = getChainUrlParam(chainId ?? defaultChainId)
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.address, chainUrlParam }))
    }
  }, [navigate, tokens, isPool, chainUrlParam])

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
    [truncateAddress],
  )

  if (loading || !chainId) {
    return (
      <Flex gap="$spacing8">
        <LoadingBubble containerWidth="100%" width="100%" />
        <LoadingBubble containerWidth="100%" width="100%" />
      </Flex>
    )
  }

  return (
    <Row align="space-between">
      <TokenTextWrapper
        data-testid={
          isPool
            ? `pdp-pool-logo-${unwrappedToken0?.symbol}-${unwrappedToken1?.symbol}`
            : `pdp-token-logo-${unwrappedToken0?.symbol}`
        }
        isClickable={!isPool}
        onClick={handleTokenTextClick}
        ref={onTextRender}
      >
        {isPool ? (
          <PortfolioLogo
            chainId={chainId}
            images={[
              (unwrappedToken0?.isNative ? nativeLogo : unwrappedToken0?.logoUrl) as string,
              (unwrappedToken1?.isNative ? nativeLogo : unwrappedToken1?.logoUrl) as string,
            ]}
            size={20}
          />
        ) : (
          <PortfolioLogo
            chainId={chainId}
            images={[(unwrappedToken0?.isNative ? nativeLogo : unwrappedToken0?.logoUrl) as string]}
            size={20}
          />
        )}
        <TokenName>{isPool ? <Trans i18nKey="common.pool" /> : unwrappedToken0?.name}</TokenName>
        <SymbolText>
          {isPool ? (
            `${unwrappedToken0?.symbol} / ${unwrappedToken1?.symbol}`
          ) : (
            <Row gap="4px">
              {unwrappedToken0?.symbol} <ChevronRight size={16} color={theme.neutral2} />
            </Row>
          )}
        </SymbolText>
      </TokenTextWrapper>
      <ButtonsRow>
        {!isNative && (
          <MouseoverTooltip
            disabled
            forceShow={isCopied}
            placement="bottom"
            size={TooltipSize.Max}
            text={t('common.copied')}
          >
            <CopyAddress data-testid={`copy-address-${address}`} onClick={copy}>
              {shortenAddress(address, truncateAddress ? 2 : undefined, truncateAddress === 'both' ? 2 : undefined)}
              <StyledCopyIcon />
            </CopyAddress>
          </MouseoverTooltip>
        )}
        {explorerUrl && (
          <ExternalLink href={explorerUrl} data-testid={`explorer-url-${explorerUrl}`}>
            <ExplorerWrapper>
              {chainId === UniverseChainId.Mainnet ? (
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
