import { Trans, t } from '@lingui/macro'
import { DropdownSelector } from 'components/DropdownSelector'
import { CheckMark } from 'components/Icons/CheckMark'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import { ActionButtonStyle, ActionMenuFlyoutStyle } from 'components/Tokens/TokenDetails/shared'
import { useInfoPoolPageEnabled } from 'featureFlags/flags/infoPoolPage'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { Link, Twitter } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components'
import { colors } from 'theme/colors'
import { ClickableStyle, CopyHelper, CopyHelperRefType, ThemedText } from 'theme/components'
import { dropdownSlideDown } from 'theme/styles'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

const ShareButtonDisplay = styled.div`
  display: flex;
  position: relative;
`

const Share = styled(ShareIcon)<{ open: boolean }>`
  height: 24px;
  width: 24px;
  ${ClickableStyle}
  ${({ open, theme }) => open && `opacity: ${theme.opacity.click} !important`};
`

const ShareActions = styled.div<{ $isInfoTDPEnabled?: boolean; $isInfoPDPEnabled?: boolean }>`
  position: absolute;
  z-index: ${Z_INDEX.dropdown};
  width: 200px;
  top: ${({ $isInfoTDPEnabled, $isInfoPDPEnabled }) => ($isInfoTDPEnabled || $isInfoPDPEnabled ? '40px' : '36px')};
  right: 0px;
  justify-content: center;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 8px;
  background-color: ${({ theme }) => theme.surface1};
  border: 0.5px solid ${({ theme }) => theme.surface3};
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  border-radius: 12px;
  ${dropdownSlideDown}
`
const ShareAction = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 485;
  gap: 12px;
  height: 40px;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => opacify(10, theme.darkMode ? colors.gray200 : colors.gray300)};
  }
`

export function openShareTweetWindow(name: string) {
  const currentLocation = window.location.href
  const positionX = (window.screen.width - TWITTER_WIDTH) / 2
  const positionY = (window.screen.height - TWITTER_HEIGHT) / 2
  window.open(
    `https://twitter.com/intent/tweet?text=Check%20out%20${name}%20${currentLocation}%20via%20@Uniswap`,
    'newwindow',
    `left=${positionX}, top=${positionY}, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`
  )
}

export default function ShareButton({ name }: { name: string }) {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SHARE)
  const toggleShare = useToggleModal(ApplicationModal.SHARE)
  useOnClickOutside(node, open ? toggleShare : undefined)

  useDisableScrolling(open)

  const isInfoTDPEnabled = useInfoTDPEnabled()
  const isInfoPDPEnabled = useInfoPoolPageEnabled()

  const currentLocation = window.location.href

  const copyHelperRef = useRef<CopyHelperRefType>(null)
  const [isCopied, setCopied] = useCopyClipboard()

  return isInfoTDPEnabled || isInfoPDPEnabled ? (
    <div ref={node}>
      <DropdownSelector
        isOpen={open}
        toggleOpen={toggleShare}
        menuLabel={<ShareIcon fill={theme.neutral1} width={18} height={18} />}
        tooltipText={t`Share`}
        internalMenuItems={
          <>
            <ShareAction onClick={() => setCopied(currentLocation)}>
              {isCopied ? (
                <CheckMark height={18} width={18} />
              ) : (
                <Link width="18px" height="18px" color={theme.neutral1} />
              )}
              <ThemedText.BodyPrimary>
                {isCopied ? <Trans>Copied</Trans> : <Trans>Copy link</Trans>}
              </ThemedText.BodyPrimary>
            </ShareAction>
            <ShareAction
              onClick={() => {
                toggleShare()
                openShareTweetWindow(name)
              }}
            >
              <TwitterXLogo width="18px" height="18px" fill={theme.neutral1} />
              <ThemedText.BodyPrimary>
                <Trans>Share to Twitter</Trans>
              </ThemedText.BodyPrimary>
            </ShareAction>
          </>
        }
        hideChevron
        buttonCss={ActionButtonStyle}
        menuFlyoutCss={ActionMenuFlyoutStyle}
      />
    </div>
  ) : (
    <ShareButtonDisplay ref={node}>
      <Share onClick={toggleShare} aria-label="ShareOptions" open={open} fill="#9B9B9B" />
      {open && (
        <ShareActions>
          <ShareAction onClick={() => copyHelperRef.current?.forceCopy()}>
            <CopyHelper
              InitialIcon={Link}
              color={theme.neutral1}
              iconPosition="left"
              gap={12}
              toCopy={currentLocation}
              ref={copyHelperRef}
            >
              <Trans>Copy link</Trans>
            </CopyHelper>
          </ShareAction>

          <ShareAction
            onClick={() => {
              toggleShare()
              openShareTweetWindow(name)
            }}
          >
            <Twitter color={theme.neutral1} size={20} strokeWidth={1.5} />
            <Trans>Share to Twitter</Trans>
          </ShareAction>
        </ShareActions>
      )}
    </ShareButtonDisplay>
  )
}
