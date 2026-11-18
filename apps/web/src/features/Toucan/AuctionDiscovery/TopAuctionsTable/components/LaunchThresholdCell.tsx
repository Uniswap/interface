import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import type { TopAuctionsTableValue } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import { getAuctionCancelThresholdDisplay, getAuctionThresholdMet } from '~/features/Toucan/utils/auctionFdvWarning'

export function LaunchThresholdCell({
  value,
  loading,
  convertFiatAmountFormatted,
  formatPercent,
}: {
  value?: TopAuctionsTableValue
  loading: boolean
  convertFiatAmountFormatted: LocalizationContextState['convertFiatAmountFormatted']
  formatPercent: LocalizationContextState['formatPercent']
}) {
  const { t } = useTranslation()
  const auction = value?.auction.auction
  const thresholdDisplay = getAuctionCancelThresholdDisplay(auction, convertFiatAmountFormatted)
  const thresholdMet = getAuctionThresholdMet(auction)

  return (
    <Cell justifyContent="flex-end" loading={loading}>
      <Flex alignItems="flex-end" gap="$spacing2">
        <TableText>{thresholdDisplay ?? '-'}</TableText>
        {thresholdMet !== undefined && (
          <Text variant="body4" color="$neutral2">
            {thresholdMet === 'notMet'
              ? t('toucan.auction.thresholdNotMet')
              : t('toucan.auction.percentMet', { percent: formatPercent(thresholdMet) })}
          </Text>
        )}
      </Flex>
    </Cell>
  )
}
