import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import Column from 'components/Column'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { Globe } from 'components/Icons/Globe'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { NoInfoAvailable, truncateDescription, TruncateDescriptionButton } from 'components/Tokens/TokenDetails/shared'
import { useTokenProjectQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useColor } from 'hooks/useColor'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useCallback, useReducer } from 'react'
import { Copy } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { shortenAddress } from 'utils'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const TokenInfoSection = styled(Column)`
  gap: 12px;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.sm}px) {
    max-width: 45%;
  }
`

const TokenNameRow = styled(Row)`
  gap: 8px;
  width: 100%;
`

const TokenName = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`

const TokenButtonRow = styled(TokenNameRow)`
  flex-wrap: wrap;
`

const TokenInfoButton = styled(Row)<{ tokenColor: string }>`
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  color: ${({ tokenColor }) => tokenColor};
  background-color: ${({ tokenColor }) => opacify(12, tokenColor)};
  font-size: 14px;
  font-weight: 535;
  line-height: 16px;
  width: max-content;
  ${ClickableStyle}
`

const TokenDescriptionContainer = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
  max-width: 100%;
  // max-height: fit-content;
  line-height: 24px;
  white-space: pre-wrap;
`

const DescriptionVisibilityWrapper = styled.span<{ $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? 'inline' : 'none')};
`

const TRUNCATE_CHARACTER_COUNT = 75

export function TokenDescription({
  tokenAddress,
  chainId = ChainId.MAINNET,
  showCopy = false,
}: {
  tokenAddress: string
  chainId?: number
  showCopy?: boolean
}) {
  const currency = useCurrency(tokenAddress, chainId)
  const theme = useTheme()
  const color = useColor(currency?.wrapped, theme.surface1, theme.darkMode)
  const { data: tokenQuery } = useTokenProjectQuery({
    variables: {
      address: tokenAddress,
      chain: chainIdToBackendName(chainId),
    },
    errorPolicy: 'all',
  })
  const tokenProject = tokenQuery?.token?.project
  const description = tokenProject?.description
  const explorerUrl = getExplorerLink(chainId, tokenAddress, ExplorerDataType.TOKEN)

  const [, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(tokenAddress)
  }, [tokenAddress, setCopied])

  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncatedDescription = truncateDescription(description ?? '', TRUNCATE_CHARACTER_COUNT)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT
  const showTruncatedDescription = shouldTruncate && isDescriptionTruncated

  return (
    <TokenInfoSection>
      <TokenNameRow>
        <CurrencyLogo currency={currency} size="20px" />
        <TokenName>{currency?.name}</TokenName>
        <ThemedText.BodySecondary>{currency?.symbol}</ThemedText.BodySecondary>
      </TokenNameRow>
      <TokenButtonRow>
        {showCopy && (
          <TokenInfoButton tokenColor={color} onClick={copy}>
            <Copy width="18px" height="18px" color={color} />
            {shortenAddress(tokenAddress)}
          </TokenInfoButton>
        )}
        <ExternalLink href={explorerUrl}>
          <TokenInfoButton tokenColor={color}>
            <EtherscanLogo width="18px" height="18px" fill={color} />
            {chainId === ChainId.MAINNET ? <Trans>Etherscan</Trans> : <Trans>Explorer</Trans>}
          </TokenInfoButton>
        </ExternalLink>
        {!!tokenProject?.homepageUrl && (
          <ExternalLink href={tokenProject.homepageUrl}>
            <TokenInfoButton tokenColor={color}>
              <Globe width="18px" height="18px" fill={color} />
              <Trans>Website</Trans>
            </TokenInfoButton>
          </ExternalLink>
        )}
        {!!tokenProject?.twitterName && (
          <ExternalLink href={`https://x.com/${tokenProject.twitterName}`}>
            <TokenInfoButton tokenColor={color}>
              <TwitterXLogo width="18px" height="18px" fill={color} />
              <Trans>Twitter</Trans>
            </TokenInfoButton>
          </ExternalLink>
        )}
      </TokenButtonRow>
      <TokenDescriptionContainer>
        {!description && (
          <NoInfoAvailable>
            <Trans>No token information available</Trans>
          </NoInfoAvailable>
        )}
        {description && (
          <>
            <DescriptionVisibilityWrapper data-testid="token-description-full" $visible={!showTruncatedDescription}>
              {description}
            </DescriptionVisibilityWrapper>
            <DescriptionVisibilityWrapper data-testid="token-description-truncated" $visible={showTruncatedDescription}>
              {truncatedDescription}
            </DescriptionVisibilityWrapper>
          </>
        )}
        {shouldTruncate && (
          <TruncateDescriptionButton
            onClick={toggleIsDescriptionTruncated}
            data-testid="token-description-show-more-button"
          >
            {isDescriptionTruncated ? <Trans>Show more</Trans> : <Trans>Hide</Trans>}
          </TruncateDescriptionButton>
        )}
      </TokenDescriptionContainer>
    </TokenInfoSection>
  )
}
