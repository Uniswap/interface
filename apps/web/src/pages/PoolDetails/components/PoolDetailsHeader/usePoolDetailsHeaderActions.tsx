import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { deriveFromSections } from '~/components/Explore/stickyHeader/HeaderActions/deriveHeaderActions'
import type { HeaderAction, HeaderActionSection } from '~/components/Explore/stickyHeader/HeaderActions/types'
import { useShareAction } from '~/components/Explore/stickyHeader/HeaderActions/useShareAction'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

type UsePoolDetailsHeaderActionsParams = {
  chainId?: UniverseChainId
  poolAddress?: string
  poolName: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  protocolVersion?: GraphQLApi.ProtocolVersion
  openReportDataIssueModal: () => void
  isMobileScreen: boolean
}

function getExplorerUrl(params: {
  chainId: UniverseChainId
  address: string | undefined
  type: ExplorerDataType
}): string | undefined {
  const { chainId, address, type } = params
  if (!address) {
    return undefined
  }
  return getExplorerLink({ chainId, data: address, type })
}

export function usePoolDetailsHeaderActions({
  chainId,
  poolAddress,
  poolName,
  token0,
  token1,
  protocolVersion,
  openReportDataIssueModal,
  isMobileScreen,
}: UsePoolDetailsHeaderActionsParams): {
  desktopHeaderActions: HeaderAction[]
  mobileHeaderActionSections: HeaderActionSection[]
} {
  const { t } = useTranslation()
  const { shareAction } = useShareAction({
    name: poolName,
    utmSource: 'share-pool',
    isMobileScreen,
  })

  const hasReportData = Boolean(poolAddress && chainId && token0 && token1 && protocolVersion)

  const BlockExplorerIcon = chainId ? getBlockExplorerIcon(chainId) : null

  const poolExplorerUrl =
    chainId && poolAddress && protocolVersion !== GraphQLApi.ProtocolVersion.V4
      ? getExplorerUrl({ chainId, address: poolAddress, type: ExplorerDataType.ADDRESS })
      : undefined
  const token0Address = token0?.address
  const token0IsNative = token0Address === NATIVE_CHAIN_ID || !token0Address
  const token0ExplorerUrl =
    chainId && token0Address
      ? getExplorerUrl({
          chainId,
          address: token0Address,
          type: token0IsNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
        })
      : undefined
  const token1Address = token1?.address
  const token1IsNative = token1Address === NATIVE_CHAIN_ID || !token1Address
  const token1ExplorerUrl =
    chainId && token1Address
      ? getExplorerUrl({
          chainId,
          address: token1Address,
          type: token1IsNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
        })
      : undefined

  const explorerDropdownItems = useMemo(() => {
    if (!chainId || !BlockExplorerIcon) {
      return []
    }
    const linkIcon = <ExternalLink size="$icon.16" color="$neutral2" strokeWidth={0} />
    const items: Array<{
      title: string
      subtitle?: string
      icon: JSX.Element
      trailingIcon?: JSX.Element
      onPress: () => void
      show: boolean
    }> = []
    if (poolExplorerUrl && poolAddress) {
      items.push({
        title: t('common.pool'),
        subtitle: shortenAddress({ address: poolAddress }),
        icon: <BlockExplorerIcon size="$icon.18" color="$neutral1" />,
        trailingIcon: linkIcon,
        onPress: () => window.open(poolExplorerUrl, '_blank'),
        show: true,
      })
    }
    if (token0ExplorerUrl && token0?.symbol && token0Address) {
      items.push({
        title: token0.symbol,
        subtitle: shortenAddress({ address: token0Address }),
        icon: <BlockExplorerIcon size="$icon.18" color="$neutral1" />,
        trailingIcon: linkIcon,
        onPress: () => window.open(token0ExplorerUrl, '_blank'),
        show: true,
      })
    }
    if (token1ExplorerUrl && token1?.symbol && token1Address) {
      items.push({
        title: token1.symbol,
        subtitle: shortenAddress({ address: token1Address }),
        icon: <BlockExplorerIcon size="$icon.18" color="$neutral1" />,
        trailingIcon: linkIcon,
        onPress: () => window.open(token1ExplorerUrl, '_blank'),
        show: true,
      })
    }
    return items
  }, [
    chainId,
    BlockExplorerIcon,
    poolExplorerUrl,
    poolAddress,
    token0ExplorerUrl,
    token1ExplorerUrl,
    token0?.symbol,
    token1?.symbol,
    token0Address,
    token1Address,
    t,
  ])

  const sections: HeaderActionSection[] = useMemo(() => {
    const result: HeaderActionSection[] = []

    if (explorerDropdownItems.length > 0 && BlockExplorerIcon) {
      result.push({
        title: t('pool.explorers'),
        actions: [
          {
            title: t('pool.explorers'),
            icon: <BlockExplorerIcon size="$icon.18" color="$neutral2" />,
            show: true,
            dropdownItems: explorerDropdownItems,
          },
        ],
      })
    }

    result.push({
      title: t('common.share'),
      actions: [shareAction],
    })

    if (hasReportData) {
      result.push({
        title: t('common.report'),
        actions: [
          {
            title: t('common.more'),
            icon: <Ellipsis size="$icon.18" color="$neutral2" />,
            show: true,
            dropdownItems: [
              {
                title: t('reporting.token.data.title'),
                icon: <ChartBarCrossed size="$icon.18" color="$neutral1" />,
                onPress: openReportDataIssueModal,
                show: true,
              },
            ],
          },
        ],
      })
    }

    return result
  }, [explorerDropdownItems, BlockExplorerIcon, shareAction, t, hasReportData, openReportDataIssueModal])

  return useMemo(() => deriveFromSections(sections), [sections])
}
