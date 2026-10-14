import { Flex, iconSizes, Text } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { memo } from 'react'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { AuctionOptionItemStats } from 'uniswap/src/components/lists/items/auctions/AuctionOptionItemStats'
import { FocusedRowControl, OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import { AuctionOption } from 'uniswap/src/components/lists/items/types'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import type { AuctionSearchStats } from 'uniswap/src/features/dataApi/types'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { shortenAddress } from 'utilities/src/addresses'

interface AuctionOptionItemProps {
  option: AuctionOption
  onPress: () => void
  focusedRowControl?: FocusedRowControl
  rightElement?: JSX.Element
  searchStats?: AuctionSearchStats
}

function AuctionOptionItemInner({
  option,
  onPress,
  focusedRowControl,
  rightElement,
  searchStats,
}: AuctionOptionItemProps): JSX.Element {
  const displayName = option.tokenName ?? option.tokenSymbol

  const severity = getTokenWarningSeverity(option.currencyInfo)
  const { colorSecondary: warningIconColor } = getWarningIconColors(severity)

  const badge = option.isVerified ? (
    <CheckmarkCircle size="$icon.16" color="$accent1" />
  ) : warningIconColor ? (
    <Flex>
      <WarningIcon severity={severity} size="$icon.16" strokeColorOverride={warningIconColor} />
    </Flex>
  ) : undefined

  return (
    <OptionItem
      image={
        <TokenLogo
          url={option.tokenLogoUrl}
          size={iconSizes.icon40}
          chainId={option.chainId}
          symbol={option.tokenSymbol}
          name={option.tokenName}
        />
      }
      title={displayName}
      subtitle={
        <Flex row alignItems="center" gap="$spacing8">
          <Text color="$neutral2" numberOfLines={1} variant="body3">
            {getSymbolDisplayText(option.tokenSymbol)}
          </Text>
          <Flex shrink>
            <Text color="$neutral3" numberOfLines={1} variant="body3">
              {shortenAddress({ address: option.tokenAddress })}
            </Text>
          </Flex>
        </Flex>
      }
      badge={badge}
      focusedRowControl={focusedRowControl}
      rightElement={rightElement ?? (searchStats ? <AuctionOptionItemStats {...searchStats} /> : undefined)}
      onPress={onPress}
    />
  )
}

export const AuctionOptionItem = memo(AuctionOptionItemInner)
