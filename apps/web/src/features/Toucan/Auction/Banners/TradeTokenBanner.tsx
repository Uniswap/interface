import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { CoinConvert } from '@universe/mycelium/icons/CoinConvert'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { getTokenDetailsURL } from '~/data/util'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { shouldShowTradeTokenBanner } from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import { usePrefetchTokenDetailsAuction } from '~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction'
import { getChainUrlParam } from '~/utils/params/chainParams'

/** "Buy or sell {symbol} ›" row under the bid form, linking to the TDP once the token has a pool. */
export function TradeTokenBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prefetchAuction = usePrefetchTokenDetailsAuction()
  const colors = useSporeColors()
  const { auctionDetails, tokenColor } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
  }))
  const displayState = useAuctionDisplayState()
  const prefetchTokenDetails = useCallback(() => {
    if (auctionDetails) {
      prefetchAuction({ chainId: auctionDetails.chainId, tokenAddress: auctionDetails.tokenAddress })
    }
  }, [auctionDetails, prefetchAuction])

  const onPress = useCallback(() => {
    if (!auctionDetails) {
      return
    }
    prefetchTokenDetails()
    navigate(
      getTokenDetailsURL({
        address: auctionDetails.tokenAddress,
        chainUrlParam: getChainUrlParam(auctionDetails.chainId),
      }),
    )
  }, [auctionDetails, navigate, prefetchTokenDetails])

  if (!auctionDetails || !shouldShowTradeTokenBanner(displayState)) {
    return null
  }

  const symbol = auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol
  const accentColor = tokenColor ?? colors.accent1.val
  const backgroundColor = opacifyRaw(8, accentColor)

  return (
    <Trace logPress element={ElementName.AuctionTradeTokenBanner}>
      <TouchableArea onPress={onPress} onMouseEnter={prefetchTokenDetails} onFocus={prefetchTokenDetails}>
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
