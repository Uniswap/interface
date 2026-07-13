import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { Flag } from 'ui/src/components/icons/Flag'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { deriveFromSections } from '~/components/StickyCollapsibleHeader/HeaderActions/deriveHeaderActions'
import {
  type HeaderAction,
  type HeaderActionDropdownItem,
  type HeaderActionSection,
} from '~/components/StickyCollapsibleHeader/HeaderActions/types'
import { useShareAction } from '~/components/StickyCollapsibleHeader/HeaderActions/useShareAction'

type TokenDetailsHeaderActionsParams = {
  currency: Currency
  project?: { homepageUrl?: string; twitterName?: string } | null
  openReportTokenModal: () => void
  openReportDataIssueModal: () => void
  isMobileScreen: boolean
}

export function useTokenDetailsHeaderActions({
  currency,
  project,
  openReportTokenModal,
  openReportDataIssueModal,
  isMobileScreen,
}: TokenDetailsHeaderActionsParams): {
  desktopHeaderActions: HeaderAction[]
  mobileHeaderActionSections: HeaderActionSection[]
} {
  const { t } = useTranslation()

  const twitterShareName =
    currency.name && currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name || currency.symbol || ''
  const { shareAction } = useShareAction({
    name: twitterShareName,
    utmSource: 'share-tdp',
    isMobileScreen,
  })

  const { twitterName } = project ?? {}
  const twitterUrl = twitterName ? `https://x.com/${twitterName}` : undefined

  const reportActions: HeaderActionDropdownItem[] = useMemo(
    () => [
      {
        title: t('reporting.token.data.title'),
        icon: <ChartBarCrossed size="$icon.18" color="$neutral1" />,
        onPress: openReportDataIssueModal,
        show: true,
      },
      {
        title: t('reporting.token.report.title'),
        textColor: '$statusCritical' as const,
        icon: <Flag size="$icon.18" color="$statusCritical" />,
        onPress: openReportTokenModal,
        show: !currency.isNative,
      },
    ],
    [t, openReportDataIssueModal, openReportTokenModal, currency.isNative],
  )

  const sections: HeaderActionSection[] = useMemo(() => {
    const detailsActions: HeaderAction[] = [
      {
        title: t('common.twitter'),
        icon: <XTwitter size="$icon.18" color="$neutral2" />,
        href: twitterUrl,
        onPress: () => {},
        show: !!twitterUrl,
      },
    ]

    const detailsSection: HeaderActionSection | null = detailsActions.some((a) => a.show)
      ? { title: t('common.details'), actions: detailsActions }
      : null

    return [
      ...(detailsSection ? [detailsSection] : []),
      {
        title: t('common.share'),
        actions: [shareAction],
      },
      {
        title: t('common.report'),
        actions: [
          {
            title: t('common.more'),
            icon: <Ellipsis size="$icon.18" color="$neutral2" />,
            show: true,
            dropdownItems: reportActions,
          },
        ],
      },
    ]
  }, [t, shareAction, twitterUrl, reportActions])

  return useMemo(() => deriveFromSections(sections), [sections])
}
