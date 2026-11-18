import { Flex } from '@universe/mycelium'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { Cell } from '~/components/Table/Cell'
import type { TopAuctionsTableValue } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import { getAuctionCommittedVolumeDisplay } from '~/features/Toucan/utils/auctionFdvWarning'

export function CommittedVolumeCell({
  value,
  loading,
  convertFiatAmountFormatted,
}: {
  value?: TopAuctionsTableValue
  loading: boolean
  convertFiatAmountFormatted: LocalizationContextState['convertFiatAmountFormatted']
}) {
  const auction = value?.auction.auction
  const committedVolumeUsd = auction?.totalBidVolumeUsd !== undefined ? Number(auction.totalBidVolumeUsd) : undefined
  const committedVolumeDisplay = getAuctionCommittedVolumeDisplay(auction, convertFiatAmountFormatted)

  return (
    <Cell justifyContent="flex-end" loading={loading}>
      <Flex flexDirection="column" alignItems="flex-end" gap="$spacing4">
        <AnimatedNumber numericValue={committedVolumeUsd} textVariant="$body2" value={committedVolumeDisplay ?? '-'} />
      </Flex>
    </Cell>
  )
}
