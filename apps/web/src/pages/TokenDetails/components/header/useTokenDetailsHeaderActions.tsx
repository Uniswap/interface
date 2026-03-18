import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { Flag } from 'ui/src/components/icons/Flag'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { deriveFromSections } from '~/components/Explore/stickyHeader/HeaderActions/deriveHeaderActions'
import {
  type HeaderAction,
  type HeaderActionDropdownItem,
  type HeaderActionSection,
} from '~/components/Explore/stickyHeader/HeaderActions/types'
import { useShareAction } from '~/components/Explore/stickyHeader/HeaderActions/useShareAction'

type TokenDetailsHeaderActionsParams = {
  currency: Currency
  address: string
  project?: { homepageUrl?: string; twitterName?: string } | null
  openReportTokenModal: () => void
  openReportDataIssueModal: () => void
  isMobileScreen: boolean
}

export function useTokenDetailsHeaderActions({
  currency,
  address,
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

  const explorerUrl = getExplorerLink({
    chainId: currency.chainId,
    data: address,
    type: currency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
  })
  const BlockExplorerIcon = getBlockExplorerIcon(currency.chainId)
  const explorerName = getChainInfo(currency.chainId).explorer.name

  const { homepageUrl, twitterName } = project ?? {}
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

  const sections: HeaderActionSection[] = useMemo(
    () => [
      {
        title: t('common.details'),
        actions: [
          {
            title: explorerName,
            icon: <BlockExplorerIcon size="$icon.18" color="$neutral2" />,
            href: explorerUrl,
            onPress: () => {},
            show: !!explorerUrl,
          },
          {
            title: t('common.website'),
            icon: <GlobeFilled size="$icon.18" color="$neutral2" />,
            href: homepageUrl,
            onPress: () => {},
            show: !!homepageUrl,
          },
          {
            title: t('common.twitter'),
            icon: <XTwitter size="$icon.18" color="$neutral2" />,
            href: twitterUrl,
            onPress: () => {},
            show: !!twitterUrl,
          },
        ],
      },
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
    ],
    [t, shareAction, explorerName, BlockExplorerIcon, explorerUrl, homepageUrl, twitterUrl, reportActions],
  )

  return useMemo(() => deriveFromSections(sections), [sections])
}
