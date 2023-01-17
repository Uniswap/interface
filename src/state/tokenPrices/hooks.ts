import { useEffect, useMemo, useState } from 'react'

import { PRICE_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

const useTokenPricesLocal = (addresses: Array<string>) => {
  const tokenPrices = useAppSelector(state => state.tokenPrices)
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const [loading, setLoading] = useState(true)

  const addressKeys = addresses
    .sort()
    .map(x => x.toLowerCase())
    .join(',')

  const tokenList = useMemo(() => {
    return addressKeys.split(',').filter(Boolean)
  }, [addressKeys])

  const unknownPriceList = useMemo(() => {
    return tokenList.filter(item => tokenPrices[`${item}_${chainId}`] === undefined)
  }, [tokenList, chainId, tokenPrices])

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${PRICE_API}/${NETWORKS_INFO[chainId].priceRoute}/api/v1/prices`, {
          method: 'POST',
          body: JSON.stringify({
            ids: unknownPriceList.join(','),
          }),
        }).then(res => res.json())

        if (res?.data?.prices?.length) {
          const formattedPrices = unknownPriceList.map(address => {
            const price = res.data.prices.find(
              (p: { address: string; marketPrice: number; price: number }) => p.address.toLowerCase() === address,
            )

            return {
              address,
              chainId: chainId,

              price: price?.marketPrice || price?.price || 0,
            }
          })

          dispatch(updatePrices(formattedPrices))
        }
      } finally {
        setLoading(false)
      }
    }

    if (unknownPriceList.length) fetchPrices()
    else {
      setLoading(false)
    }
  }, [unknownPriceList, chainId, dispatch])

  const data = useMemo(() => {
    return tokenList.reduce((acc, address) => {
      const key = `${address}_${chainId}`
      return {
        ...acc,
        [address]: tokenPrices[key] || 0,
        [isAddressString(chainId, address)]: tokenPrices[key] || 0,
      }
    }, {} as { [address: string]: number })
  }, [tokenList, chainId, tokenPrices])

  return { data, loading }
}

export const useTokenPrices = (addresses: Array<string>) => {
  const { data } = useTokenPricesLocal(addresses)
  return data
}

export const useTokenPricesWithLoading = (addresses: Array<string>) => {
  return useTokenPricesLocal(addresses)
}
