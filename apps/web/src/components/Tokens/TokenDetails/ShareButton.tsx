import { DropdownSelector } from 'components/DropdownSelector'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import { ActionButtonStyle, ActionMenuFlyoutStyle } from 'components/Tokens/TokenDetails/shared'
import useCopyClipboard from 'hooks/useCopyClipboard'
import styled from 'lib/styled-components'
import { useState } from 'react'
import { Link } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { colors } from 'theme/colors'
import { opacify } from 'theme/utils'
import { Text, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { useTranslation } from 'uniswap/src/i18n/useTranslation'
import { isMobileWeb } from 'utilities/src/platform'

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
    `left=${positionX}, top=${positionY}, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`,
  )
}

export default function ShareButton({ name, utmSource }: { name: string; utmSource: string }) {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const [searchParams] = useSearchParams()
  const utmTag = `${searchParams.size > 0 ? '&' : '?'}utm_source=${utmSource}&utm_medium=${isMobileWeb ? 'mobile' : 'web'}`
  const currentLocation = window.location.href + utmTag

  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <DropdownSelector
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      menuLabel={<ShareIcon fill={colors.neutral1.val} width={18} height={18} />}
      tooltipText={t('common.share')}
      internalMenuItems={
        <>
          <ShareAction onClick={() => setCopied(currentLocation)}>
            {isCopied ? (
              <Check size={16} p={1} color={colors.statusSuccess.val} />
            ) : (
              <Link width="18px" height="18px" color={colors.neutral1.val} />
            )}
            <Text variant="body2">{isCopied ? t('common.copied') : t('common.copyLink.button')}</Text>
          </ShareAction>
          <ShareAction
            onClick={() => {
              setIsOpen(false)
              openShareTweetWindow(name)
            }}
          >
            <TwitterXLogo width="18px" height="18px" fill={colors.neutral1.val} />
            <Text variant="body2">{t('common.share.shareToTwitter')}</Text>
          </ShareAction>
        </>
      }
      hideChevron
      buttonStyle={ActionButtonStyle}
      dropdownStyle={ActionMenuFlyoutStyle}
      adaptToSheet={false}
    />
  )
}
