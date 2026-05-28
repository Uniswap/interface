import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { EM_DASH, Flex, Text } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'

const SYMBOL_SLOT_HEIGHT = 18

interface TokenDisplayProps {
  currencyInfo: CurrencyInfo | null
  chainIds?: UniverseChainId[]
  isExpanded?: boolean
  displayName?: string
  displaySymbol?: string
}

export const TokenDisplay = memo(function TokenDisplay({
  currencyInfo,
  chainIds,
  isExpanded,
  displayName: multichainDisplayName,
  displaySymbol: multichainDisplaySymbol,
}: TokenDisplayProps) {
  const { t } = useTranslation()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  if (!currencyInfo) {
    return <EmptyTableCell />
  }

  const { currency } = currencyInfo
  const displayName = multichainDisplayName ?? currency.name
  const displaySymbol = multichainDisplaySymbol ?? currency.symbol
  const symbolText = getSymbolDisplayText(displaySymbol) || EM_DASH
  const showNetworksHover = multichainTokenUxEnabled && chainIds && chainIds.length > 1

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start" width="100%">
      <TokenLogo
        chainId={currency.chainId}
        name={displayName}
        symbol={getSymbolDisplayText(displaySymbol) || undefined}
        size={32}
        url={currencyInfo.logoUrl}
        alwaysShowNetworkLogo={multichainTokenUxEnabled && chainIds?.length === 1}
        networkCount={chainIds?.length}
      />
      <Flex width="100%">
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {displayName || EM_DASH}
        </Text>
        <GroupHoverTransition
          height={SYMBOL_SLOT_HEIGHT}
          showTransition={showNetworksHover}
          defaultContent={
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
          }
          hoverContent={
            <Flex row gap="$gap4">
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
      </Flex>
    </Flex>
  )
})
TokenDisplay.displayName = 'TokenDisplay'
