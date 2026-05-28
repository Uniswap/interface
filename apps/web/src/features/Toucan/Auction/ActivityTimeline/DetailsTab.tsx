import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { SupplyScheduleChart } from '~/features/Toucan/Auction/ActivityTimeline/SupplyScheduleChart'
import { formatImpliedTokenPrice } from '~/features/Toucan/Auction/AuctionStats/AuctionStats'
import { useAuctionKycStatus } from '~/features/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useStatsBannerData } from '~/features/Toucan/Auction/hooks/useStatsBannerData'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'

const EMPTY_DISPLAY = '--'

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <Flex row justifyContent="space-between" alignItems="center">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Flex row alignItems="center" gap="$spacing4">
        {typeof value === 'string' ? (
          <Text variant="body3" color="$neutral1">
            {value}
          </Text>
        ) : (
          value
        )}
      </Flex>
    </Flex>
  )
}

export function DetailsTab() {
  const { t } = useTranslation()

  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const { auctionSupply, auctionTokenSymbol, launchedOnTimestamp, impliedTokenPrice, percentCommittedToLpFormatted } =
    useAuctionStatsData()
  const { currentValuationFiatFormatted } = useStatsBannerData()

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const { auctionNeedsVerification, auctionHasPresale } = useAuctionKycStatus({
    auctionAddress: auctionDetails?.address,
    chainId: auctionDetails?.chainId,
  })

  // Duration: time from first token release (preBidEndBlock) to auction end
  const emissionStartBlock = auctionDetails?.preBidEndBlock ? Number(auctionDetails.preBidEndBlock) : undefined
  const auctionEndBlock = auctionDetails?.endBlock ? Number(auctionDetails.endBlock) : undefined

  const emissionStartTimestamp = useBlockTimestamp({
    chainId: auctionDetails?.chainId,
    blockNumber: emissionStartBlock,
  })
  const endTimestamp = useBlockTimestamp({
    chainId: auctionDetails?.chainId,
    blockNumber: auctionEndBlock,
  })

  const durationLabel = useMemo(() => {
    if (!emissionStartTimestamp || !endTimestamp) {
      return EMPTY_DISPLAY
    }
    const durationMs = Number(endTimestamp - emissionStartTimestamp) * 1000
    if (durationMs <= 0) {
      return EMPTY_DISPLAY
    }
    return getDurationRemainingString(durationMs, 0)
  }, [emissionStartTimestamp, endTimestamp])
  const startDateLabel = launchedOnTimestamp ? formatTimestampToDate(launchedOnTimestamp) : EMPTY_DISPLAY
  const supplyLabel = auctionSupply ? `${auctionSupply} ${auctionTokenSymbol ?? ''}`.trim() : EMPTY_DISPLAY
  const lpLabel = percentCommittedToLpFormatted ?? EMPTY_DISPLAY
  const raiseCurrencyLabel = bidTokenInfo?.symbol ?? EMPTY_DISPLAY
  const kycLabel = auctionNeedsVerification ? t('toucan.details.yes') : t('toucan.details.no')
  const whitelistLabel = auctionHasPresale ? t('toucan.details.yes') : t('toucan.details.no')

  const formattedPrice = formatImpliedTokenPrice({ impliedTokenPrice, variant: 'body3' })
  const fdvSuffix =
    currentValuationFiatFormatted && currentValuationFiatFormatted !== EMPTY_DISPLAY
      ? ` (${currentValuationFiatFormatted} ${t('stats.fdv')})`
      : ''

  const clearingPriceValue = (
    <Flex row alignItems="center" gap="$spacing4" flexWrap="wrap" justifyContent="flex-end">
      {typeof formattedPrice === 'string' ? (
        <Text variant="body3" color="$neutral1">
          {formattedPrice}
          <Text variant="body3" color="$neutral2">
            {fdvSuffix}
          </Text>
        </Text>
      ) : (
        <>
          {formattedPrice}
          {fdvSuffix && (
            <Text variant="body3" color="$neutral2">
              {fdvSuffix}
            </Text>
          )}
        </>
      )}
    </Flex>
  )

  return (
    <>
      {/* Supply Schedule Chart */}
      <Flex px="$spacing24">
        <Text variant="body3" mb="$spacing8">
          {t('toucan.details.supplySchedule')}
        </Text>
        <SupplyScheduleChart />
      </Flex>

      {/* Auction Section */}
      <Flex px="$spacing24" pb="$spacing24">
        <Flex py="$spacing12" borderBottomWidth={1} borderColor="$surface3">
          <Text variant="body3" color="$neutral1">
            {t('toucan.details.auction')}
          </Text>
        </Flex>

        <Flex gap="$spacing12" pt="$spacing12">
          <DetailRow label={t('toucan.details.auctionSupply')} value={supplyLabel} />
          <DetailRow label={t('toucan.details.postAuctionLiquidity')} value={lpLabel} />
          <DetailRow label={t('toucan.details.clearingPrice')} value={clearingPriceValue} />
          <DetailRow
            label={t('toucan.details.raiseCurrency')}
            value={
              <Flex row alignItems="center" gap="$spacing4">
                <TokenLogo
                  url={bidTokenInfo?.logoUrl}
                  symbol={bidTokenInfo?.symbol}
                  chainId={auctionDetails?.chainId}
                  size={16}
                  hideNetworkLogo
                />
                <Text variant="body3" color="$neutral1">
                  {raiseCurrencyLabel}
                </Text>
              </Flex>
            }
          />
          <DetailRow label={t('toucan.details.startDate')} value={startDateLabel} />
          <DetailRow label={t('toucan.details.duration')} value={durationLabel} />
          <DetailRow label={t('toucan.details.kyc')} value={kycLabel} />
          <DetailRow label={t('toucan.details.whitelist')} value={whitelistLabel} />
        </Flex>
      </Flex>
    </>
  )
}
