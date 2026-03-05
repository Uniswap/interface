import { Flex } from 'ui/src'
import { BidMarker } from '~/components/Toucan/Auction/BidDistributionChart/markers/BidMarker'
import { MarkerPosition } from '~/components/Toucan/Auction/BidDistributionChart/markers/types'
import { BidTokenInfo } from '~/components/Toucan/Auction/store/types'

interface BidMarkerOverlayProps {
  markerPositions: MarkerPosition[]
  bidTokenInfo: BidTokenInfo
  formatPrice: (value: string, decimals: number) => string
  formatTokenAmount: (value: string, decimals: number) => string
}

/**
 * Overlay component that renders all bid markers on top of the chart.
 * Uses absolute positioning to place markers at calculated screen coordinates.
 */
export function BidMarkerOverlay({
  markerPositions,
  bidTokenInfo,
  formatPrice,
  formatTokenAmount,
}: BidMarkerOverlayProps) {
  return (
    <Flex position="absolute" inset={0} pointerEvents="none" zIndex={2}>
      {markerPositions.map((marker) => (
        <BidMarker
          key={marker.id}
          marker={marker}
          bidTokenInfo={bidTokenInfo}
          formatPrice={formatPrice}
          formatTokenAmount={formatTokenAmount}
        />
      ))}
    </Flex>
  )
}
