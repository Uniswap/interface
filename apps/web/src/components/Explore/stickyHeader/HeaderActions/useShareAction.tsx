import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Check } from 'ui/src/components/icons/Check'
import { LinkHorizontalAlt } from 'ui/src/components/icons/LinkHorizontalAlt'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import type { HeaderActionWithDropdown } from '~/components/Explore/stickyHeader/HeaderActions/types'
import useCopyClipboard from '~/hooks/useCopyClipboard'
import { openTwitterShareWindow } from '~/utils/sharing'

type UseShareActionParams = {
  name: string
  utmSource: string
  isMobileScreen: boolean
}

export function useShareAction({ name, utmSource, isMobileScreen }: UseShareActionParams): {
  shareAction: HeaderActionWithDropdown
} {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [isCopied, setCopied] = useCopyClipboard()

  const utmTag = `${searchParams.size > 0 ? '&' : '?'}utm_source=${utmSource}&utm_medium=${isMobileScreen ? 'mobile' : 'web'}`
  const currentLocation = window.location.href + utmTag

  const shareAction: HeaderActionWithDropdown = useMemo(
    () => ({
      title: t('common.share'),
      icon: <ShareArrow size="$icon.18" color="$neutral2" />,
      show: true,
      dropdownItems: [
        {
          title: isCopied ? t('common.copied') : t('common.copyLink.button'),
          icon: isCopied ? (
            <Check size="$icon.18" padding="$padding1" color="$statusSuccess" />
          ) : (
            <LinkHorizontalAlt size="$icon.18" color="$neutral1" />
          ),
          onPress: () => setCopied(currentLocation),
          show: true,
        },
        {
          title: t('common.share.shareToTwitter'),
          icon: <ShareArrow size="$icon.18" color="$neutral2" />,
          onPress: () =>
            openTwitterShareWindow({
              text: t('common.share.twitter.token', { name }),
              url: currentLocation,
            }),
          show: true,
        },
      ],
    }),
    [t, isCopied, setCopied, currentLocation, name],
  )

  return { shareAction }
}
