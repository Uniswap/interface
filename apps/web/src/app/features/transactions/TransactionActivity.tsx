import { Text } from 'ui/src'
import { Box, Flex } from 'ui/src/components/layout'
import { Loader } from 'ui/src/components/loading'
import { useFormattedTransactionDataForActivity } from 'wallet/src/features/activity/hooks'
import {
  isLoadingItem,
  isSectionHeader,
  LoadingItem,
  SectionHeader,
} from 'wallet/src/features/activity/utils'
import { TransactionDetails } from 'wallet/src/features/transactions/types'

export function TransactionActivity({ address }: { address: Address }): JSX.Element {
  // TODO merge with local history in followup work
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onRetry, hasData, isLoading, isError, sectionData, keyExtractor } =
    useFormattedTransactionDataForActivity(
      address,
      false,
      (_: string, transactions: TransactionDetails[]) => transactions
    )

  // hardcoding example loading for now until we implement each item
  const sectionDataTest = [
    {
      itemType: 'LOADING',
      id: 1,
    },
    {
      itemType: 'LOADING',
      id: 2,
    },
    {
      itemType: 'LOADING',
      id: 3,
    },
    {
      itemType: 'LOADING',
      id: 4,
    },
  ] as const

  return (
    <Flex grow paddingHorizontal="$spacing24" paddingVertical="$spacing12">
      {sectionDataTest.map((item) => renderActivityItem({ item }))}
    </Flex>
  )
}

const SectionTitle = ({ title }: { title: string }): JSX.Element => (
  <Box pb="$spacing12">
    <Text color="$textSecondary" variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

const renderActivityItem = ({
  item,
}: {
  item: TransactionDetails | SectionHeader | LoadingItem
}): JSX.Element => {
  // if it's a loading item, render the loading placeholder
  if (isLoadingItem(item)) {
    return <Loader.Transaction />
  }
  // if it's a section header, render it differently
  if (isSectionHeader(item)) {
    return <SectionTitle title={item.title} />
  }

  return <></>

  // TODO implement each:

  // item is a transaction
  // let SummaryItem
  // switch (item.typeInfo.type) {
  //   case TransactionType.Approve:
  //     SummaryItem = ApproveSummaryItem
  //     break
  //   case TransactionType.NFTApprove:
  //     SummaryItem = NFTApproveSummaryItem
  //     break
  //   case TransactionType.Swap:
  //     SummaryItem = SwapSummaryItem
  //     break
  //   case TransactionType.NFTTrade:
  //     SummaryItem = NFTTradeSummaryItem
  //     break
  //   case TransactionType.Send:
  //     SummaryItem = SendSummaryItem
  //     break
  //   case TransactionType.Receive:
  //     SummaryItem = ReceiveSummaryItem
  //     break
  //   case TransactionType.NFTMint:
  //     SummaryItem = NFTMintSummaryItem
  //     break
  //   case TransactionType.Wrap:
  //     SummaryItem = WrapSummaryItem
  //     break
  //   case TransactionType.WCConfirm:
  //     SummaryItem = WCSummaryItem
  //     break
  //   case TransactionType.FiatPurchase:
  //     SummaryItem = FiatPurchaseSummaryItem
  //     break
  //   default:
  //     SummaryItem = UnknownSummaryItem
  // }

  // return createElement(
  //   SummaryItem as React.FunctionComponent<{ transaction: TransactionDetails }>,
  //   {
  //     transaction: item,
  //   }
  // )
}
