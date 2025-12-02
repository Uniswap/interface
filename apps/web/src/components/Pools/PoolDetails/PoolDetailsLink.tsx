import { getTokenDetailsURL, gqlToCurrency } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import Row from 'components/deprecated/Row'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useCopyClipboard from 'hooks/useCopyClipboard'
import styled, { useTheme } from 'lib/styled-components'
import { useCallback, useState } from 'react'
import { ChevronRight, Copy } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { ClickableStyle, EllipsisStyle } from 'theme/components/styles'
import { Flex } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
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
  tokens: (GraphQLApi.Token | undefined)[]
  loading?: boolean
}

export function PoolDetailsLink({ address, chainId, tokens, loading }: PoolDetailsLinkProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const currency = tokens[0] && gqlToCurrency(tokens[0])
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    const checksummedAddress = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: true })
    checksummedAddress && setCopied(checksummedAddress)
  }, [address, setCopied])
  const isPool = tokens.length === 2
  const isNative =
    address === NATIVE_CHAIN_ID || (tokens[0] && !isPool && tokens[0].standard === GraphQLApi.TokenStandard.Native)
  const currencies = isPool && tokens[1] ? [currency, gqlToCurrency(tokens[1])] : [currency]
  const explorerUrl =
    chainId &&
    getExplorerLink({
      chainId,
      data: address ?? '',
      type: isNative ? ExplorerDataType.NATIVE : isPool ? ExplorerDataType.ADDRESS : ExplorerDataType.TOKEN,
    })

  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()
  const chainUrlParam = getChainUrlParam(chainId ?? defaultChainId)
  const handleTokenTextClick = useCallback(() => {
    if (!isPool) {
      navigate(getTokenDetailsURL({ address: tokens[0]?.address, chainUrlParam }))
    }
  }, [navigate, tokens, isPool, chainUrlParam])

  const [truncateAddress, setTruncateAddress] = useState<false | 'start' | 'both'>(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +truncateAddress
  const onTextRender = useCallback(
    (textRef: HTMLElement | undefined) => {
      if (textRef) {
        const hasOverflow = textRef.clientWidth < textRef.scrollWidth
        if (hasOverflow) {
          setTruncateAddress((prev) => (prev ? 'both' : 'start'))
        }
      }
    },
    // This callback must run after it sets truncateAddress to 'start' to see if it needs to 'both'.
    // It checks if the textRef has overflow, and sets truncateAddress accordingly to avoid it.
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
          isPool ? `pdp-pool-logo-${tokens[0]?.symbol}-${tokens[1]?.symbol}` : `pdp-token-logo-${tokens[0]?.symbol}`
        }
        isClickable={!isPool}
        onClick={handleTokenTextClick}
        ref={onTextRender}
      >
        {isPool ? (
          <DoubleCurrencyLogo currencies={currencies} size={20} />
        ) : (
          <CurrencyLogo currency={currency} size={20} />
        )}
        <TokenName>{isPool ? <Trans i18nKey="common.pool" /> : tokens[0]?.name}</TokenName>
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
          <MouseoverTooltip
            disabled
            forceShow={isCopied}
            placement="bottom"
            size={TooltipSize.Max}
            text={t('common.copied')}
          >
            <CopyAddress data-testid={`copy-address-${address}`} onClick={copy}>
              {shortenAddress({
                address,
                chars: truncateAddress ? 2 : undefined,
                charsEnd: truncateAddress === 'both' ? 2 : undefined,
              })}
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
