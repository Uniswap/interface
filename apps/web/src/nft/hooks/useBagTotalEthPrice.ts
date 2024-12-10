import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { useCurrency } from 'hooks/Tokens'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useBag } from 'nft/hooks/useBag'
import { BagItemStatus } from 'nft/types'
import { useMemo } from 'react'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'

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

export function useBagTotalUsdPrice(): string | undefined {
  const totalEthPrice = useBagTotalEthPrice()
  const defaultCurrency = useCurrency('ETH')

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(formatEther(totalEthPrice.toString()), defaultCurrency ?? undefined)
  }, [defaultCurrency, totalEthPrice])

  const usdcValue = useUSDCValue(parsedOutputAmount)

  return useMemo(() => {
    return usdcValue?.toExact()
  }, [usdcValue])
}
