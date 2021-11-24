import { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import Badge, { BadgeVariant } from 'components/Badge'
import { DarkCard } from 'components/Card'
import { Wrapper } from 'components/swap/styleds'
import moment from 'moment'
import { isHoneyPot } from 'pages/App'
import { LoadingRows } from 'pages/Pool/styleds'
import { useKiba } from 'pages/Vote/VotePage'
import React from 'react'
import { useCallback, useMemo } from 'react'
import { AlertCircle, CheckCircle, DollarSign, HelpCircle, Info, Loader, RefreshCcw } from 'react-feather'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'
import ThemeProvider, { ExternalLink, ExternalLinkIcon, StyledInternalLink } from 'theme'
import { useActiveWeb3React } from '../../hooks/web3'
import { addTransaction } from './actions'
import './limit.css'
import { TransactionDetails } from './reducer'
import { orderBy } from 'lodash'
import useInterval from 'hooks/useInterval'
import Tooltip from 'components/Tooltip'
import { useContractOwner } from 'components/swap/ConfirmSwapModal'
import { isHoneyPotBsc } from 'pages/HoneyPotBsc'
import { GelatoLimitOrderPanel, GelatoLimitOrdersHistoryPanel, GelatoProvider } from '@gelatonetwork/limit-orders-react'
import * as axios from 'axios'
// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: { summary?: string; approval?: { tokenAddress: string; spender: string }; claim?: { recipient: string } }
) => void {
  const { chainId, account, library } = useActiveWeb3React()
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



export const LimitOrders = () => {
  const { chainId , account, library } = useWeb3React();
  const isBinance = React.useMemo(() => chainId && chainId === 56, [chainId]);
  const src = React.useMemo(() =>
    isBinance ? 'https://cashewnutz.github.io/flape/index.html' : 'https://cashewnutz.github.io/flap/index.html', [isBinance])
  return <>
        <GelatoLimitOrderPanel  />
        <GelatoLimitOrdersHistoryPanel  />
        </>
}

interface NewToken {
  network: string;
  symbol: string;
  name: string;
  addr: string;
  timestamp: string;
  safe?: boolean;
}

const StyledDiv = styled.div`
  font-family:"Bangers",cursive;
  font-size:18px;
`

const Table = styled.table`
&:before {
  background: linear-gradient(to right,red,orange)
}
td:last-child {
  font-size:12px;
}
th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  color: white;
  &:before {
    background: linear-gradient(to right,red,orange)
  }
}
border-collapse: collapse;
border: 1px solid 
width:100%;
tr:nth-child(even){background: radial-gradient(rgb(255 0 0 / 50%),rgb(136 24 5))}
td, th {
  border: 1px solid #ddd;
  padding: 8px;
}`

const ContractOwner = ({ address }: { address: string }) => {
  const owner = useContractOwner(address)

  return (
    <Badge>{owner}</Badge>
  )
}

export const FomoPage = () => {
  const { chainId, account, library } = useWeb3React();
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
  const [page, setPage] = React.useState(1);
  const AMT_PER_PAGE = 25;
  const [searchValue, setSearchValue] = React.useState('')
  const [flagSafe, setFlagSafe] = React.useState(false)

  const pagedData = React.useMemo(() => {
    if (!data) return [];
    let sorted = data?.filter(a => searchValue ? a?.addr?.toLowerCase().includes(searchValue.toLowerCase()) || a.name?.toLowerCase().includes(searchValue?.toLowerCase()) || a?.symbol.toLowerCase().includes(searchValue?.toLowerCase()) : true)
    if (flagSafe) sorted = sorted.filter(i => !!i.safe)
    const startIndex = page * AMT_PER_PAGE - AMT_PER_PAGE;
    const endIndex = startIndex + AMT_PER_PAGE;
    return sorted.slice(startIndex, endIndex);
  }, [page, data, searchValue, flagSafe])

  React.useEffect(() => {
    if (data?.length && pagedData.every(i => i.safe === undefined))
      flagAllCallback(pagedData)
  }, [pagedData, data])

  const getPaginationGroup = () => {
    if (!data?.length) return []
    const sorted = data?.filter(a => searchValue ? a?.addr?.toLowerCase().includes(searchValue.toLowerCase()) || a.name?.toLowerCase().includes(searchValue?.toLowerCase()) || a?.symbol.toLowerCase().includes(searchValue?.toLowerCase()) : true)
    const start = Math.floor((page - 1) / AMT_PER_PAGE) * AMT_PER_PAGE;
    const pages = sorted.length / AMT_PER_PAGE;
    const retVal = [];
    for (let i = 1; i <= pages; i++) {
      retVal.push(i);
    }
    return retVal.length === 0 ? [1] : retVal;
  };

  const [lastFetched, setLastFetched] = React.useState<Date | undefined>()
  const flagAllCallback = React.useCallback(async (items: any[]) => {
    if (!items?.length || !library?.provider) return;
    let safe: any[] = [];
    if (flagSafe) {
      safe = await Promise.all((data ?? [])?.filter(item => item.safe === undefined).map(async item => {
        const isHoneyPotFn = network === 'bsc' ? isHoneyPotBsc : network === 'eth' ? isHoneyPot : (add: string) => Promise.resolve(false);
        const isSafe = await isHoneyPotFn(item.addr, library?.provider)
        return {
          ...item,
          safe: !isSafe
        }
      })) as Array<NewToken>;
      setData(safe)
    } else {
      safe = await Promise.all(items?.map(async item => {
        const isHoneyPotFn = network === 'bsc' ? isHoneyPotBsc : network === 'eth' ? isHoneyPot : (add: string) => Promise.resolve(false);
        const isSafe = await isHoneyPotFn(item.addr, library?.provider)
        return {
          ...item,
          safe: !isSafe
        }
      })) as Array<NewToken>;
      setData(data =>
        data?.map((item => safe?.some(a => a.addr === item.addr) ? safe.find(i => i.addr === item.addr) : item))
      )
    }
  }, [network, library, flagSafe])

  const getData = React.useMemo(() => {
    const finallyClause = () => {
      setLastFetched(new Date())
    }
    return () => axios.default.get(`https://tokenfomo.io/api/tokens/${network}`, { method: "GET", headers: authHeader.headers })
      .then(async (response) => {
        const data = response.data.filter((a: NewToken) => moment(new Date()).diff(moment(new Date(+a.timestamp * 1000)), 'hours') <= 23);
        const sorted = orderBy(data, i => new Date(+i.timestamp * 1000), 'desc')
        const startIndex = page * AMT_PER_PAGE - AMT_PER_PAGE;
        const endIndex = startIndex + AMT_PER_PAGE;
        const pagedSet = sorted.slice(startIndex, endIndex);
        setData(current => [
          ... (current as NewToken[] && current?.length ? current : []), 
          ...data.filter((item:any) => !current?.some(i => item?.addr === i?.addr)) 
        ])
        await flagAllCallback(orderBy(pagedSet, i => new Date(+i.timestamp * 1000), 'desc'))
      }).finally(finallyClause)
  }, [network, page, library])

  const [loading, setLoading] = React.useState(false)
  useInterval(async () => {
    await getData()
  }, 15000, false)

  const fetchedText = React.useMemo(() => lastFetched ? moment(lastFetched).fromNow() : undefined, [lastFetched])
  React.useEffect(() => {
    setLoading(true);
    getData().finally(() => setLoading(false));
  }, [network])

  const [showInfo, setShowInfo] = React.useState(false)
  const kibaBalance = useKiba(account)
  const networkMap: Record<number, string> = {
    1: 'eth',
    56: 'bsc'
  }
  const [showHpInfo, setShowHpInfo] = React.useState(false)
  const accessDenied = React.useMemo(() => !account || !kibaBalance || +kibaBalance?.toFixed(0) <= 0, [kibaBalance, account])
  const helpTipText = `The honeypot checker will automatically run for the tokens listed to the current connected network. Currently connected to ${chainId && chainId === 1 ? 'Ethereum Mainnet' : chainId && chainId === 56 ? 'Binance Smart Chain' : ''}`;
  const infoTipText = `KibaFomo is auto-refreshing every 30 seconds to go and fetch the latest listed tokens. \r\n\r\nEvery token listed below has been ran through our smart-contract honey pot checks, to determine if it allows for buying and selling. \r\n\r\nThis is an experimental feature. Use at your own risk.`
  return <DarkCard style={{ maxWidth: 1000, background: 'radial-gradient(orange,rgba(129,3,3,.95))' }}>
    <Wrapper style={{ overflow: 'auto', padding: '9px 14px' }}>

      <div style={{ marginBottom: 10 }}>
        <h1>KibaFomo &nbsp;
          <Tooltip text={infoTipText} show={showInfo}>
            <Info onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)} />
          </Tooltip>
        </h1>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', marginBottom: 15, justifyContent: 'start', alignItems: 'center' }}>
          <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => setNetwork('eth')} variant={network === 'eth' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>ETH</Badge>
          <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => setNetwork('bsc')} variant={network === 'bsc' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>BSC</Badge>
          <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => setNetwork('avax')} variant={network === 'avax' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>AVAX</Badge>
          <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => setNetwork('ftm')} variant={network === 'ftm' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>FTM</Badge>
          <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => setNetwork('poly')} variant={network === 'poly' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>POLY</Badge>
          <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => setNetwork('kcc')} variant={network === 'kcc' ? BadgeVariant.POSITIVE : BadgeVariant.DEFAULT}>KCC</Badge>
        </div>
        <div>
          <label>Only Show Safe Listings</label>
        <input type="checkbox" checked={flagSafe} onChange={e => setFlagSafe(e.target.checked)} />
        </div>
      </div>
      <div style={{ width: '100%', marginBottom: 5, marginTop: 10 }}>
        <small>KibaFomo only displays tokens that were listed within the last 24 hours.</small>
        <input style={{
          width: '100%',
          padding: 13,
          margin: '5px 0px',
          border: '1px solid #eee',
          borderRadius: 12,
        }}
          placeholder={"Search for a specific newly listed token by symbol, name, or contract"}

          onChange={e => setSearchValue(e.target.value)}
          type={'search'}
        />
      </div>

      {fetchedText && <small>Last updated {fetchedText}</small>}
      {!!loading && <LoadingRows>
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </LoadingRows>}
      {!loading && accessDenied === false && <Table style={{ background: '#222', color: "#FFF", width: "100%" }}>
        <tr style={{ textAlign: 'left' }}>
          <th style={{ textAlign: 'left' }}>Name</th>
          <th style={{ textAlign: 'left' }}>Symbol</th>
          <th style={{ textAlign: 'left' }}>Contract Address</th>
          {['bsc', 'eth'].includes(network) && <th style={{ textAlign: 'left' }}>Buy</th>}
          {['bsc', 'eth'].includes(network) &&<th style={{ textAlign: 'left' }}>Link</th>}
          {chainId && network === networkMap[chainId] && <th style={{ textAlign: 'left', display:"flex" }}>HP Check&nbsp; 
          <Tooltip text={helpTipText} show={showHpInfo}><Info onMouseEnter={() => setShowHpInfo(true)} onMouseLeave={() => setShowHpInfo(false)} /></Tooltip></th>}
          <th style={{ textAlign: 'left' }}>Timestamp</th>
        </tr>
        <tbody>

          {!loading && !!pagedData?.length && pagedData.map((item) => (
                <tr key={item.addr}>
                  <td style={{fontSize:12}}>{item.name}</td>
                  <td>{item.symbol}</td>
                  <td><small>{item.addr}</small> </td>
                  {['bsc', 'eth'].includes(network) &&  <td>{network === 'eth' && <StyledInternalLink to={`/swap?outputCurrency=${item.addr}`}><DollarSign style={{color:'white'}} /></StyledInternalLink>}
                  {network === 'bsc' && <ExternalLink href={`https://cashewnutz.github.io/pancake_fork/#/swap?outputCurrency=${item.addr}`}><DollarSign style={{color:'white'}} /></ExternalLink>}
                   </td>}
                  {['bsc', 'eth'].includes(network) && <td><ExternalLinkIcon style={{display:'inline'}} href={`${network === 'eth' ? `https://etherscan.io/address/${item.addr}` : `https://bscscan.com/address/${item.addr}`}`} /></td>}
                  {chainId && item.network?.toLowerCase() === networkMap[chainId] && (<td>
                    {['bsc', 'eth'].includes(network) && <>
                    {item?.safe === undefined && <Loader />}
                    {item?.safe === true && <CheckCircle fontSize={'18px'} fill={'green'} fillOpacity={0.7} />}
                    {item?.safe === false && <AlertCircle fontSize={'18px'} fill={'red'} fillOpacity={0.7} />}
                  </>}
                  {!['bsc', 'eth'].includes(item.network?.toLowerCase()) && <p>Switch networks to use this feature</p>}
                  </td>)}
                  <td>{moment(new Date(+item.timestamp * 1000)).fromNow()}</td>
                  </tr>
              ))}
      </tbody>
          </Table>}

    {accessDenied === false && <ul style={{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'center', alignItems: 'center', listStyle: 'none' }}>
      {getPaginationGroup().map((number) => (
        <li style={{ fontWeight: number === page ? 600 : 500, cursor: 'pointer', marginRight: 10, fontSize: 24 }} key={number} onClick={() => {
          {
            setPage(number)
          }
        }
        }>{number}</li>
      ))}
    </ul>}

    {accessDenied && <p style={{ height: 400, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      You must hold Kiba Inu tokens to use this feature.
    </p>}
  </Wrapper>
  </DarkCard >
}