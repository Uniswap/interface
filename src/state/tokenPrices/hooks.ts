import { stringify } from 'querystring'
import { useEffect, useMemo, useState } from 'react'

import { AGGREGATOR_API, PRICE_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

const getAddress = (address: string, isEVM: boolean) => (isEVM ? address.toLowerCase() : address)

const useTokenPricesLocal = (
  addresses: Array<string>,
): {
  data: { [address: string]: number }
  loading: boolean
} => {
  const tokenPrices = useAppSelector(state => state.tokenPrices)
  const dispatch = useAppDispatch()
  const { chainId, isEVM } = useActiveWeb3React()
  const [loading, setLoading] = useState(true)

  const addressKeys = addresses
    .sort()
    .map(x => getAddress(x, isEVM))
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
        const payload = {
          ids: unknownPriceList.join(','),
        }
        const promise = isEVM
          ? fetch(`${PRICE_API}/${NETWORKS_INFO[chainId].priceRoute}/api/v1/prices`, {
              method: 'POST',
              body: JSON.stringify(payload),
            })
          : fetch(`${AGGREGATOR_API}/solana/prices?${stringify(payload)}`)

        const res = await promise.then(res => res.json())
        const prices = res?.data?.prices || res

        if (prices?.length) {
          const formattedPrices = unknownPriceList.map(address => {
            const price = prices.find(
              (p: { address: string; marketPrice: number; price: number }) => getAddress(p.address, isEVM) === address,
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
  }, [unknownPriceList, chainId, dispatch, isEVM])

  const data: {
    [address: string]: number
  } = useMemo(() => {
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

export const useTokenPrices = (
  addresses: Array<string>,
): {
  [address: string]: number
} => {
  const { data } = useTokenPricesLocal(addresses)
  return data
}

export const useTokenPricesWithLoading = (addresses: Array<string>) => {
  return useTokenPricesLocal(addresses)
}
