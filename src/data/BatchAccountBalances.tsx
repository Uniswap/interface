import React, { useMemo } from 'react'
import { Token, TokenAmount, Pair } from '@uniswap/sdk'
import { useWeb3React } from '@web3-react/core'

import { useTokenOrETHBalance } from './Balances'
import { useAllTokens } from '../contexts/Tokens'
import { useAllDummyPairs } from '../contexts/LocalStorage'

const SWR_BATCH_CONFIG = { refreshInterval: 60 * 2.5 * 1000 }

function DummyTokenOrETHBalanceFetcher({ token, owner }: { token?: Token; owner?: string }) {
  useTokenOrETHBalance(token, owner, SWR_BATCH_CONFIG) // refresh this data less frequently
  return null
}

// responsible for updating the user's balances for all tokens and all pairs, mounted once globally
export function FetchBatchAccountBalances() {
  const allTokens = useAllTokens()
  const allPairs = useAllDummyPairs()
  const { account } = useWeb3React()
  return (
    <>
      {Object.values(allTokens).map((token, i) => (
        <DummyTokenOrETHBalanceFetcher key={i} token={token} owner={account} />
      ))}
      {allPairs.map((pair, i) => (
        <DummyTokenOrETHBalanceFetcher key={i} token={pair.liquidityToken} owner={account} />
      ))}
    </>
  )
}

type AccountBalances = { [account: string]: { [tokenAddress: string]: TokenAmount } }

// render prop component that makes account balances available.
// crucially, this component keys its child with a sorted + concatenated list of all tokens + all pairs to prevent hooks issues
function AccountBalancesParent({ children }: { children: (accountBalances: AccountBalances) => JSX.Element }) {
  const allTokens = useAllTokens()
  const allPairs = useAllDummyPairs()
  const { account } = useWeb3React()
  return (
    <AccountBalancesChild
      key={Object.keys(allTokens)
        .concat(allPairs.map(pair => pair.liquidityToken.address))
        .sort()
        .join('')}
      tokens={Object.values(allTokens)}
      pairs={allPairs}
      account={account}
    >
      {children}
    </AccountBalancesChild>
  )
}

// uses hooks in an ill-advised way, only safe as the child of its parent above
function AccountBalancesChild({
  tokens,
  pairs,
  account,
  children
}: {
  tokens: Token[]
  pairs: Pair[]
  account: string
  children: (accountBalances: AccountBalances) => JSX.Element
}) {
  // the following is only okay because of the key in AccountBalanceForAllTokens
  const tokenBalances = tokens.map(token => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTokenOrETHBalance(token, account, SWR_BATCH_CONFIG) // this should just be a cache hit
  })
  const pairBalances = pairs.map(pair => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTokenOrETHBalance(pair.liquidityToken, account, SWR_BATCH_CONFIG) // this should just be a cache hit
  })

  // take token and pair objects and put them into the AccountBalances data structure
  const accountBalances: AccountBalances = useMemo(
    () =>
      !account
        ? {}
        : tokenBalances.concat(pairBalances).reduce((accumulator, balance) => {
            return {
              ...accumulator,
              [account]: {
                ...accumulator?.[account],
                ...(balance ? { [balance.token.address]: balance } : {})
              }
            }
          }, {}),
    [account, tokenBalances, pairBalances]
  )

  return children(accountBalances)
}

// HOC
export interface AccountBalancesProps {
  accountBalances: AccountBalances
}
export function withAccountBalances(ComponentToWrap: (props: any) => JSX.Element): (props: any) => JSX.Element {
  return function WrappedComponent(props: any): JSX.Element {
    return (
      <AccountBalancesParent>
        {accountBalances => <ComponentToWrap accountBalances={accountBalances} {...props} />}
      </AccountBalancesParent>
    )
  }
}
