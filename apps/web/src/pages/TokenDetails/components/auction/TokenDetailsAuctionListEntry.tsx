import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { Rocket } from '@universe/mycelium/icons/Rocket'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { opacifyRaw, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorsFromTokenColor } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { stopPropagationPressProps } from 'utilities/src/react/stopPropagation'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useSharedMachineTimeMs } from 'utilities/src/time/useSharedMachineTimeMs'
import { TokenDetailsAuctionErrorBoundary } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionErrorBoundary'
import { TokenDetailsAuctionListModal } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListModal'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { useTokenDetailsCcaAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions'
import { countOtherActiveAuctions } from '~/pages/TokenDetails/utils/tokenDetailsAuctionList'

function useOtherActiveAuctionCount({ auctions }: { auctions: PlainMessage<Auction>[] }): number {
  const primaryAuctionAddress = useTDPStore((s) =>
    s.auctionSource.status === TokenDetailsSourceState.Found ? s.auctionSource.auction.address : undefined,
  )
  const nowMs = useSharedMachineTimeMs(ONE_MINUTE_MS)
  return countOtherActiveAuctions({ auctions, primaryAuctionAddress, nowMs })
}

export function TokenDetailsOtherAuctionsFallback({
  hideSwap,
  showAuctionBanner,
}: {
  hideSwap: boolean
  showAuctionBanner: boolean
}): JSX.Element | null {
  const { auction } = useTokenDetailsAuctionDisplay()
  // CCA siblings remain reachable even when the primary used another launch method.
  if (!auction || hideSwap || showAuctionBanner) {
    return null
  }
  return (
    <TokenDetailsAuctionErrorBoundary>
      <TokenDetailsOtherAuctionsRow />
    </TokenDetailsAuctionErrorBoundary>
  )
}

/** "+N more" pill inside the live-auction banner. Swallows the press so the banner's own link does not fire. */
export function TokenDetailsMoreAuctionsChip(): JSX.Element | null {
  return <TokenDetailsAuctionListEntry variant="chip" />
}

/** Links to other active auctions, including when the primary auction has ended. */
export function TokenDetailsOtherAuctionsRow(): JSX.Element | null {
  return <TokenDetailsAuctionListEntry variant="row" />
}

function TokenDetailsAuctionListEntry({ variant }: { variant: 'chip' | 'row' }): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const tokenColor = useTDPStore((state) => state.tokenColor)
  const { validTokenColor } = useColorsFromTokenColor(tokenColor)
  const accentColor = validTokenColor ?? colors.accent1.val
  const auctions = useTokenDetailsCcaAuctions()
  const count = useOtherActiveAuctionCount({ auctions })
  const [isOpen, setIsOpen] = useState(false)
  const open = useEvent(() => setIsOpen(true))
  const close = useEvent(() => setIsOpen(false))

  // Keep an open list mounted when the last other active auction ends.
  if (count === 0 && !isOpen) {
    return null
  }

  const content = (
    <>
      {count > 0 && (
        <Trace logPress element={ElementName.TokenDetailsAuctionListEntry}>
          {variant === 'chip' ? (
            <TouchableArea
              row
              px="$spacing8"
              py="$spacing6"
              borderRadius="$roundedFull"
              backgroundColor={opacifyRaw(8, accentColor)}
              borderColor={opacifyRaw(8, accentColor)}
              borderWidth="$spacing1"
              onPress={open}
              testID={TestID.TokenDetailsMoreAuctionsChip}
            >
              <Text variant="buttonLabel4" color={accentColor}>
                {t('tdp.auctions.moreCount', { count })}
              </Text>
            </TouchableArea>
          ) : (
            <TouchableArea
              row
              alignItems="center"
              gap="$spacing8"
              px="$spacing12"
              py="$spacing8"
              borderRadius="$rounded12"
              backgroundColor={opacifyRaw(8, accentColor)}
              borderColor={opacifyRaw(8, accentColor)}
              borderWidth="$spacing1"
              onPress={open}
              testID={TestID.TokenDetailsOtherAuctionsRow}
            >
              <Rocket size="$icon.20" color={accentColor} />
              <Text variant="body4" color="$neutral1" flex={1}>
                {t('tdp.auctions.otherActive', { count })}
              </Text>
              <RotatableChevron direction="right" size="$icon.20" color="$neutral2" />
            </TouchableArea>
          )}
        </Trace>
      )}
      <TokenDetailsAuctionListModal auctions={auctions} isOpen={isOpen} onClose={close} />
    </>
  )

  return variant === 'chip' ? <Flex {...stopPropagationPressProps}>{content}</Flex> : content
}
