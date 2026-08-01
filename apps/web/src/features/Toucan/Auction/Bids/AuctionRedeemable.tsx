import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from '~/chains'
import { GraduatedCardFrame } from '~/features/Toucan/Auction/Bids/GraduatedCardFrame'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { openExternalLink } from '~/utils/openExternalLink'

/**
 * Redeem state: the auctioned token is a virtual token now redeemable 1:1 for a real, tradeable
 * token. Shows the wallet's live redeemable balance (in the real token's symbol) and a link out
 * to the external redemption page. Replaces the "You received" success content while the wallet
 * holds the virtual token.
 */
export function AuctionRedeemable({
  auctionLogoUrl,
  auctionCurrency,
  chainId,
  realTokenSymbol,
  redeemableBalanceRaw,
  redeemUrl,
}: {
  auctionLogoUrl: Maybe<string>
  auctionCurrency: Currency
  chainId: number
  realTokenSymbol: string
  redeemableBalanceRaw: bigint
  redeemUrl: string
}) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const tokenColor = useAuctionStore((state) => state.tokenColor)

  // Redemption is a 1:1, same-decimals mirror (the override is curated as such), so the wallet's
  // virtual-token balance — formatted with the virtual token's own decimals — is exactly the
  // amount of the real token it can redeem. The real symbol is supplied by the caller.
  const redeemableAmount = useMemo(
    () => formatUnits(redeemableBalanceRaw, auctionCurrency.decimals),
    [redeemableBalanceRaw, auctionCurrency.decimals],
  )

  const onRedeemPress = useCallback(() => openExternalLink(redeemUrl), [redeemUrl])

  return (
    <GraduatedCardFrame
      auctionLogoUrl={auctionLogoUrl}
      auctionSymbol={auctionCurrency.symbol}
      chainId={chainId}
      tokenColor={tokenColor}
    >
      {/* Figma node 12017-14410: top group sits below the logo (label→amount 6px); the bottom
          group is anchored to the card bottom via space-between ("must"→"Redeem now" 3px). */}
      <Flex flex={1} width="100%" alignItems="center" justifyContent="space-between">
        <Flex alignItems="center">
          <Text variant="subheading1" color="$neutral2" textAlign="center" mt={34}>
            {t('toucan.auction.redeem.availableToRedeem')}
          </Text>
          <Flex row gap="$spacing8" alignItems="center" mt={6}>
            <Text color="$neutral1" variant="heading2">
              {formatNumberOrString({ value: redeemableAmount, type: NumberType.TokenNonTx })}
            </Text>
            <Text color="$neutral1" variant="heading2">
              {realTokenSymbol}
            </Text>
          </Flex>
        </Flex>
        <Flex alignItems="center">
          <Text variant="body2" color="$neutral2" textAlign="center">
            {t('toucan.auction.redeem.mustBeRedeemed', { symbol: auctionCurrency.symbol ?? t('common.token') })}
          </Text>
          <TouchableArea onPress={onRedeemPress} mt={3}>
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="buttonLabel2" color="$neutral1">
                {t('toucan.auction.redeem.redeemNow')}
              </Text>
              <ExternalLink size="$icon.16" color="$neutral1" />
            </Flex>
          </TouchableArea>
        </Flex>
      </Flex>
    </GraduatedCardFrame>
  )
}
