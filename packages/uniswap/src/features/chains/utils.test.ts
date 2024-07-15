import { ChainId } from '@uniswap/sdk-core'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

describe(toGraphQLChain, () => {
  it('handles supported chain', () => {
    expect(toGraphQLChain(ChainId.MAINNET)).toEqual(Chain.Ethereum)
  })

  it('handle unsupported chain', () => {
    expect(toGraphQLChain(7)).toEqual(undefined)
  })
})
