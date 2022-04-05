import { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import Badge, { BadgeVariant } from 'components/Badge'
import { DarkCard } from 'components/Card'
import { Wrapper } from 'components/swap/styleds'
import moment from 'moment'
import { isHoneyPot } from 'pages/App'
import { LoadingRows } from 'pages/Pool/styleds'
import { useKiba } from 'pages/Vote/VotePage'
import React, { useDebugValue } from 'react'
import { useCallback, useMemo } from 'react'
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, DollarSign, HelpCircle, Info, Link, Loader, ExternalLink as ExLink, Circle, Lock, BarChart2 } from 'react-feather'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'
import ThemeProvider, { ExternalLink, ExternalLinkIcon, LinkStyledButton, StyledInternalLink } from 'theme'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
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
import { getTaxesForBscToken, getTokenTaxes } from 'pages/HoneyUtils'
import Swal from 'sweetalert2'
import { fetchBscTokenData, useBnbPrices, useBscTokenData } from 'state/logs/bscUtils'
import { getTokenData, useEthPrice } from 'state/logs/utils'
import { useTokenHolderCount } from 'components/swap/ChartPage'
import { DetailsModal } from 'components/swap/DetailsModal'
import { useHasAccess } from 'components/AccountPage/AccountPage'
type SortStateKey = 'asc' | 'desc' | undefined;
  type SortState = {
    network: SortStateKey,
    symbol: SortStateKey
    name: SortStateKey,
    addr: SortStateKey,
    timestamp: SortStateKey,
    safe?: SortStateKey,
    buyTax?: SortStateKey,
    sellTax?: SortStateKey
    liquidity?: SortStateKey
  }
  
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
  const { chainId, account, library } = useWeb3React();
  const isBinance = React.useMemo(() => chainId && chainId === 56, [chainId]);
  const src = React.useMemo(() =>
    isBinance ? 'https://cashewnutz.github.io/flape/index.html' : 'https://cashewnutz.github.io/flap/index.html', [isBinance])
  return <>
    <GelatoLimitOrderPanel />
    <GelatoLimitOrdersHistoryPanel />
  </>
}

