import { t, Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { ReactComponent as MenuIcon } from 'assets/images/menu.svg'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { CheckMark } from 'components/Icons/CheckMark'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { Globe } from 'components/Icons/Globe'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import Row from 'components/Row'
import ShareButton, { openShareTweetWindow } from 'components/Tokens/TokenDetails/ShareButton'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useScreenSize } from 'hooks/useScreenSize'
import { useReducer, useRef } from 'react'
import { Link } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { TokenNameCell } from './Skeleton'

const HeaderActionsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    flex-direction: column;
    position: fixed;
    bottom: 0;
    left: 0;
    align-items: unset;
    width: 100vw;
    padding: 8px;
    background: ${({ theme }) => theme.surface2};
    border-radius: 12px 12px 0 0;
    border: ${({ theme }) => `1px solid ${theme.surface3}`};
    box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
    opacity: 1 !important;
    z-index: ${Z_INDEX.modal};
  }
`

const StyledMenuIcon = styled(MenuIcon)`
  padding: 8px 12px;
  border-radius: 20px;
  color: ${({ theme }) => theme.neutral1};
  background-color: ${({ theme }) => opacify(12, theme.neutral1)};
  width: 40px;
  height: 32px;
  margin-top: 8px;
  ${ClickableStyle}

  path {
    stroke: ${({ theme }) => theme.neutral1};
  }
`

const ActionButton = styled(Row)`
  ${ActionButtonStyle}

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    color: unset;
    background-color: unset;
    width: unset;

    align-items: center;
    text-decoration: none;
    cursor: pointer;
    gap: 12px;
    padding: 10px 8px;
    border-radius: 8px;
    &:hover {
      background: ${({ theme }) => theme.surface3};
      opacity: 1;
    }
  }
`

const TokenTitle = styled.div`
  display: flex;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
`

const TokenSymbol = styled(ThemedText.SubHeaderSmall)`
  font-size: 24px !important;
  line-height: inherit;
  margin-top: 0;
  margin-bottom: 0;

  text-transform: uppercase;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    display: none;
  }
`

const TokenName = styled(ThemedText.HeadlineMedium)`
  ${EllipsisStyle}
  font-size: 24px !important;
  min-width: 40px;
`

export const StyledExternalLink = styled(ExternalLink)`
  &:hover {
    // Override hover behavior from ExternalLink
    opacity: 1;
  }
`
export const TokenDetailsHeader = () => {
  const { address, currency, tokenQuery } = useTDPContext()

  const theme = useTheme()
  const screenSize = useScreenSize()
  const isMobileScreen = !screenSize['xs']

  const [actionsModalIsOpen, toggleActionsModal] = useReducer((s) => !s, false)
  const actionsRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(actionsRef, actionsModalIsOpen ? toggleActionsModal : undefined)

  const [isShareModalOpen, toggleShareModal] = useReducer((s) => !s, false)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(shareMenuRef, isShareModalOpen ? toggleShareModal : undefined)

  const tokenSymbolName = currency.symbol ?? <Trans>Symbol not found</Trans>

  const explorerUrl = getExplorerLink(
    currency.chainId,
    address,
    currency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN
  )

  const { homepageUrl, twitterName, logoUrl } = tokenQuery.data?.token?.project ?? {}
  const twitterUrl = twitterName && `https://x.com/${twitterName}`

  const currentLocation = window.location.href

  const twitterShareName =
    currency.name && currency.symbol
      ? `${currency.name} (${currency.symbol})`
      : currency?.name || currency?.symbol || ''

  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <>
      <TokenNameCell>
        <PortfolioLogo currencies={[currency]} images={[logoUrl]} chainId={currency.chainId} size="32px" />
        <TokenTitle>
          <TokenName>{currency.name ?? <Trans>Name not found</Trans>}</TokenName>
          <TokenSymbol>{tokenSymbolName}</TokenSymbol>
        </TokenTitle>
      </TokenNameCell>
      <div ref={actionsRef}>
        {isMobileScreen && <StyledMenuIcon onClick={toggleActionsModal} />}
        {!isMobileScreen || (isMobileScreen && actionsModalIsOpen) ? (
          <HeaderActionsContainer>
            {explorerUrl && (
              <MouseoverTooltip text={t`Explorer`} placement="top" size={TooltipSize.Max} disabled={isMobileScreen}>
                <StyledExternalLink href={explorerUrl}>
                  <ActionButton>
                    {currency.chainId === ChainId.MAINNET ? (
                      <EtherscanLogo width="18px" height="18px" fill={theme.neutral1} />
                    ) : (
                      <ExplorerIcon width="18px" height="18px" fill={theme.neutral1} />
                    )}
                    {isMobileScreen && (
                      <ThemedText.BodyPrimary>
                        <Trans>Explorer</Trans>
                      </ThemedText.BodyPrimary>
                    )}
                  </ActionButton>
                </StyledExternalLink>
              </MouseoverTooltip>
            )}
            {homepageUrl && (
              <MouseoverTooltip text={t`Website`} placement="top" size={TooltipSize.Max} disabled={isMobileScreen}>
                <StyledExternalLink href={homepageUrl}>
                  <ActionButton>
                    <Globe width="18px" height="18px" fill={theme.neutral1} />
                    {isMobileScreen && (
                      <ThemedText.BodyPrimary>
                        <Trans>Website</Trans>
                      </ThemedText.BodyPrimary>
                    )}
                  </ActionButton>
                </StyledExternalLink>
              </MouseoverTooltip>
            )}
            {twitterUrl && (
              <MouseoverTooltip text={t`Twitter`} placement="top" size={TooltipSize.Max} disabled={isMobileScreen}>
                <StyledExternalLink href={twitterUrl}>
                  <ActionButton>
                    <TwitterXLogo width="18px" height="18px" fill={theme.neutral1} />
                    {isMobileScreen && (
                      <ThemedText.BodyPrimary>
                        <Trans>Twitter</Trans>
                      </ThemedText.BodyPrimary>
                    )}
                  </ActionButton>
                </StyledExternalLink>
              </MouseoverTooltip>
            )}
            {isMobileScreen ? (
              <>
                <ActionButton onClick={() => setCopied(currentLocation)}>
                  {isCopied ? (
                    <CheckMark height={18} width={18} />
                  ) : (
                    <Link width="18px" height="18px" color={theme.neutral1} />
                  )}
                  <ThemedText.BodyPrimary>
                    {isCopied ? <Trans>Copied</Trans> : <Trans>Copy link</Trans>}
                  </ThemedText.BodyPrimary>
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    toggleActionsModal()
                    openShareTweetWindow(twitterShareName)
                  }}
                >
                  <ShareIcon fill={theme.neutral1} width={18} height={18} />
                  <ThemedText.BodyPrimary>
                    <Trans>Share to Twitter</Trans>
                  </ThemedText.BodyPrimary>
                </ActionButton>
              </>
            ) : (
              <ShareButton name={twitterShareName} />
            )}
          </HeaderActionsContainer>
        ) : null}
      </div>
    </>
  )
}
