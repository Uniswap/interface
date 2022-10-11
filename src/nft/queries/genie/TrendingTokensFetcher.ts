import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'

import { FungibleToken } from '../../types'

function replaceWrappedWithNative(token: FungibleToken) {
  const address = token.address.toLowerCase()
  const nativeAddress = WRAPPED_NATIVE_CURRENCY[token.chainId]?.address.toLowerCase()
  if (address !== nativeAddress) return token

  const nativeToken = nativeOnChain(token.chainId)
  return { ...token, ...nativeToken, address: 'NATIVE' }
}

export const fetchTrendingTokens = async (numTokens?: number): Promise<FungibleToken[]> => {
  // TODO: WETH->ETH
  const url = `${process.env.REACT_APP_TEMP_API_URL}/tokens/trending${numTokens ? `?numTokens=${numTokens}` : ''}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const { data } = (await r.json()) as { data: FungibleToken[] }
  return data.map(replaceWrappedWithNative)
}
