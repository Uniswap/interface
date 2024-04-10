import { Trans, t } from '@lingui/macro'
import { DropdownSelector } from 'components/DropdownSelector'
import { CheckMark } from 'components/Icons/CheckMark'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import { ActionButtonStyle, ActionMenuFlyoutStyle } from 'components/Tokens/TokenDetails/shared'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { Link } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components'
import { colors } from 'theme/colors'
import { ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

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

  const currentLocation = window.location.href

  const [isCopied, setCopied] = useCopyClipboard()

  return (
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
  )
}
