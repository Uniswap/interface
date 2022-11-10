import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddressString } from 'utils'

import { updatePrices } from '.'

export const useTokenPrices = (addresses: Array<string>) => {
  const tokenPrices = useAppSelector(state => state.tokenPrices)
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

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
      const chainString = chainId ? NETWORKS_INFO[chainId].internalRoute : ''
      const res = await fetch(`${process.env.REACT_APP_PRICE_API}/${chainString}/api/v1/prices`, {
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
            chainId: chainId || ChainId.MAINNET,
            price: price?.marketPrice || price?.price || 0,
          }
        })

        dispatch(updatePrices(formattedPrices))
      }
    }

    if (unknownPriceList.length) fetchPrices()
  }, [unknownPriceList, chainId, dispatch])

  return useMemo(() => {
    return tokenList.reduce((acc, address) => {
      const key = `${address}_${chainId}`
      return {
        ...acc,
        [address]: tokenPrices[key] || 0,
        [isAddressString(address)]: tokenPrices[key] || 0,
      }
    }, {} as { [address: string]: number })
  }, [tokenList, chainId, tokenPrices])
}
