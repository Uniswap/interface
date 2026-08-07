import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'ui/src/components/icons/Check'
import { LinkHorizontalAlt } from 'ui/src/components/icons/LinkHorizontalAlt'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import type { HeaderActionWithDropdown } from '~/components/StickyCollapsibleHeader/HeaderActions/types'
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
  const [isCopied, setCopied] = useCopyClipboard()

  // Read window.location at press time: shallow history.replaceState updates (e.g. TDP network pill) bypass the router
  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('utm_source', utmSource)
    url.searchParams.set('utm_medium', isMobileScreen ? 'mobile' : 'web')
    return url.toString()
  }, [utmSource, isMobileScreen])

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
          onPress: () => setCopied(getShareUrl()),
          show: true,
        },
        {
          title: t('common.share.shareToTwitter'),
          icon: <ShareArrow size="$icon.18" color="$neutral2" />,
          onPress: () =>
            openTwitterShareWindow({
              text: t('common.share.twitter.token', { name }),
              url: getShareUrl(),
            }),
          show: true,
        },
      ],
    }),
    [t, isCopied, setCopied, getShareUrl, name],
  )

  return { shareAction }
}
