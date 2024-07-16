import Column from 'components/Column'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { Globe } from 'components/Icons/Globe'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import Row from 'components/Row'
import { FOTTooltipContent } from 'components/swap/SwapLineItem'
import { NoInfoAvailable, truncateDescription, TruncateDescriptionButton } from 'components/Tokens/TokenDetails/shared'
import Tooltip, { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { t, Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useCallback, useReducer } from 'react'
import { Copy } from 'react-feather'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { shortenAddress } from 'utilities/src/addresses'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const TokenInfoSection = styled(Column)`
  gap: 16px;
  width: 100%;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    gap: 24px;
  }
`

const InfoSectionHeader = styled(ThemedText.HeadlineSmall)`
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    font-size: 28px !important;
    line-height: 36px !important;
  }
`

const TokenNameRow = styled(Row)`
  gap: 8px;
  width: 100%;
`

const TokenButtonRow = styled(TokenNameRow)`
  flex-wrap: wrap;
`

const TokenInfoButton = styled(Row)`
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  color: ${({ theme }) => theme.neutral1};
  background-color: ${({ theme }) => theme.surface2};
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

const DescriptionVisibilityWrapper = styled.p<{ $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? 'inline' : 'none')};
`

const TRUNCATE_CHARACTER_COUNT = 200

export function TokenDescription() {
  const { address, currency, tokenQuery } = useTDPContext()
  const { neutral2 } = useTheme()

  const { description, homepageUrl, twitterName } = tokenQuery.data?.token?.project ?? {}
  const explorerUrl = getExplorerLink(
    currency.chainId,
    address,
    currency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
  )

  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(address)
  }, [address, setCopied])

  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncatedDescription = truncateDescription(description ?? '', TRUNCATE_CHARACTER_COUNT)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT
  const showTruncatedDescription = shouldTruncate && isDescriptionTruncated
  const { inputTax: sellFee, outputTax: buyFee } = useSwapTaxes(address, address, currency.chainId)
  const { formatPercent } = useFormatter()
  const { sellFeeString, buyFeeString } = {
    sellFeeString: formatPercent(sellFee),
    buyFeeString: formatPercent(buyFee),
  }
  const hasFee = Boolean(parseFloat(sellFeeString)) || Boolean(parseFloat(buyFee.toFixed(2)))
  const sameFee = sellFeeString === buyFeeString

  return (
    <TokenInfoSection data-testid="token-details-info-section">
      <InfoSectionHeader>
        <Trans i18nKey="common.info.label" />
      </InfoSectionHeader>
      <TokenButtonRow data-testid="token-details-info-links">
        {!currency.isNative && (
          <Tooltip placement="bottom" size={TooltipSize.Max} show={isCopied} text={t('common.copied')}>
            <TokenInfoButton onClick={copy}>
              <Copy width="18px" height="18px" color={neutral2} />
              {shortenAddress(currency.address)}
            </TokenInfoButton>
          </Tooltip>
        )}
        <ExternalLink href={explorerUrl}>
          <TokenInfoButton>
            <EtherscanLogo width="18px" height="18px" fill={neutral2} />
            {currency.chainId === UniverseChainId.Mainnet ? (
              <Trans i18nKey="common.etherscan" />
            ) : (
              <Trans i18nKey="common.explorer" />
            )}
          </TokenInfoButton>
        </ExternalLink>
        {homepageUrl && (
          <ExternalLink href={homepageUrl}>
            <TokenInfoButton>
              <Globe width="18px" height="18px" fill={neutral2} />
              <Trans i18nKey="common.website" />
            </TokenInfoButton>
          </ExternalLink>
        )}
        {twitterName && (
          <ExternalLink href={`https://x.com/${twitterName}`}>
            <TokenInfoButton>
              <TwitterXLogo width="18px" height="18px" fill={neutral2} />
              <Trans i18nKey="common.twitter" />
            </TokenInfoButton>
          </ExternalLink>
        )}
      </TokenButtonRow>
      <TokenDescriptionContainer>
        {!description && (
          <NoInfoAvailable>
            <Trans i18nKey="tdp.noInfoAvailable" />
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
            {isDescriptionTruncated ? (
              <Trans i18nKey="common.showMore.button" />
            ) : (
              <Trans i18nKey="common.hide.button" />
            )}
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
                {currency.symbol}&nbsp;
                <Trans i18nKey="token.fee.label" />
                &nbsp;{sellFeeString}
              </ThemedText.BodyPrimary>
            ) : (
              <>
                <ThemedText.BodyPrimary>
                  {currency.symbol}&nbsp;
                  <Trans i18nKey="token.fee.buy.label" />
                  &nbsp;{buyFeeString}
                </ThemedText.BodyPrimary>{' '}
                <ThemedText.BodyPrimary>
                  {currency.symbol}&nbsp;
                  <Trans i18nKey="token.fee.sell.label" />
                  &nbsp;{sellFeeString}
                </ThemedText.BodyPrimary>{' '}
              </>
            )}
          </Column>
        </MouseoverTooltip>
      )}
    </TokenInfoSection>
  )
}