interface NewToken {
  network: string;
  symbol: string;
  name: string;
  addr: string;
  timestamp: string;
  safe?: boolean;
  buyTax?: number | null;
  sellTax?: number | null;
  liquidity?: any;
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

export const LockedLiquidity = ({ symbol, ...rest }: NewToken) => {
  return null
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
  const networkMap: Record<number, string> = {
    1: 'eth',
    56: 'bsc'
  }
  const [page, setPage] = React.useState(1);
  const AMT_PER_PAGE = 25;
  const [searchValue, setSearchValue] = React.useState('')
  const [flagSafe, setFlagSafe] = React.useState(false)
  const shouldFlagSafe = React.useMemo(() => {
    return flagSafe && ['bsc', 'eth'].includes(network)
  }, [flagSafe, network, chainId])
  const pagedData = React.useMemo(() => {
    if (!data) return [];
    let sorted = data?.filter(a => {
      if (searchValue) return a?.addr?.toLowerCase().includes(searchValue.toLowerCase()) 
                            || a.name?.toLowerCase().includes(searchValue?.toLowerCase()) 
                            || a?.symbol.toLowerCase().includes(searchValue?.toLowerCase());
      return true;
    });
    if (shouldFlagSafe) 
      sorted = sorted.filter(i => !!i.safe)
    const startIndex = page * AMT_PER_PAGE - AMT_PER_PAGE;
    const endIndex = startIndex + AMT_PER_PAGE;
    return sorted.slice(startIndex, endIndex);
  }, [page, data, searchValue, shouldFlagSafe])

  React.useEffect(() => {
    if (data?.length && pagedData.some(i => i.safe === undefined))
      flagAllCallback(pagedData.filter(item => item.safe === undefined))
  }, [pagedData, data])

  const bnbPrice = useBnbPrices()

  const getPaginationGroup = () => {
    if (!data?.length) return []
    let sorted = data?.filter(a => searchValue ? a?.addr?.toLowerCase().includes(searchValue.toLowerCase()) || a.name?.toLowerCase().includes(searchValue?.toLowerCase()) || a?.symbol.toLowerCase().includes(searchValue?.toLowerCase()) : true)
    if (shouldFlagSafe) sorted = sorted?.filter(item => item?.safe === true)
    const start = Math.floor((page - 1) / AMT_PER_PAGE) * AMT_PER_PAGE;
    const pages = sorted.length / AMT_PER_PAGE;
    const retVal = [];
    for (let i = 1; i <= pages; i++) {
      retVal.push(i);
    }
    return retVal.length === 0 ? [1] : retVal;
  };

  React.useEffect(() => {
    if (data &&
      !data?.every(a => a.safe !== undefined)
    )
      flagAllCallback(data?.filter(a => a?.safe === undefined))
  }, [data])

  const [ethPrice, ethPriceOld] = useEthPrice()
  const [lastFetched, setLastFetched] = React.useState<Date | undefined>()

  const flagAllCallback = React.useCallback(async (items: any[]) => {
    try {
      if (!items?.length || !library?.provider) return;
      let safe: any[] = [];
      if (shouldFlagSafe) {
        safe = await Promise.all((data ?? [])?.filter(item => item.safe === undefined).map(async item => {
          const isHoneyPotFn = item.network?.toLowerCase() === 'bsc' ? getTaxesForBscToken : item.network?.toLowerCase() === 'eth' ? getTokenTaxes : (add: string) => Promise.resolve({ honeypot: false, buy: null, sell: null });
          const isSafe = await isHoneyPotFn(item.addr, library?.provider)
          return {
            ...item,
            safe: !isSafe.honeypot,
            buyTax: isSafe?.buy,
            sellTax: isSafe?.sell,
          }
        })) as Array<NewToken>;
        const alreadyFlagged = data?.filter(i => i.safe !== undefined);
        setData([...safe.concat(alreadyFlagged)])
      } else {
        safe = await Promise.all(items?.map(async item => {
          const isHoneyPotFn = item?.network?.toLowerCase() === 'bsc' ? getTaxesForBscToken : item.network?.toLowerCase() === 'eth' ? getTokenTaxes : (add: string) => Promise.resolve({ honeypot: false, buy: null, sell: null });
          const isSafe = await isHoneyPotFn(item.addr, library?.provider)
          return {
            ...item,
            safe: !isSafe.honeypot,
            buyTax: isSafe?.buy,
            sellTax: isSafe?.sell,
          }
        })) as Array<NewToken>;
        setData(data =>
                data?.map((item => 
                      safe?.some(a => a.addr === item.addr) 
                      ? safe.find(i => i.addr === item.addr) 
                      : item)
                    )
        )
      }
    } catch (err) {
      console.error(err)
    }
  }, [network, data, ethPrice, ethPriceOld, bnbPrice, chainId, library, shouldFlagSafe, flagSafe])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0);
  const getData = React.useCallback((networkPassed?: string) => {
    const networkChanged = !!networkPassed;
    const loading =  !data;
    setLoading(loading);
    let networkString: "eth" | "bsc" | "poly" | "ftm" | "kcc" | "avax" = network;
    //reset retry count on network change
    if (networkChanged && networkPassed) { 
      setRetryCount(0); 
      setData(undefined); 
      setPage(1); 
      setLoading(true); 
      networkString = networkPassed as "eth" | "bsc" | "poly" | "ftm" | "kcc" | "avax"; 
    }
    const finallyClause = () => {
      setLastFetched(new Date())
      setTimeout(() => setLoading(false), 1000)
    }
    const finallyErrorClause = (err:any) => {
      console.error(err)
      const newRetryCount = retryCount + 1;

      if (newRetryCount >= 3) {
        setError(true)
      } else {
        const retryCt = retryCount <= 0 ? 0 : retryCount - 1;
        setRetryCount(retryCt);
        setTimeout(() => getData(), 100);
      }
    }
    return axios.default.get(`https://tokenfomo.io/api/tokens/${networkString}?limit=500`, 
                  { method: "GET", headers: authHeader.headers }
           )
          .then(async (response) => {
            const json = response.data;
            const dataNew = json.filter((a: NewToken) => moment(new Date()).diff(moment(new Date(+a.timestamp * 1000)), 'hours') <= 23);
            const sorted = orderBy(data, i => new Date(+i.timestamp * 1000), 'desc')
            const startIndex = page * AMT_PER_PAGE - AMT_PER_PAGE;
            const endIndex = startIndex + AMT_PER_PAGE;
            const pagedSet = sorted.slice(startIndex, endIndex);
            const activeSort = getActiveSort();
            const shouldFlagCallback = data && data.length;
            const newDataValue = orderBy(
              [
                ...(data ? data : [])?.filter((item) => item?.network?.toLowerCase() === networkString?.toLowerCase()),
                ...dataNew.filter((item: any) => item.network?.toLowerCase() === networkString?.toLowerCase() && !data?.some(i => item?.addr === i?.addr))
              ], 
              item => new Date(+item.timestamp * 1000), 
              'desc'
            );
            setData(newDataValue)
            if (shouldFlagCallback) {
              await flagAllCallback(
                orderBy(
                  newDataValue,
                  i => activeSort && activeSort?.key ? i[activeSort.key as keyof NewToken] : new Date(+i.timestamp * 1000),
                  activeSort && activeSort.direction ? activeSort.direction : 'desc'
                )
              )
            }
          })
          .finally(finallyClause)
          .catch(finallyErrorClause)
  }, [network, page, data, library, flagAllCallback])

