import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useEvent } from 'utilities/src/react/hooks'
import { OrderDirection } from '~/appGraphql/data/util'
import { ClickableHeaderRow, EllipsisText, HeaderArrow, HeaderSortText } from '~/components/Table/styled'
import { getAuctionMetadata } from '~/components/Toucan/Config/config'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'

/**
 * Sort fields for auction table
 */
export enum AuctionSortField {
  FDV = 'FDV',
  COMMITTED_VOLUME = 'Committed Volume',
  TIME_REMAINING = 'Time Remaining',
}

export function AuctionTableHeader({
  category,
  isCurrentSortMethod,
  direction,
  onSort,
}: {
  category: AuctionSortField
  isCurrentSortMethod: boolean
  direction: OrderDirection
  onSort: () => void
}) {
  const { t } = useTranslation()
  const handleSortCategory = useEvent(onSort)

  const HEADER_TEXT = {
    [AuctionSortField.FDV]: t('stats.fdv'),
    [AuctionSortField.COMMITTED_VOLUME]: t('toucan.auction.committedVolume'),
    [AuctionSortField.TIME_REMAINING]: t('toucan.auction.timeRemaining'),
  }

  return (
    <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
      <Flex row gap="$gap4" alignItems="center">
        <Flex opacity={isCurrentSortMethod ? 1 : 0}>
          <HeaderArrow orderDirection={direction} size="$icon.16" />
        </Flex>
        <HeaderSortText active={isCurrentSortMethod} variant="body3">
          {HEADER_TEXT[category]}
        </HeaderSortText>
      </Flex>
    </ClickableHeaderRow>
  )
}

export function TokenNameCell({ auction }: { auction: AuctionWithCurrencyInfo }) {
  // Check for logo override from config
  const logoOverride =
    auction.auction?.chainId && auction.auction.tokenAddress
      ? getAuctionMetadata({ chainId: auction.auction.chainId, tokenAddress: auction.auction.tokenAddress })?.logoUrl
      : undefined

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <Flex pr="$spacing4">
        <TokenLogo
          url={logoOverride ?? auction.currencyInfo?.logoUrl}
          size={24}
          chainId={auction.auction?.chainId}
          symbol={auction.currencyInfo?.currency.symbol}
          name={auction.currencyInfo?.currency.name}
        />
      </Flex>
      <EllipsisText>
        {auction.currencyInfo?.currency.name ?? auction.auction?.tokenSymbol ?? auction.auction?.tokenAddress ?? '—'}
      </EllipsisText>
      <EllipsisText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {auction.currencyInfo?.currency.symbol ?? auction.auction?.tokenSymbol}
      </EllipsisText>
      {auction.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
    </Flex>
  )
}
