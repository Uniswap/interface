import { Flex } from 'ui/src'
import { ApproveTransactionDetails } from 'uniswap/src/components/activity/details/transactions/ApproveTransactionDetails'
import { AuctionTransactionDetails } from 'uniswap/src/components/activity/details/transactions/AuctionTransactionDetails'
import { BridgeTransactionDetails } from 'uniswap/src/components/activity/details/transactions/BridgeTransactionDetails'
import { LiquidityTransactionDetails } from 'uniswap/src/components/activity/details/transactions/LiquidityTransactionDetails'
import { NftTransactionDetails } from 'uniswap/src/components/activity/details/transactions/NftTransactionDetails'
import { OffRampTransactionDetails } from 'uniswap/src/components/activity/details/transactions/OffRampTransactionDetails'
import { OnRampTransactionDetails } from 'uniswap/src/components/activity/details/transactions/OnRampTransactionDetails'
import { PlanTransactionDetails } from 'uniswap/src/components/activity/details/transactions/PlanTransactionDetails'
import { SwapTransactionDetails } from 'uniswap/src/components/activity/details/transactions/SwapTransactionDetails'
import { TransferTransactionDetails } from 'uniswap/src/components/activity/details/transactions/TransferTransactionDetails'
import { WrapTransactionDetails } from 'uniswap/src/components/activity/details/transactions/WrapTransactionDetails'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export function TransactionDetailsContent({
  transactionDetails,
  onClose,
}: {
  transactionDetails: TransactionDetails
  onClose: () => void
}): JSX.Element | null {
  const { typeInfo } = transactionDetails

  // eslint-disable-next-line complexity
  const getContentComponent = (): JSX.Element | null => {
    switch (typeInfo.type) {
      case TransactionType.Approve:
      case TransactionType.Permit2Approve:
        return (
          <ApproveTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.NFTApprove:
      case TransactionType.NFTMint:
      case TransactionType.NFTTrade:
        return <NftTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.Receive:
      case TransactionType.Send:
        return (
          <TransferTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.Bridge:
        return <BridgeTransactionDetails typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.Swap:
        return <SwapTransactionDetails typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.WCConfirm:
        return <></>
      case TransactionType.Wrap:
        return <WrapTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.OnRampPurchase:
      case TransactionType.OnRampTransfer:
        return (
          <OnRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.OffRampSale:
        return (
          <OffRampTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      case TransactionType.LiquidityDecrease:
      case TransactionType.LiquidityIncrease:
      case TransactionType.CollectFees:
      case TransactionType.CreatePair:
      case TransactionType.CreatePool:
      case TransactionType.MigrateLiquidityV3ToV4:
        return <LiquidityTransactionDetails typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.Plan:
        return <PlanTransactionDetails status={transactionDetails.status} typeInfo={typeInfo} onClose={onClose} />
      case TransactionType.AuctionBid:
      case TransactionType.AuctionClaimed:
      case TransactionType.AuctionExited:
        return (
          <AuctionTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
        )
      default:
        return null
    }
  }

  const contentComponent = getContentComponent()
  if (contentComponent === null) {
    return null
  }
  return <Flex>{contentComponent}</Flex>
}
