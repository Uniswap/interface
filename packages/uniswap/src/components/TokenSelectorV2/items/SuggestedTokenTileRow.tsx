import { memo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { OnSelectTokenOption } from 'uniswap/src/components/TokenSelectorV2/hooks/usePendingWarningSelection'
import { TokenSelectorV2SectionHeader } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

/**
 * Suggested tokens as a row of equal-width square tiles (Figma 750:13084); same renderer on all platforms.
 * Data-source agnostic: renders whatever TokenOptions the section carries (SWAP-3045).
 * Presses go through the list's warning gate (`onSelectToken`), matching vertical rows.
 */
export const SuggestedTokenTileRow = memo(function SuggestedTokenTileRow({
  tokens,
  maxCount,
  section,
  showTokenWarnings,
  onSelectToken,
}: {
  tokens: TokenOption[]
  maxCount: number
  section: OnchainItemSection<TokenOption[]>
  showTokenWarnings: boolean
  onSelectToken: OnSelectTokenOption
}): JSX.Element | null {
  const visibleTokens = tokens.slice(0, maxCount)

  if (visibleTokens.length === 0) {
    return null
  }

  return (
    <Flex>
      {/* The list primitives suppress SuggestedTokens section headers, so the row owns its header. */}
      <TokenSelectorV2SectionHeader sectionKey={section.sectionKey} />
      <Flex row gap="$spacing4" px="$spacing12" py="$none">
        {visibleTokens.map((token, index) => {
          const { currencyInfo } = token
          const { currency } = currencyInfo
          // Blocked tiles stay pressable (dimmed) so the press opens the blocked explanation modal.
          const isBlocked = showTokenWarnings && getTokenWarningSeverity(currencyInfo) === WarningSeverity.Blocked
          return (
            <TouchableArea
              key={currencyInfo.currencyId}
              accessibilityLabel={currency.name ?? currency.symbol}
              accessibilityRole="button"
              flex={1}
              opacity={isBlocked ? 0.5 : 1}
              testID={`${TestID.TokenSelectorV2SuggestedTilePrefix}${currency.symbol}`}
              onPress={(): void => onSelectToken(token, section, index)}
            >
              <Flex
                alignItems="center"
                backgroundColor="$surface2"
                borderRadius="$rounded16"
                gap="$spacing4"
                pb="$spacing8"
                pt="$spacing12"
                px="$spacing12"
              >
                <TokenLogo
                  chainId={currency.chainId}
                  name={currency.name}
                  size={iconSizes.icon28}
                  symbol={currency.symbol}
                  url={currencyInfo.logoUrl}
                />
                <Text color="$neutral1" numberOfLines={1} variant="buttonLabel3">
                  {currency.symbol}
                </Text>
              </Flex>
            </TouchableArea>
          )
        })}
      </Flex>
    </Flex>
  )
})
