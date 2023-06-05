import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { useCurrency } from 'hooks/Tokens'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { BagItemStatus } from 'nft/types'
import { useMemo } from 'react'

import { useBag } from './useBag'

export function useBagTotalEthPrice(): BigNumber {
  const itemsInBag = useBag((state) => state.itemsInBag)

  return useMemo(() => {
    const totalEthPrice = itemsInBag.reduce(
      (total, item) =>
        item.status !== BagItemStatus.UNAVAILABLE
          ? total.add(
              BigNumber.from(
                item.asset.updatedPriceInfo ? item.asset.updatedPriceInfo.ETHPrice : item.asset.priceInfo.ETHPrice
              )
            )
          : total,
      BigNumber.from(0)
    )

    return totalEthPrice
  }, [itemsInBag])
}

export function useBagTotalUsdPrice(): string | undefined {
  const totalEthPrice = useBagTotalEthPrice()
  const defaultCurrency = useCurrency('ETH')

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(formatEther(totalEthPrice.toString()), defaultCurrency ?? undefined)
  }, [defaultCurrency, totalEthPrice])

  const usdcValue = useStablecoinValue(parsedOutputAmount)

  return useMemo(() => {
    return usdcValue?.toExact()
  }, [usdcValue])
}
