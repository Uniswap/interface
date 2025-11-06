import { Dropdown } from 'components/Dropdowns/Dropdown'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import { ActionButtonStyle, DropdownAction } from 'components/Tokens/TokenDetails/shared'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useState } from 'react'
import { Link } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Text, useMedia, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { isMobileWeb } from 'utilities/src/platform'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

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
  const media = useMedia()

  const [searchParams] = useSearchParams()
  const utmTag = `${searchParams.size > 0 ? '&' : '?'}utm_source=${utmSource}&utm_medium=${isMobileWeb ? 'mobile' : 'web'}`
  const currentLocation = window.location.href + utmTag

  const [isCopied, setCopied] = useCopyClipboard()

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      menuLabel={<ShareIcon fill={colors.neutral1.val} width={18} height={18} />}
      tooltipText={media.sm ? undefined : t('common.share')}
      hideChevron
      buttonStyle={ActionButtonStyle}
      dropdownStyle={{ width: 200 }}
      alignRight
    >
      <DropdownAction onClick={() => setCopied(currentLocation)}>
        {isCopied ? (
          <Check size="$icon.16" p={1} color="$statusSuccess" />
        ) : (
          <Link width="18px" height="18px" color={colors.neutral1.val} />
        )}
        <Text variant="body2">{isCopied ? t('common.copied') : t('common.copyLink.button')}</Text>
      </DropdownAction>
      <DropdownAction
        onClick={() => {
          setIsOpen(false)
          openShareTweetWindow(name)
        }}
      >
        <TwitterXLogo width="18px" height="18px" fill={colors.neutral1.val} />
        <Text variant="body2">{t('common.share.shareToTwitter')}</Text>
      </DropdownAction>
    </Dropdown>
  )
}
