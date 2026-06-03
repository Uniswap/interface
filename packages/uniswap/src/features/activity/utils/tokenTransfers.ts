import { Direction, OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { AssetCase } from 'uniswap/src/features/activity/utils/remote'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'

export function isZeroAddress(address: string | undefined): boolean {
  return Boolean(address && areEvmAddressesEqual(address, ZERO_ADDRESS))
}

export function hasTwoTokenTransfersWithMintOrBurn(transaction: OnChainTransaction): boolean {
  const tokenTransfers = transaction.transfers.filter((transfer) => transfer.asset.case === AssetCase.Token)

  if (tokenTransfers.length !== 2) {
    return false
  }

  return tokenTransfers.some(
    (transfer) =>
      (transfer.direction === Direction.RECEIVE && isZeroAddress(transfer.from)) ||
      (transfer.direction === Direction.SEND && isZeroAddress(transfer.to)),
  )
}

export function getTokenAddressFromMintOrBurn({
  transaction,
  direction,
}: {
  transaction: OnChainTransaction
  direction: Direction.RECEIVE | Direction.SEND
}): string | undefined {
  const matchingTransfer = transaction.transfers.find((transfer) => {
    if (transfer.direction !== direction || transfer.asset.case !== AssetCase.Token) {
      return false
    }

    return direction === Direction.RECEIVE ? isZeroAddress(transfer.from) : isZeroAddress(transfer.to)
  })

  return matchingTransfer?.asset.value?.address
}
