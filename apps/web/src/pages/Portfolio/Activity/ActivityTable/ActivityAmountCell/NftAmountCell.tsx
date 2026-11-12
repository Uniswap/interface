import { Flex } from '@universe/mycelium'
import { NFTViewer } from 'uniswap/src/components/nfts/NFTViewer'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CompactLayout } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/CompactLayout'
import { useActivityTokenAmount } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/useActivityTokenAmount'
import { useActivityTypeLabel } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/useActivityTypeLabel'
import {
  AMOUNT_COLUMN_WIDTH,
  COMPACT_THUMBNAIL_SIZE,
} from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'
import { ActivityAmountModel, ActivityCellVariant } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { NftAmountDisplay } from '~/pages/Portfolio/Activity/ActivityTable/NftAmountDisplay'

type NftAmount = Extract<ActivityAmountModel, { kind: 'nft' }>

interface NftAmountCellProps {
  transaction: TransactionDetails
  amount: NftAmount
  variant: ActivityCellVariant
}

export function NftAmountCell({ transaction, amount, variant }: NftAmountCellProps): JSX.Element {
  return variant === 'compact' ? (
    <CompactNftAmountCell transaction={transaction} amount={amount} />
  ) : (
    <FullNftAmountCell amount={amount} />
  )
}

function CompactNftAmountCell({
  transaction,
  amount,
}: {
  transaction: TransactionDetails
  amount: NftAmount
}): JSX.Element {
  const typeLabel = useActivityTypeLabel({ transaction, variant: 'compact' })

  return (
    <CompactLayout
      typeLabel={typeLabel}
      logo={
        amount.nftImageUrl ? (
          <Flex
            width={COMPACT_THUMBNAIL_SIZE}
            height={COMPACT_THUMBNAIL_SIZE}
            borderRadius="$rounded8"
            backgroundColor="$surface3"
            overflow="hidden"
          >
            <NFTViewer
              uri={amount.nftImageUrl}
              placeholderContent={amount.nftName || amount.nftCollectionName}
              maxHeight={COMPACT_THUMBNAIL_SIZE}
              svgRenderingDisabled
            />
          </Flex>
        ) : null
      }
      amountText={amount.nftName || amount.nftCollectionName || null}
    />
  )
}

function FullNftAmountCell({ amount }: { amount: NftAmount }): JSX.Element {
  const nftPurchaseCurrencyInfo = useCurrencyInfo(amount.purchaseCurrencyId)
  const purchase = useActivityTokenAmount({
    currencyInfo: nftPurchaseCurrencyInfo,
    amountRaw: amount.purchaseAmountRaw,
  })

  return (
    <Flex row alignItems="center" gap="$gap8" justifyContent="flex-start" minWidth={AMOUNT_COLUMN_WIDTH}>
      <NftAmountDisplay
        nftImageUrl={amount.nftImageUrl}
        nftName={amount.nftName}
        nftCollectionName={amount.nftCollectionName}
        purchaseAmountText={purchase.currencyInfo ? purchase.formattedAmount : null}
      />
    </Flex>
  )
}
