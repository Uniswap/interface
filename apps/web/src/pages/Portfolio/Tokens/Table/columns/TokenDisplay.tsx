import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { EM_DASH, Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { GroupHoverTransition } from '~/components/GroupHoverTransition'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'

const SYMBOL_SLOT_HEIGHT = 18

interface TokenDisplayProps {
  currencyInfo: CurrencyInfo | null
  chainIds?: UniverseChainId[]
}

export const TokenDisplay = memo(function TokenDisplay({ currencyInfo, chainIds }: TokenDisplayProps) {
  const { t } = useTranslation()
  const isMultichainTokenUX = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  if (!currencyInfo) {
    return <EmptyTableCell />
  }

  const { currency } = currencyInfo
  const symbolText = getSymbolDisplayText(currency.symbol) || EM_DASH
  const showNetworksHover = isMultichainTokenUX && chainIds && chainIds.length > 1

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start" width="100%">
      <TokenLogo
        chainId={currency.chainId}
        name={currency.name}
        symbol={getSymbolDisplayText(currency.symbol) || undefined}
        size={32}
        url={currencyInfo.logoUrl}
      />
      <Flex width="100%">
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {currency.name || EM_DASH}
        </Text>
        {showNetworksHover ? (
          <GroupHoverTransition
            height={SYMBOL_SLOT_HEIGHT}
            transition="all 80ms ease-in-out"
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
              <Flex row height={SYMBOL_SLOT_HEIGHT} alignItems="center" gap="$gap8" width="100%">
                <Text variant="body4" color="$neutral2">
                  {t('portfolio.tokens.table.networks', { count: chainIds.length })}
                </Text>
                <NetworkIconList chainIds={chainIds} />
              </Flex>
            }
          />
        ) : (
          <Text variant="body4" color="$neutral2" numberOfLines={1}>
            {symbolText}
          </Text>
        )}
      </Flex>
    </Flex>
  )
})
TokenDisplay.displayName = 'TokenDisplay'
