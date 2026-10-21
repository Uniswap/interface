import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { CoinConvert } from '@universe/mycelium/icons/CoinConvert'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionTradingTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTradingTokenInfo'
import { useNavigateToAuctionTokenDetails } from '~/features/Toucan/Auction/hooks/useNavigateToAuctionTokenDetails'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { shouldShowTradeTokenBanner } from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'

/** "Buy or sell {symbol} ›" row under the bid form, linking to the TDP once the token has a pool. */
export function TradeTokenBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { auctionDetails, tokenColor } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
  }))
  const displayState = useAuctionDisplayState()
  const isVisible = shouldShowTradeTokenBanner(displayState)
  const { prefetchTokenDetails, navigateToTokenDetails, analyticsProperties } = useNavigateToAuctionTokenDetails({
    enabled: isVisible,
    entryPoint: 'adp_trade_token_banner',
  })
  const tradingToken = useAuctionTradingTokenInfo({ enabled: isVisible })

  if (!auctionDetails || !isVisible || !tradingToken.address || tradingToken.loading) {
    return null
  }

  const symbol = tradingToken.symbol ?? t('common.token')
  const accentColor = tokenColor ?? colors.accent1.val
  const backgroundColor = opacifyRaw(8, accentColor)

  return (
    <Trace logPress element={ElementName.AuctionTradeTokenBanner}>
      <TouchableArea
        onPress={navigateToTokenDetails}
        onMouseEnter={prefetchTokenDetails}
        onFocus={prefetchTokenDetails}
      >
        {analyticsProperties && (
          <Trace
            key={auctionDetails.address}
            logImpression
            eventOnTrigger={AuctionEventName.AuctionBannerViewed}
            properties={analyticsProperties}
          />
        )}
        <Flex
          testID={TestID.ToucanTradeTokenBanner}
          row
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={backgroundColor}
          borderWidth="$spacing1"
          borderColor={backgroundColor}
          borderRadius="$rounded12"
          px="$spacing12"
          py="$spacing8"
        >
          <Flex row alignItems="center" gap="$spacing8">
            <CoinConvert size="$icon.20" color={accentColor} />
            <Text variant="body4" color="$neutral1">
              {t('toucan.auction.tradeTokenBanner.buyOrSell', { symbol })}
            </Text>
          </Flex>
          <RotatableChevron direction="right" size="$icon.20" color="$neutral2" />
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