  useInterval(async () => {
    if (!data) await getData('eth')
    else await getData();
  }, 30000, false)

  const fetchedText = React.useMemo(() => lastFetched ? moment(lastFetched).fromNow() : undefined, [moment(lastFetched).fromNow()])
 
  const initialSortState = {
    'network': undefined,
    'symbol': undefined,
    'name': undefined,
    'addr': undefined,
    'timestamp': 'desc',
    'safe': undefined,
    'buyTax': undefined,
    'sellTax': undefined,
    'liquidity': undefined
  } as SortState

  const [sortState, setSortState] = React.useState<SortState>(initialSortState)

  React.useEffect(() => {
    setPage(1)
    setSortState(initialSortState)
    setFlagSafe(false)
    getData(network)
  }, [network, account, chainId])

  const [showInfo, setShowInfo] = React.useState(false)
  const kibaBalance = useKiba(account)
  
  const getActiveSort = () => {
    return accessDenied ? undefined : Object.keys(sortState).map(key => {
      const isKey = (sortState as any)[key] !== undefined
      return isKey ? {
        key: key,
        direction: (sortState as any)[key] as 'asc' | 'desc'
      } : undefined
    }).find(a => a?.key && a?.direction);
  }

  const onSortClick = (key: keyof NewToken) => {
    if (accessDenied) {
      Swal.fire({
        icon: "warning",
        toast: true,
        timerProgressBar: true,
        timer: 5000,
        position: 'bottom-end',
        text: "You cannot sort or filter the table unless you own Kiba Tokens",
        showConfirmButton: false,
        showCancelButton: false
      });
      return;
    };
    const activeKey = getActiveSort();
    if (activeKey && activeKey?.key !== key) {
      setSortState({
        ...sortState,
        [key]: sortState[key] !== undefined && sortState[key] === 'asc' ? 'desc' : 'asc',
        [activeKey.key]: undefined
      })
    } else {
      setSortState({
        ...sortState,
        [key]: sortState[key] !== undefined && sortState[key] === 'asc' ? 'desc' : 'asc',
      })
    }
  }

