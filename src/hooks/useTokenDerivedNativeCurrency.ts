import { gql, useQuery } from '@apollo/client'
import BigNumber from 'bignumber.js'
import { ChainId, CurrencyAmount, Token } from 'dxswap-sdk'
import { ethers } from 'ethers'
import { useMemo } from 'react'
import { useActiveWeb3React } from '.'

export function useTokenDerivedNativeCurrency(
  token?: Token
): { loading: boolean; derivedNativeCurrency: CurrencyAmount } {
  const { chainId } = useActiveWeb3React()

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
