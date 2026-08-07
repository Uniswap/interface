import { memo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { RECENT_PILLS_MAX_COUNT } from 'uniswap/src/components/TokenSelectorV2/constants'
import { OnSelectTokenOption } from 'uniswap/src/components/TokenSelectorV2/hooks/usePendingWarningSelection'
import { HorizontalFadeScroll } from 'uniswap/src/components/TokenSelectorV2/HorizontalFadeScroll'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'

/**
 * Recent searches as a horizontally scrolling pill row (Figma 750:13046).
 * Presses go through the list's warning gate (`onSelectToken`), matching vertical rows.
 */
export const RecentSearchPillRow = memo(function RecentSearchPillRow({
  tokens,
  section,
  showTokenWarnings,
  onSelectToken,
}: {
  tokens: TokenOption[]
  section: OnchainItemSection<TokenOption[]>
  showTokenWarnings: boolean
  onSelectToken: OnSelectTokenOption
}): JSX.Element | null {
  const visibleTokens = tokens.slice(0, RECENT_PILLS_MAX_COUNT)

  if (visibleTokens.length === 0) {
    return null
  }

  return (
    <HorizontalFadeScroll>
      <Flex row gap="$spacing8" px="$spacing12" py="$none">
        {visibleTokens.map((token, index) => {
          const { currencyInfo } = token
          const { currency } = currencyInfo
          // Blocked pills stay pressable (dimmed) so the press opens the blocked explanation modal.
          const isBlocked = showTokenWarnings && getTokenWarningSeverity(currencyInfo) === WarningSeverity.Blocked
          return (
            <TouchableArea
              key={currencyInfo.currencyId}
              accessibilityLabel={currency.name ?? currency.symbol}
              accessibilityRole="button"
              opacity={isBlocked ? 0.5 : 1}
              onPress={(): void => onSelectToken(token, section, index)}
            >
              <Flex
                row
                alignItems="center"
                backgroundColor="$surface2"
                borderRadius="$rounded32"
                gap="$spacing6"
                pl="$spacing6"
                pr="$spacing12"
                py="$spacing6"
              >
                <TokenLogo
                  chainId={currency.chainId}
                  name={currency.name}
                  size={iconSizes.icon24}
                  symbol={currency.symbol}
                  url={currencyInfo.logoUrl}
                />
                <Text color="$neutral1" variant="buttonLabel3">
                  {currency.symbol}
                </Text>
              </Flex>
            </TouchableArea>
          )
        })}
      </Flex>
    </HorizontalFadeScroll>
  )
})
