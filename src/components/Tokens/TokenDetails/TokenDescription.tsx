import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import Column from 'components/Column'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { Globe } from 'components/Icons/Globe'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import Row from 'components/Row'
import { FOTTooltipContent } from 'components/swap/SwapLineItem'
import { NoInfoAvailable, truncateDescription, TruncateDescriptionButton } from 'components/Tokens/TokenDetails/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useTokenProjectQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName } from 'graphql/data/util'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { useCallback, useReducer } from 'react'
import { Copy } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { shortenAddress } from 'utils'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

const TokenInfoSection = styled(Column)`
  gap: 16px;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.sm}px) {
    max-width: 45%;
  }
`

const TokenNameRow = styled(Row)`
  gap: 8px;
  width: 100%;
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
  isNative = false,
  characterCount = TRUNCATE_CHARACTER_COUNT,
}: {
  tokenAddress: string
  chainId?: number
  isNative?: boolean
  characterCount?: number
}) {
  const color = useTheme().neutral1
  const chainName = chainIdToBackendName(chainId)
  const { data: tokenQuery } = useTokenProjectQuery({
    variables: {
      address: isNative ? getNativeTokenDBAddress(chainName) : tokenAddress,
      chain: chainName,
    },
    errorPolicy: 'all',
  })
  const tokenProject = tokenQuery?.token?.project
  const description = tokenProject?.description
  const explorerUrl = getExplorerLink(
    chainId,
    tokenAddress,
    isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN
  )

  const [, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(tokenAddress)
  }, [tokenAddress, setCopied])

  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncatedDescription = truncateDescription(description ?? '', characterCount)
  const shouldTruncate = !!description && description.length > characterCount
  const showTruncatedDescription = shouldTruncate && isDescriptionTruncated
  const { inputTax: sellFee, outputTax: buyFee } = useSwapTaxes(tokenAddress, tokenAddress)
  const { formatPercent } = useFormatter()
  const { sellFeeString, buyFeeString } = {
    sellFeeString: formatPercent(sellFee),
    buyFeeString: formatPercent(buyFee),
  }
  const hasFee = Boolean(parseFloat(sellFeeString)) || Boolean(parseFloat(buyFee.toFixed(2)))
  const sameFee = sellFeeString === buyFeeString

  return (
    <TokenInfoSection>
      <ThemedText.HeadlineSmall>
        <Trans>Info</Trans>
      </ThemedText.HeadlineSmall>
      <TokenButtonRow>
        {!isNative && (
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
      {hasFee && (
        <MouseoverTooltip
          placement="left"
          size={TooltipSize.Small}
          text={
            <ThemedText.Caption color="neutral2">
              <FOTTooltipContent />
            </ThemedText.Caption>
          }
        >
          <Column gap="sm">
            {sameFee ? (
              <ThemedText.BodyPrimary>
                {tokenQuery?.token?.symbol}&nbsp;
                <Trans>fee:</Trans>&nbsp;{sellFeeString}
              </ThemedText.BodyPrimary>
            ) : (
              <>
                <ThemedText.BodyPrimary>
                  {tokenQuery?.token?.symbol}&nbsp;
                  <Trans>buy fee:</Trans>&nbsp;{buyFeeString}
                </ThemedText.BodyPrimary>{' '}
                <ThemedText.BodyPrimary>
                  {tokenQuery?.token?.symbol}&nbsp;
                  <Trans>sell fee:</Trans>&nbsp;{sellFeeString}
                </ThemedText.BodyPrimary>{' '}
              </>
            )}
          </Column>
        </MouseoverTooltip>
      )}
    </TokenInfoSection>
  )
}
