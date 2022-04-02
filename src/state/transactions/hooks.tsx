import { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import Badge, { BadgeVariant } from 'components/Badge'
import { DarkCard } from 'components/Card'
import { Wrapper } from 'components/swap/styleds'
import moment from 'moment'
import { isHoneyPot } from 'pages/App'
import { useKiba } from 'pages/Vote/VotePage'
import React from 'react'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ExternalLinkIcon } from 'theme'

import { useActiveWeb3React } from '../../hooks/web3'
import { addTransaction } from './actions'
import { TransactionDetails } from './reducer'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: { summary?: string; approval?: { tokenAddress: string; spender: string }; claim?: { recipient: string } }
) => void {
  const { chainId, account } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  return useCallback(
    (
      response: TransactionResponse,
      {
        summary,
        approval,
        claim,
      }: { summary?: string; claim?: { recipient: string }; approval?: { tokenAddress: string; spender: string } } = {}
    ) => {
      if (!account) return
      if (!chainId) return

      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from: account, chainId, approval, summary, claim }))
    },
    [dispatch, chainId, account]
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const { chainId } = useActiveWeb3React()

  const state = useAppSelector((state) => state.transactions)

  return chainId ? state[chainId] ?? {} : {}
}

export function useTransaction(transactionHash?: string): TransactionDetails | undefined {
  const allTransactions = useAllTransactions()

  if (!transactionHash) {
    return undefined
  }

  return allTransactions[transactionHash]
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return !transactions[transactionHash].receipt
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return Boolean(transactions[transactionHash].receipt)
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(tokenAddress: string | undefined, spender: string | undefined): boolean {
  const allTransactions = useAllTransactions()
  return useMemo(
    () =>
      typeof tokenAddress === 'string' &&
      typeof spender === 'string' &&
      Object.keys(allTransactions).some((hash) => {
        const tx = allTransactions[hash]
        if (!tx) return false
        if (tx.receipt) {
          return false
        } else {
          const approval = tx.approval
          if (!approval) return false
          return approval.spender === spender && approval.tokenAddress === tokenAddress && isTransactionRecent(tx)
        }
      }),
    [allTransactions, spender, tokenAddress]
  )
}

// watch for submissions to claim
// return null if not done loading, return undefined if not found
export function useUserHasSubmittedClaim(account?: string): {
  claimSubmitted: boolean
  claimTxn: TransactionDetails | undefined
} {
  const allTransactions = useAllTransactions()

  // get the txn if it has been submitted
  const claimTxn = useMemo(() => {
    const txnIndex = Object.keys(allTransactions).find((hash) => {
      const tx = allTransactions[hash]
      return tx.claim && tx.claim.recipient === account
    })
    return txnIndex && allTransactions[txnIndex] ? allTransactions[txnIndex] : undefined
  }, [account, allTransactions])

  return { claimSubmitted: Boolean(claimTxn), claimTxn }
}


export const LimitOrders = ( ) => {
const { chainId } = useWeb3React();
const isBinance = React.useMemo(() => chainId && chainId === 56, [chainId]);
const src = React.useMemo(() => 
isBinance ? 'https://cashewnutz.github.io/flape/index.html' : 'https://cashewnutz.github.io/flap/index.html', [isBinance])
return  <iframe style={{width:'100%', height:500, border:'1px solid transparent', borderRadius:30}} src={src} />
}

interface NewToken {
  network: string;
  symbol:string;
  name:string;
  addr:string;
  timestamp: string;
  safe?:boolean;
}

const StyledDiv = styled.div`
  font-family:"Bangers",cursive;
  font-size:18px;
`

const Table = styled.table `
th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background: radial-gradient(#222, rgba(129, 3, 3, 0.95));
  color: white;
}
border-collapse: collapse;
border: 1px solid 
width:100%;
tr:nth-child(even){background: radial-gradient(rgba(0,0,0,.5), rgba(129, 3, 3, 0.95));}
td, th {
  border: 1px solid #ddd;
  padding: 8px;
}`
export const FomoPage = () => {
  const { chainId, account } = useWeb3React();
  const [data, setData] = React.useState<NewToken[]>()
  const networkDefaultValue = React.useMemo(() => 
    chainId === 1 ? 'eth' : chainId === 56 ? 'bsc' : 'eth'
  , [chainId]);
  const [network, setNetwork] = React.useState<'bsc' | 'eth' | 'poly' | 'ftm' | 'kcc' | 'avax'>(networkDefaultValue)
  const authHeader = {
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic3BhY2VtYW5fbGl2ZXMiLCJpYXQiOjE2Mzc1NDg1NTUsImV4cCI6MTY3NDcwMDU1NX0.b_O-i7Srfv1tEYOMGiea9DQ7S9x9tq7Azq1LSwylHUY`
    }
  }

  const getData = React.useMemo(() => {
    return () => fetch(`https://tokenfomo.io/api/tokens/${network}`, {method: "GET", headers: authHeader.headers })
    .then((response) => response.json())
    .then((response) => {
      const data = response.filter((a: NewToken) => moment(new Date()).diff(moment(new Date(+a.timestamp * 1000)), 'hours') <= 1 );
      setData(data)
    })
  }, [network])

  
  React.useEffect (() => {
    Promise.resolve(getData());
    setInterval(() => getData(), 30000)
  }, [network])
  const kibaBalance = useKiba(account)
  const accessDenied = React.useMemo(() =>!account || !kibaBalance || +kibaBalance?.toFixed(0) <= 0, [kibaBalance, account])

  return <DarkCard style={{maxWidth: 1000 , background:'radial-gradient(rgb(239 146 56),rgba(129,3,3,.95))'}}>
    <Wrapper style={{padding:'9px 14px'}}>
          
          <div style={{marginBottom:10}}><h1>KibaFomo</h1></div>
          <div style={{display:'flex', justifyContent:'start', alignItems:'center'}}>
            <Badge style={{marginRight:5, cursor: 'pointer'}} onClick={() => setNetwork('eth')} variant={network === 'eth' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>ETH</Badge>
            <Badge style={{marginRight:5, cursor: 'pointer'}}  onClick={() => setNetwork('bsc')} variant={network === 'bsc' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>BSC</Badge>
            <Badge style={{marginRight:5, cursor: 'pointer'}}  onClick={() => setNetwork('avax')} variant={network === 'avax' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>AVAX</Badge>
          </div>

          {accessDenied === false && <Table style={{maxWidth:580, background:'#222', color:"#FFF", width:"100%"}}>
              <tr style={{textAlign:'left'}}>
              <th style={{textAlign:'left'}}>Name</th>
              <th style={{textAlign:'left'}}>Symbol</th>
              <th style={{textAlign:'left'}}>Contract</th>
              <th style={{textAlign:'left'}}>Safe </th>
              <th style={{textAlign:'left'}}>Timestamp</th>
              </tr>
            <tbody>
              {!data?.length && <tr>
                <td colSpan={4}>Loading data...</td>
              </tr>}
              {!!data?.length && data.map((item) => (
                <tr key={item.addr}>
                  <td>{item.name}</td>
                  <td>{item.symbol}</td>
                  <td>{item.addr} <ExternalLinkIcon style={{display:'inline'}} href={`${chainId === 1 ? `https://etherscan.io/address/${item.addr}` : `https://bscscan.com/address/${item.addr}`}`} /></td>
                  <td>{item.safe}</td>
                  <td>{moment(new Date(+item.timestamp * 1000)).fromNow()}</td>
                  </tr>
              ))}
            </tbody>
          </Table>}

          {accessDenied && <p style={{height:400, width:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
              You must hold Kiba Inu tokens to use this feature.
            </p>}
            </Wrapper>
  </DarkCard>
}