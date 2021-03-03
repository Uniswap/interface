import { gql, useQuery } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ChainId, CurrencyAmount, Token } from 'dxswap-sdk'
import { ethers } from 'ethers'
import { useMemo } from 'react'

export function useTokenDerivedNativeCurrency(
  token?: Token
): { loading: boolean; derivedNativeCurrency: CurrencyAmount } {
  const { chainId } = useWeb3React()

  interface QueryResult {
    token: { derivedNativeCurrency: string }
  }

  const { loading, data, error } = useQuery<QueryResult>(
    gql`
      query getTokenDerivedNativeCurrency($tokenId: ID!) {
        token(id: $tokenId) {
          derivedNativeCurrency
        }
      }
    `,
    { variables: { tokenId: token?.address.toLowerCase() } }
  )

  return useMemo(() => {
    if (loading || !chainId)
      return { loading: true, derivedNativeCurrency: CurrencyAmount.nativeCurrency('0', chainId || ChainId.MAINNET) }
    if (!data || error) return { loading: false, derivedNativeCurrency: CurrencyAmount.nativeCurrency('0', chainId) }
    return {
      loading: false,
      derivedNativeCurrency: CurrencyAmount.nativeCurrency(
        ethers.utils
          .parseEther(
            new BigNumber(data.token.derivedNativeCurrency).decimalPlaces(18).toString() // force 18 decimals top
          )
          .toString(),
        chainId
      )
    }
  }, [chainId, data, error, loading])
}
