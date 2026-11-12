import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { BlockExplorer } from '@universe/mycelium/icons/BlockExplorer'
import { ChartBarCrossed } from '@universe/mycelium/icons/ChartBarCrossed'
import { Ellipsis } from '@universe/mycelium/icons/Ellipsis'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { type ParsedToken, isNativeParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { deriveFromSections } from '~/components/StickyCollapsibleHeader/HeaderActions/deriveHeaderActions'
import type { HeaderAction, HeaderActionSection } from '~/components/StickyCollapsibleHeader/HeaderActions/types'
import { useShareAction } from '~/components/StickyCollapsibleHeader/HeaderActions/useShareAction'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

type UsePoolDetailsHeaderActionsParams = {
  chainId?: UniverseChainId
  poolAddress?: string
  poolName: string
  baseToken?: ParsedToken
  quoteToken?: ParsedToken
  protocolVersion?: ProtocolVersion
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
  baseToken,
  quoteToken,
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

  const hasReportData = Boolean(poolAddress && chainId && baseToken && quoteToken && protocolVersion)

  const BlockExplorerIcon = chainId ? getBlockExplorerIcon(chainId) : null

  const poolExplorerUrl =
    chainId && poolAddress && protocolVersion !== ProtocolVersion.V4
      ? getExplorerUrl({ chainId, address: poolAddress, type: ExplorerDataType.ADDRESS })
      : undefined
  // Absent address = native on the parsed shape; the NATIVE_CHAIN_ID sentinel keeps the explorer
  // row (linking to the chain's native asset page) instead of dropping the native leg entirely.
  const baseTokenAddress = baseToken?.address
  const baseTokenIsNative = baseToken ? isNativeParsedToken(baseToken) : false
  const baseTokenExplorerUrl =
    chainId && baseToken
      ? getExplorerUrl({
          chainId,
          address: baseTokenAddress ?? NATIVE_CHAIN_ID,
          type: baseTokenIsNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
        })
      : undefined
  const quoteTokenAddress = quoteToken?.address
  const quoteTokenIsNative = quoteToken ? isNativeParsedToken(quoteToken) : false
  const quoteTokenExplorerUrl =
    chainId && quoteToken
      ? getExplorerUrl({
          chainId,
          address: quoteTokenAddress ?? NATIVE_CHAIN_ID,
          type: quoteTokenIsNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
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
    if (baseTokenExplorerUrl && baseToken?.symbol) {
      items.push({
        title: baseToken.symbol,
        subtitle: !baseTokenIsNative && baseTokenAddress ? shortenAddress({ address: baseTokenAddress }) : undefined,
        icon: <BlockExplorerIcon size="$icon.18" color="$neutral1" />,
        trailingIcon: linkIcon,
        onPress: () => window.open(baseTokenExplorerUrl, '_blank'),
        show: true,
      })
    }
    if (quoteTokenExplorerUrl && quoteToken?.symbol) {
      items.push({
        title: quoteToken.symbol,
        subtitle: !quoteTokenIsNative && quoteTokenAddress ? shortenAddress({ address: quoteTokenAddress }) : undefined,
        icon: <BlockExplorerIcon size="$icon.18" color="$neutral1" />,
        trailingIcon: linkIcon,
        onPress: () => window.open(quoteTokenExplorerUrl, '_blank'),
        show: true,
      })
    }
    return items
  }, [
    chainId,
    BlockExplorerIcon,
    poolExplorerUrl,
    poolAddress,
    baseTokenExplorerUrl,
    quoteTokenExplorerUrl,
    baseToken?.symbol,
    quoteToken?.symbol,
    baseTokenAddress,
    quoteTokenAddress,
    baseTokenIsNative,
    quoteTokenIsNative,
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
            icon: <BlockExplorer size="$icon.18" color="$neutral2" />,
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
