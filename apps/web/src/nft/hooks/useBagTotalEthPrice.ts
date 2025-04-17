import { BigNumber } from '@ethersproject/bignumber'
import { useBag } from 'nft/hooks/useBag'
import { BagItemStatus } from 'nft/types'
import { useMemo } from 'react'

export function useBagTotalEthPrice(): BigNumber {
  const itemsInBag = useBag((state) => state.itemsInBag)

  return useMemo(() => {
    const totalEthPrice = itemsInBag.reduce(
      (total, item) =>
        item.status !== BagItemStatus.UNAVAILABLE
          ? total.add(
              BigNumber.from(
                item.asset.updatedPriceInfo ? item.asset.updatedPriceInfo.ETHPrice : item.asset.priceInfo.ETHPrice,
              ),
            )
          : total,
      BigNumber.from(0),
    )

    return totalEthPrice
  }, [itemsInBag])
}