  const getNetworkLink = function (item: NewToken) {
    switch (item.network.toLowerCase()) {
      case 'eth': return `https://etherscan.io/token/${item.addr}`
      case 'bsc': return `https://bscscan.com/token/${item.addr}`
      case 'poly': return `https://polygonscan.com/token/${item.addr}`
      case 'kcc': return `https://explorer.kcc.io/en/token/${item.addr}`
      case 'avax': return `https://avascan.info/blockchain/c/address/${item.addr}`
      case 'ftm': return `https://ftmscan.com/token/${item.addr}`
      default: return ``;
    }
  }

  React.useEffect(() => {
    const active = getActiveSort()
    if (active?.key && active?.direction) {
      orderByCallback(active?.key as keyof NewToken, active?.direction)
    }
  }, [sortState])

  const orderByCallback = React.useCallback((key: string | keyof NewToken, direction: 'asc' | 'desc') => {
    setData(orderBy(data, item => item[key as keyof NewToken], direction))
  }, [data, sortState])

  const [showHpInfo, setShowHpInfo] = React.useState(false)
  const hasAccess = useHasAccess()
  const accessDenied = !hasAccess
  const helpTipText = `The honeypot checker will automatically run for the tokens listed to the current connected network. Currently connected to ${chainId && chainId === 1 ? 'Ethereum Mainnet' : chainId && chainId === 56 ? 'Binance Smart Chain' : ''}`;
  const infoTipText = `KibaFomo is auto-refreshing every 30 seconds to go and fetch the latest listed tokens. \r\n\r\nEvery token listed below has been ran through our smart-contract honey pot checks, to determine if it allows for buying and selling. \r\n\r\nThis is an experimental feature. Use at your own risk.`
  const [modalShowing, setModalShowing] = React.useState<any>()
  return (
    <DarkCard style={{ maxWidth: 1200, background: 'radial-gradient(orange,rgba(129,3,3,.95))' }}>
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
          {accessDenied === false && ['bsc', 'eth'].includes(network) && <div>
            <label>Only Show Safe Listings</label>
            <input type="checkbox" checked={flagSafe} onChange={e => {
              setFlagSafe(e.target.checked)
              setPage(1)
            }} />
          </div>}
        </div>
        <div style={{
          width: '100%',
          marginBottom: 5,
          marginTop: 15
        }}>
          <small>KibaFomo only displays tokens that were listed within the last 24 hours.</small>
          {accessDenied === false && (
            <>
              <br />
              <small>Buy tax, sell tax, and honey pot options will show for the current connected network.</small>
            </>
          )}
          <input
            style={{
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

        {accessDenied === false && !!loading && <LoadingRows>
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </LoadingRows>}

        {!loading && accessDenied === false && <Table style={{ fontSize: 12, background: '#222', color: "#FFF", width: "100%" }}>
          <tr style={{ textAlign: 'left' }}>
            <th onClick={() => onSortClick('name')} style={{ width: '5%', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
              <div >
                <div>Name</div>
                {getActiveSort()?.key === 'name' && <>
                  {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                  {getActiveSort()?.direction === 'desc' && <ChevronDown />}
                </>}
              </div>

            </th>
            <th onClick={() => onSortClick('symbol')} style={{ display: 'table-cell', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
              <div >
                <div>Symbol</div>
                {getActiveSort()?.key === 'symbol' && <>
                  {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                  {getActiveSort()?.direction === 'desc' && <ChevronDown />}
                </>}
              </div>

            </th>
            <th onClick={() => onSortClick('addr')} style={{ display: 'table-cell', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
              <div  >
                <span>Contract Address</span>

              </div>
              {getActiveSort()?.key === 'addr' && <>
                {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                {getActiveSort()?.direction === 'desc' && <ChevronDown />}
              </>}
            </th>


            {<th style={{ display: 'table-cell', justifyContent: 'space-between', textAlign: 'left' }}>
              HP Check&nbsp;
              <Tooltip text={helpTipText} show={showHpInfo}>
                <Info onMouseEnter={() => setShowHpInfo(true)} onMouseLeave={() => setShowHpInfo(false)} />
              </Tooltip>
            </th>}
            {accessDenied === false && ['bsc', 'eth'].includes(network) && (
              <>
                {network === 'eth' && <th style={{ display: 'table-cell', justifyContent: 'space-between', textAlign: 'left' }}>Liquidity
                  {getActiveSort()?.key === 'liquidity' && <>
                    {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                    {getActiveSort()?.direction === 'desc' && <ChevronDown />}
                  </>}</th>}
                <th onClick={() => onSortClick('buyTax')} style={{ display: 'table-cell', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>Buy
                  {getActiveSort()?.key === 'buyTax' && <>
                    {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                    {getActiveSort()?.direction === 'desc' && <ChevronDown />}
                  </>}</th>
                <th onClick={() => onSortClick('sellTax')} style={{ display: 'table-cell', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
                  Sell
                  {getActiveSort()?.key === 'sellTax' && <>
                    {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                    {getActiveSort()?.direction === 'desc' && <ChevronDown />}
                  </>}
                </th>
              </>
            )}
            <th onClick={() => onSortClick('timestamp')} style={{ display: 'table-cell', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>Time
              {getActiveSort()?.key === 'timestamp' && <>
                {getActiveSort()?.direction === 'asc' && <ChevronUp />}
                {getActiveSort()?.direction === 'desc' && <ChevronDown />}
              </>}</th>

          </tr>
          <tbody>
            {pagedData.length === 0 && !loading && <tr><td colSpan={9}>{!error && 'No data available at this time.'} {error && <Badge variant={BadgeVariant.NEGATIVE_OUTLINE}>Tokenfomo is currently syncing their data. Please check back again soon.</Badge>}</td></tr>}
            {!loading && !!pagedData?.length && pagedData.map((item) => (
              <tr key={item.addr}>
                <td style={{ fontSize: 12 }}>
                  <span>{item.name}</span>
                </td>
                <td style={{ width: '3%' }}>{item.symbol}</td>
                {/* CONTRACT ADDRESS AND LINKS */}
                <td>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <small>{item.addr}</small>
                    {/* Etherscan / Explorer Link */}
                    <ExternalLinkIcon 
                      style={{}} 
                      href={getNetworkLink(item)} />

                    {/* Chart Link */}
                    {network === 'eth' && <StyledInternalLink to={`/selective-charts/${item.addr}/${item.symbol}`}>
                      <BarChart2 />
                    </StyledInternalLink>}

                    {/* Buy Link */}
                    {network === 'eth' && <StyledInternalLink to={`/swap?outputCurrency=${item.addr}`}>
                      <DollarSign style={{ color: 'white' }} />
                    </StyledInternalLink>}
                    {network === 'bsc' && 
                    <ExternalLink href={`https://kibaswapbsc.app/#/swap?outputCurrency=${item.addr}`}>
                      <DollarSign style={{ color: 'white' }} />
                    </ExternalLink>}
                  </div>
                </td>

                {['eth'].includes(network) && item?.liquidity && <td>
                  <Badge variant={BadgeVariant.PRIMARY}>{`${item.liquidity !== '?' ? `$${item.liquidity}` : '?'}`}</Badge></td>}
                {(<td>
                  {['bsc', 'eth'].includes(network) && <>
                    {item?.safe === undefined && <Loader />}
                    {item?.safe === true && <CheckCircle fontSize={'18px'} fill={'green'} fillOpacity={0.7} />}
                    {item?.safe === false && <AlertCircle fontSize={'18px'} fill={'red'} fillOpacity={0.7} />}
                  </>}
                  {!['bsc', 'eth'].includes(item.network?.toLowerCase()) && <p>Switch networks to use this feature</p>}
                </td>)}
                {accessDenied === false && network === 'eth' && (
                  <td>
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                      <Liquidity addr={item.addr} ethPrice={ethPrice} ethPriceOld={ethPriceOld} bnbPrice={bnbPrice} network={item.network} />
                      {['bsc', 'eth'].includes(item.network.toLowerCase()) && <>{!modalShowing && <LinkStyledButton style={{ fontSize: 8 }} onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); setModalShowing(item); }}>more</LinkStyledButton>}
                        {!!modalShowing && modalShowing?.addr === item.addr && <DetailsModal address={item.addr} isOpen={modalShowing} onDismiss={() => setModalShowing(undefined)} network={item.network.toLowerCase() as 'bsc' | 'eth'} symbol={item.symbol} />}</>}
                    </div>
                  </td>
                )}
                {['bsc', 'eth'].includes(network) && (
                  <td>
                    {(item?.buyTax || item?.buyTax === 0) && <Badge style={{ fontSize: 14 }} variant={BadgeVariant.POSITIVE}>

                      {<small>{item.buyTax}% buy</small>}
                    </Badge>}
                    {(!item.buyTax && item?.buyTax !== 0 && <AlertCircle fontSize={'18px'} fill={'red'} fillOpacity={0.7} />)}
                  </td>
                )}
                {['bsc', 'eth'].includes(network) && (
                  <td>
                    {(item?.sellTax || item?.sellTax === 0) && <Badge style={{ fontSize: 14, color: '#fff' }} color={'white'} variant={BadgeVariant.NEGATIVE}>

                      {<small>{item.sellTax}% sell</small>}

                    </Badge>}
                    {(!item?.sellTax && item?.sellTax !== 0 && <AlertCircle fontSize={'18px'} fill={'red'} fillOpacity={0.7} />)}
                  </td>
                )}
                <td>{moment(+item.timestamp * 1000).fromNow()}</td>
              </tr>
            ))}
          </tbody>
        </Table>}

        {accessDenied === false && <ul style={{ display: 'flex', flexFlow: 'row wrap', justifyContent: 'center', alignItems: 'center', listStyle: 'none' }}>
          {getPaginationGroup().map((number) => (
            <li style={{
              textDecoration: number === page ? 600 : 500,
              fontWeight: number === page ? 600 : 500,
              cursor: 'pointer',
              marginRight: 10,
              fontSize: 24
            }} key={number} onClick={() => {
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
  )
}

const Liquidity = ({ addr, network, ethPrice, ethPriceOld, bnbPrice }: { addr: string, network: string, ethPrice: any, ethPriceOld: any, bnbPrice: any }) => {
  const [liquidity, setLiquidity] = React.useState<any>()
  React.useEffect(() => {
    const func = async () => {
      const tokenDataFn = network?.toLowerCase() === 'bsc' ? fetchBscTokenData : network?.toLowerCase() === 'eth' ? getTokenData : (add: string, p1: any, p2: any) => ({ totalLiquidity: undefined });
      const [price1, price2] = network?.toLowerCase() === 'bsc' ? [bnbPrice?.current, bnbPrice?.current] : [ethPrice, ethPriceOld]
      const tokenData = await tokenDataFn(addr, price1, price2);
      const liquidity = tokenData?.totalLiquidityUSD && !isNaN(tokenData?.totalLiquidityUSD) ? Number((+tokenData?.totalLiquidityUSD * 2).toFixed(0)).toLocaleString() : '?';
      setLiquidity(liquidity)
    }
    func();
  }, [])

  return (
    <>
      <Badge variant={BadgeVariant.DEFAULT}>{liquidity && liquidity !== '?' ? `$${liquidity}` : '?'}</Badge>
    </>)

}


const Renounced = ({ address }: { address: any }) => {
  const owner = useContractOwner(address)
  const isRenounced = React.useMemo(() => owner === '0x0000000000000000000000000000000000000000', [owner])
  return (
    <Circle fill={isRenounced ? 'green' : 'red'} />
  )
} 