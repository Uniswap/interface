import { UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { ChevronsIn } from '@universe/mycelium/icons/ChevronsIn'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { memo, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { EM_DASH } from 'ui/src'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { ViewDetailsTrailingArrow } from 'uniswap/src/components/portfolio/TokenBalanceItem/ViewDetailsTrailingArrow'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import { TableRowHoverContext } from '~/components/Table/TableRowHoverContext'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'

const SYMBOL_SLOT_HEIGHT = 18
const LOGO_GAP_PX = 8

interface TokenDisplayProps {
  currencyInfo: CurrencyInfo | null
  chainIds?: UniverseChainId[]
  isExpanded?: boolean
  displayName?: string
  displaySymbol?: string
  onNameClick?: () => void
  /** Explore-style unified expandable row: always show symbol + chevron instead of hover-to-expand affordance. */
  unifiedExpandableRows?: boolean
}

export const TokenDisplay = memo(function TokenDisplay({
  currencyInfo,
  chainIds,
  isExpanded,
  displayName: multichainDisplayName,
  displaySymbol: multichainDisplaySymbol,
  onNameClick,
  unifiedExpandableRows = false,
}: TokenDisplayProps) {
  const { t } = useTranslation()
  const rowHovered = useContext(TableRowHoverContext)
  if (!currencyInfo) {
    return <EmptyTableCell />
  }

  const { currency } = currencyInfo
  const displayName = multichainDisplayName ?? currency.name
  const displaySymbol = multichainDisplaySymbol ?? currency.symbol
  const symbolText = getSymbolDisplayText(displaySymbol) || EM_DASH
  const showNetworksHover = chainIds && chainIds.length > 1
  const showUnifiedExpandableSubline = unifiedExpandableRows && chainIds && chainIds.length > 1

  const unifiedExpandableSubline = (
    <Flex row alignItems="center" gap="$gap4" height={SYMBOL_SLOT_HEIGHT}>
      <Text
        variant="body4"
        $platform-web={{ minWidth: 'fit-content' }}
        color="$neutral2"
        height={SYMBOL_SLOT_HEIGHT}
        numberOfLines={1}
      >
        {symbolText}
      </Text>
      {isExpanded ? (
        <ChevronsIn color="$neutral2" size="$icon.16" />
      ) : (
        <ChevronsOut color="$neutral2" size="$icon.16" />
      )}
    </Flex>
  )

  return (
    <CollapsibleCellLayout
      gapPx={LOGO_GAP_PX}
      logo={
        <TokenLogo
          chainId={currency.chainId}
          name={displayName}
          symbol={getSymbolDisplayText(displaySymbol) || undefined}
          size={32}
          url={currencyInfo.logoUrl}
          alwaysShowNetworkLogo={chainIds?.length === 1}
          networkCount={chainIds?.length}
        />
      }
    >
      {onNameClick ? (
        <TouchableArea
          hoverStyle={{ opacity: 0.7 }}
          onPressIn={(e) => e.stopPropagation()}
          onPressOut={(e) => e.stopPropagation()}
          onPress={(e) => {
            e.stopPropagation()
            onNameClick()
          }}
        >
          <Text variant="body3" color="$neutral1" numberOfLines={1}>
            {displayName || EM_DASH}
          </Text>
        </TouchableArea>
      ) : (
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {displayName || EM_DASH}
        </Text>
      )}
      <GroupHoverTransition
        height={SYMBOL_SLOT_HEIGHT}
        showTransition={showNetworksHover}
        isHovered={rowHovered}
        defaultContent={
          showUnifiedExpandableSubline ? (
            unifiedExpandableSubline
          ) : (
            <Text
              variant="body4"
              $platform-web={{ minWidth: 'fit-content' }}
              color="$neutral2"
              height={SYMBOL_SLOT_HEIGHT}
              width="100%"
              numberOfLines={1}
            >
              {symbolText}
            </Text>
          )
        }
        hoverContent={
          <Flex row alignItems="center" gap="$gap4" height={SYMBOL_SLOT_HEIGHT}>
            <Text variant="body4" color="$neutral2">
              {t('portfolio.tokens.table.balances')}
            </Text>
            {!isExpanded && <NetworkIconList chainIds={chainIds ?? []} />}
            {isExpanded ? (
              <ChevronsIn color="$neutral2" size="$icon.16" />
            ) : (
              <ChevronsOut color="$neutral2" size="$icon.16" />
            )}
          </Flex>
        }
      />
    </CollapsibleCellLayout>
  )
})
TokenDisplay.displayName = 'TokenDisplay'

export function ChainTokenDisplay({
  chainId,
  showDetailsArrow,
}: {
  chainId: UniverseChainId
  showDetailsArrow: boolean
}): JSX.Element {
  return (
    <CollapsibleCellLayout
      gapPx={LOGO_GAP_PX}
      logo={
        <Flex width={iconSizes.icon32} alignItems="center">
          <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
        </Flex>
      }
    >
      <Flex row alignItems="center" gap={14}>
        <Text variant="body3">{getChainLabel(chainId)}</Text>
        {showDetailsArrow && <ViewDetailsTrailingArrow />}
      </Flex>
    </CollapsibleCellLayout>
  )
}
