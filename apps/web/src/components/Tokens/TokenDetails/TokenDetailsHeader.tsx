import { t, Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
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
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenQueryData } from 'graphql/data/Token'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useScreenSize } from 'hooks/useScreenSize'
import { useReducer, useRef } from 'react'
import { Link } from 'react-feather'
import styled, { css, useTheme } from 'styled-components'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { TokenNameCell } from './Skeleton'

const HeaderActionsContainer = styled.div`
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 8px;
    border-radius: 12px;
    background: ${({ theme }) => theme.surface2};
    gap: 8px;
    border-radius: 12px;
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
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    gap: 8px;
    padding: 8px 12px;
    border-radius: 20px;
    color: ${({ theme }) => theme.neutral1};
    background-color: ${({ theme }) => opacify(12, theme.neutral1)};
    width: max-content;
    ${ClickableStyle}
  }

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    align-items: center;
    text-decoration: none;
    cursor: pointer;
    gap: 12px;
    padding: 10px 8px;
    border-radius: 8px;
    &:hover {
      background: ${({ theme }) => theme.surface3};
    }
  }
`

const TokenTitle = styled.div<{ isInfoTDPEnabled?: boolean }>`
  display: flex;

  ${({ isInfoTDPEnabled }) =>
    isInfoTDPEnabled
      ? css`
          gap: 8px;
          overflow: hidden;
          white-space: nowrap;
        `
      : css`
          @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
            display: inline;
          }
        `}
`

const TokenSymbol = styled.h1<{ isInfoTDPEnabled?: boolean }>`
  font-weight: 485;
  font-size: ${({ isInfoTDPEnabled }) => (isInfoTDPEnabled ? '28px' : 'inherit')};
  line-height: inherit;
  margin-top: 0;
  margin-bottom: 0;

  text-transform: uppercase;
  color: ${({ theme }) => theme.neutral2};
  margin-left: 8px;

  ${({ isInfoTDPEnabled }) =>
    isInfoTDPEnabled &&
    css`
      @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
        display: none;
      }
    `}
`

const TokenName = styled(ThemedText.HeadlineMedium)`
  ${EllipsisStyle}
  min-width: 40px;
`

export const StyledExternalLink = styled(ExternalLink)`
  &:hover {
    // Override hover behavior from ExternalLink
    opacity: 1;
  }
`

// eslint-disable-next-line import/no-unused-modules
export const TokenDetailsHeader = ({
  token,
  tokenQueryData,
  address,
  chainId,
}: {
  token: Currency
  tokenQueryData?: TokenQueryData
  address: string
  chainId: ChainId
}) => {
  const isInfoTDPEnabled = useInfoTDPEnabled()
  const theme = useTheme()
  const screenSize = useScreenSize()
  const isMobileScreen = !screenSize['sm']

  const [actionsModalIsOpen, toggleActionsModal] = useReducer((s) => !s, false)
  const actionsRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(actionsRef, actionsModalIsOpen ? toggleActionsModal : undefined)

  const [isShareModalOpen, toggleShareModal] = useReducer((s) => !s, false)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(shareMenuRef, isShareModalOpen ? toggleShareModal : undefined)

  const tokenSymbolName = token && (token.symbol ?? <Trans>Symbol not found</Trans>)

  const explorerUrl = getExplorerLink(
    chainId,
    address,
    token.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN
  )
  const websiteUrl = tokenQueryData?.project?.homepageUrl
  const projTwitterName = tokenQueryData?.project?.twitterName
  const projTwitterUrl = projTwitterName && `https://x.com/${projTwitterName}`
  const currentLocation = window.location.href

  const twitterShareName =
    token && token.name && token.symbol ? `${token.name} (${token.symbol})` : token?.name || token?.symbol || ''

  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <>
      <TokenNameCell isInfoTDPEnabled={isInfoTDPEnabled}>
        <PortfolioLogo currencies={[token]} chainId={token.chainId} size="32px" />
        {isInfoTDPEnabled ? (
          <TokenTitle isInfoTDPEnabled>
            <TokenName>{token.name ?? <Trans>Name not found</Trans>}</TokenName>
            <TokenSymbol isInfoTDPEnabled>{tokenSymbolName}</TokenSymbol>
          </TokenTitle>
        ) : (
          <TokenTitle>
            {token.name ?? <Trans>Name not found</Trans>}
            <TokenSymbol>{tokenSymbolName}</TokenSymbol>
          </TokenTitle>
        )}
      </TokenNameCell>
      {isInfoTDPEnabled ? (
        <div ref={actionsRef}>
          {isMobileScreen && <StyledMenuIcon onClick={toggleActionsModal} />}
          {!isMobileScreen || (isMobileScreen && actionsModalIsOpen) ? (
            <HeaderActionsContainer>
              {explorerUrl && (
                <MouseoverTooltip
                  text={t`Explorer`}
                  placement="bottom"
                  size={TooltipSize.Max}
                  disabled={isMobileScreen}
                >
                  <StyledExternalLink href={explorerUrl}>
                    <ActionButton>
                      {chainId === ChainId.MAINNET ? (
                        <EtherscanLogo width="18px" height="18px" fill={theme.neutral1} />
                      ) : (
                        <ExplorerIcon width="18px" height="18px" stroke={theme.darkMode ? 'none' : theme.neutral1} />
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
              {websiteUrl && (
                <MouseoverTooltip text={t`Website`} placement="bottom" size={TooltipSize.Max} disabled={isMobileScreen}>
                  <StyledExternalLink href={websiteUrl}>
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
              {projTwitterUrl && (
                <MouseoverTooltip text={t`Twitter`} placement="bottom" size={TooltipSize.Max} disabled={isMobileScreen}>
                  <StyledExternalLink href={projTwitterUrl}>
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
                <MouseoverTooltip text={t`Share`} placement="bottom" size={TooltipSize.Max}>
                  <ShareButton name={twitterShareName} />
                </MouseoverTooltip>
              )}
            </HeaderActionsContainer>
          ) : null}
        </div>
      ) : (
        <HeaderActionsContainer>
          <ShareButton name={twitterShareName} />
        </HeaderActionsContainer>
      )}
    </>
  )
}
