import './limit.css'
import '../../pages/Swap/transitions.css'

import * as axios from 'axios'

import { AlertCircle, BarChart2, CheckCircle, ChevronDown, ChevronUp, Circle, DollarSign, Info } from 'react-feather'
import Badge, { BadgeVariant } from 'components/Badge'
import {
  CSSTransition,
  TransitionGroup as ReactCSSTransitionGroup,
} from "react-transition-group";
import { ExternalLink, ExternalLinkIcon, LinkStyledButton, StyledInternalLink, TYPE } from 'theme'
import { GelatoLimitOrderPanel, GelatoLimitOrdersHistoryPanel } from '@gelatonetwork/limit-orders-react'
import { LoadingRows, LoadingSkeleton } from 'pages/Pool/styleds'
import { fetchBscTokenData, useBnbPrices } from 'state/logs/bscUtils'
import { getTaxesForBscToken, getTokenTaxes } from 'pages/HoneyUtils'
import { getTokenData, useEthPrice } from 'state/logs/utils'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useCallback, useMemo } from 'react'

import { DarkCard } from 'components/Card'
import { DetailsModal } from 'components/swap/DetailsModal'
import Loader from 'components/Loader'
import React from 'react'
import Swal from 'sweetalert2'
import { SwapTokenForTokenModal } from 'components/ChartSidebar/SwapTokenForTokenModal'
import Tooltip from 'components/Tooltip'
import { TransactionDetails } from './reducer'
import { TransactionResponse } from '@ethersproject/providers'
import { Wrapper } from 'components/swap/styleds'
import _ from 'lodash'
import { abbreviateNumber } from 'components/BurntKiba'
import { addTransaction } from './actions'
import { getMaxes } from 'pages/HoneyPotDetector'
import moment from 'moment'
import { orderBy } from 'lodash'
import { setOpenModal } from 'state/application/actions'
import styled from 'styled-components/macro'
import { truncate } from 'fs'
import { useActiveWeb3React } from '../../hooks/web3'
import { useContractOwner } from 'components/swap/ConfirmSwapModal'
import { useHasAccess } from 'pages/Account/AccountPage'
import useInterval from 'hooks/useInterval'
import { useIsDarkMode } from 'state/user/hooks'
import { useKiba } from 'pages/Vote/VotePage'
import useTheme from 'hooks/useTheme'
import { useWeb3React } from '@web3-react/core'

type SortStateKey = 'asc' | 'desc' | undefined;

const PAIRS_API = process.env.NODE_ENV == 'development' ? 'http://localhost:3001/api/pairs?network=' : `https://kiba-api.vercel.app/api/pairs?network=`
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
  return <div style={{ maxWidth: 480, margin: '0 auto' }}>
    <GelatoLimitOrderPanel />
    <GelatoLimitOrdersHistoryPanel />
  </div>
}

type TipProps = {
  error: string;
}

const ItemTooltip = (props: TipProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  return <Tooltip show={isOpen} text={props.error}>
    <Info onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} color={'red'} size={20} />
  </Tooltip>
}
interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  pairCreatedAt?: number;
}

export interface Token {
  network: string;
  symbol: string;
  name: string;
  addr: string;
  timestamp: string;
  safe?: boolean;
  buyTax?: number | null;
  sellTax?: number | null;
  error?: string // error that occurred when trying to swap the token
  liquidity: {
    eth?: number
    usd?: number
  }
  screenerToken?: Pair;
  pairs?: Pair[];
  pairAddress?: string
  lastUpdated?: number
}

const StyledDiv = styled.div`
  font-family:"Open Sans";
  font-size:14px;
`

const Table = styled.table`
&:before {
}
td:last-child {
  font-size:12px;
}
th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  color: ${props => props.theme.text1};
  &:before {
  }
}
border-collapse: collapse;
border: 1px solid 
width:100%;
td { color: ${({ theme }) => theme.text1}; }
tr:nth-child(even){background: ${({ theme }) => theme.bg1};}
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

export const LockedLiquidity = ({ symbol, ...rest }: Token) => {
  return null
}

const Row = styled.tr<{ item: Token }>`
  ${props => [props.item.sellTax, props.item.buyTax].some((tax) => Boolean(tax) && Boolean((tax ?? 0) > 50)) ?
    `
     filter: blur(0.85px);
     opacity:0.5;
     >td > .rug-overlay {   
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      background: #fc414087;
      opacity: 1;
      text-align:center;
      font-size:36px;
      font-weight:700;
      width:100%;
      height:fit-content;
      color:#fff;
    }
    ` : ``
  }
`

export const FomoPage = () => {
  const { chainId, account, library } = useWeb3React();
  const [data, setData] = React.useState<Token[] | undefined>([])
  const [init, setInit] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const stateMap = React.useRef<Map<any, any>>(new Map())
  const [modalShowing, setModalShowing] = React.useState<any>()
  const [page, setPage] = React.useState(1);
  const AMT_PER_PAGE = 25;
  const [searchValue, setSearchValue] = React.useState('')
  const [flagSafe, setFlagSafe] = React.useState(false)
  const [ethPrice, ethPriceOld] = useEthPrice()
  const [lastFetched, setLastFetched] = React.useState<Date | undefined>()
  const [showInfo, setShowInfo] = React.useState(false)
  const [showHpInfo, setShowHpInfo] = React.useState(false)
  const [flaggin, setFlaggin] = React.useState(false)

  const theme = useTheme()
  const hasAccess = useHasAccess()
  const helpTipText = `The honeypot checker will automatically run for the tokens listed to the current connected network. Currently connected to ${chainId && chainId === 1 ? 'Ethereum Mainnet' : chainId && chainId === 56 ? 'Binance Smart Chain' : ''}`;
  const infoTipText = `KibaFomo is auto-refreshing every 30 seconds to go and fetch the latest listed tokens. \r\n\r\nEvery token listed below has been ran through our smart-contract honey pot checks, to determine if it allows for buying and selling. \r\n\r\nThis is an experimental feature. Use at your own risk.`

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


  const networkDefaultValue = React.useMemo(() =>
    chainId === 1 ? 'eth' : chainId === 56 ? 'bsc' : 'eth'
    , [chainId]);
  const [network, setNetwork] = React.useState<'bsc' | 'eth' | 'poly' | 'ftm' | 'kcc' | 'avax'>(networkDefaultValue)
  const networkMap: Record<number, string> = {
    1: 'eth',
    56: 'bsc'
  }

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

  const bnbPrice = useBnbPrices()

  const getActiveSort = () => {
    return accessDenied ? undefined : Object.keys(sortState).map(key => {
      const isKey = (sortState as any)[key] !== undefined
      return isKey ? {
        key: key,
        direction: (sortState as any)[key] as 'asc' | 'desc'
      } : undefined
    }).find(a => a?.key && a?.direction);
  }

  const getPaginationGroup = React.useCallback(() => {
    if (!data?.length || loading) return []

    let sorted = data?.filter(a => {
      return searchValue ?
        a?.addr?.toLowerCase().includes(searchValue.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchValue?.toLowerCase()) ||
        a?.symbol.toLowerCase().includes(searchValue?.toLowerCase()) :
        true
    })

    if (shouldFlagSafe) {
      sorted = sorted?.filter(item => item?.safe === true && (item?.buyTax ?? 0) < 50 && (item?.sellTax ?? 0) < 50)
    }

    const pages = sorted.length / AMT_PER_PAGE;
    const retVal = [];
    for (let i = 1; i <= pages; i++) {
      retVal.push(i);
    }
    return retVal.length === 0 ? [1] : retVal;
  }, [data, loading, searchValue, shouldFlagSafe]);

  const accessDenied = false

  const orderByCallback = React.useCallback((key: string | keyof Token, direction: 'asc' | 'desc') => {
    setData(orderBy(data, item => item[key as keyof Token], direction))
  }, [data, sortState])


  const getData = (networkPassed?: "eth" | "bsc" | "poly" | "ftm" | "kcc" | "avax") => {
    if (error) return
    if (stateMap.current.get('nextRefetch')) {
      const refetchTime = stateMap.current.get('nextRefetch') as any
      if (new Date().getTime() <= refetchTime) {
        console.log(`[getData] - avoiding refetching due to not past the refetch time`)
        return
      }
    }
    // use current network if no network is passed - its a polling update
    let networkString: "eth" | "bsc" | "poly" | "ftm" | "kcc" | "avax" = networkPassed as any
    if (!networkString) {
      networkString = network
    }

    const finallyClause = () => {
      setLastFetched(new Date())
      setLoading(false)
    }

    const finallyErrorClause = (err: any) => {
      console.error(`error in fetching for token data`, err)
      stateMap.current.set('nextRefetch', moment().add(2, 'minutes').toDate().getTime())
      stateMap.current.set('count', (stateMap.current.get('count') as any || 0) + 1)
      if (stateMap.current.get('count') > 6) {
        setError(true)
      }
      setLoading(false)
    }

    if (!networkString) return;

    if (canExecute() || !!(networkString && networkString === network)) {

      return fetch
        (
          `${PAIRS_API}${networkString}`,
          { method: "GET", redirect: 'follow' }
        ).then(async (response) => {
          const dataV = await response.json()
          const json = dataV;
          const dataNew = json.filter((a: Token) => moment(new Date()).diff(moment(new Date(+a.timestamp * 1000)), 'hours') <= 23);
          const sorted = orderBy(dataNew, i => new Date(+i.timestamp * 1000), 'desc')
          const activeSort = getActiveSort();
          const newDataValue = orderBy(
            [
              ...sorted.filter((item: any) => item.network?.toLowerCase() === networkString?.toLowerCase() && !data?.some((i: any) => item?.addr === i?.addr))
            ],
            item => item[activeSort?.key || 'timestamp'],
            activeSort?.direction || 'desc'
          );
          const nonExistingItems = newDataValue.filter(item => !data?.some(dataItem => dataItem.addr == item.addr))
          const shouldFlagCallback = nonExistingItems?.length > 0

          if (!!data?.length) {
            setData(data =>
              _.uniqBy
                (
                  _.orderBy
                    (
                      [
                        ...(data ? data : []),
                        ...newDataValue.map(mapToken)
                      ].filter(({ network: zeNetwork }) => zeNetwork?.toLowerCase() === network),
                      (i: Token) => i[activeSort?.key as keyof Token || 'timestamp'],
                      activeSort?.direction || 'desc'
                    ),
                  a => a.addr
                )
            )
          } else {
            setData(data => newDataValue)
          }

          return doExecute();
        })
        .catch(finallyErrorClause)
        .finally(finallyClause)

    } else {
      return Promise.resolve()
    }
  }

  const mapToken = (token: Token) => {
    const doesTokenExist = data?.some(item => item.addr == token.addr)
    if (doesTokenExist) {
      const existingtoken = data?.find(item => item.addr == token.addr)
      if (existingtoken && existingtoken.screenerToken) {
        let screenerToken = existingtoken.screenerToken
        if (token.screenerToken) {
          screenerToken = (existingtoken?.lastUpdated || 0) < (token?.lastUpdated || 0) ? token.screenerToken : existingtoken.screenerToken
        }
        return {
          ...existingtoken,
          ...token,
          screenerToken
        }
      }
      else if (!existingtoken || token.screenerToken) {
        return token;
      }
    }
    return token
  }


  React.useEffect(() => {
    setLoading(true)

    const interval = setInterval(async () => {
      await getData()
    }, 120000)

    return () => {
      if (interval != null) {
        clearInterval(interval)
      }
    }
    setLoading(false)
  }, [])


  const fetchedText = React.useMemo(() => lastFetched ? moment(lastFetched).fromNow() : undefined, [moment(lastFetched).fromNow()])
  const kibaBalance = useKiba(account)



  const onSortClick = (key: keyof Token) => {
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
        [key]: (sortState as any)[key] !== undefined && (sortState as any)[key] === 'asc' ? 'desc' : 'asc',
        [activeKey.key]: undefined
      })
    } else {
      setSortState({
        ...sortState,
        [key]: (sortState as any)[key] !== undefined && (sortState as any)[key] === 'asc' ? 'desc' : 'asc',
      })
    }
  }


  const doExecute = (): void => {
    setLastFetched(new Date())
    stateMap.current.set('last_load', moment().add('seconds', 30).toDate().getTime())
    setLoading(false)
  }

  const canExecute = (): boolean => {
    if (stateMap.current.get('last_load')) {
      const time = stateMap.current.get('last_load') as number
      const isFetchToSoon = new Date().getTime() <= time
      return isFetchToSoon ? false : true
    }
    return true
  }

  const [showModal, setShowModal] = React.useState<Token>()

  const darkTheme = useIsDarkMode()
  const iconColor = darkTheme ? '#fff' : ''

  const RefetchNode = React.useMemo(() => !Boolean(stateMap.current?.get('nextRefetch')) ? null : (
    <tr>
      <td colSpan={4} style={{ borderRight: 'none' }}>
        <TYPE.small>
          Encountered an <span style={{ color: theme.error }}> error </span>
          while fetching data. Automated refetch&apos;s will occur every 2 minutes
        </TYPE.small>
      </td>
      <td colSpan={4}>
        <TYPE.small>Next refetch: <span>{moment(stateMap.current.get('nextRefetch')).fromNow()}</span></TYPE.small>
      </td>
    </tr>
  ), [stateMap.current?.get('nextRefetch') as any])

  const getNetworkLink = function (item: Token) {
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

  const liquidityString = React.useMemo(() =>
    (item: Token) => {
      let liquidity: number | undefined = undefined
      if (item?.liquidity?.usd) {
        liquidity = item?.liquidity?.usd
      } else if (item?.screenerToken?.liquidity?.usd) {
        liquidity = item?.screenerToken?.liquidity?.usd
      }
      return liquidity?.toFixed(2)
    }, [data])

  const getChartLink = (item: Token) => {
    const network = item.network.toLowerCase() == 'eth' ? 'ethereum' : item?.network?.toLowerCase()
    if (network && item.screenerToken?.pairAddress) return `/selective-charts/${network}/${item.screenerToken?.pairAddress}`
    if (network && item.pairAddress) return `/selective-charts/${network}/${item.pairAddress}s`


    return `/selective-charts/${item.addr}/${item.name}/${item.symbol}/18`
  }


  const TableMemo = React.useCallback(() => (
    !data?.length && !pagedData?.length && !searchValue && !loading ?
      RefetchNode :
      !loading && !!pagedData?.length && pagedData.map((item, index) => (
        <CSSTransition
          style={{ postion: 'relative' }}
          key={`row_${index}_${item.addr}`}
          in={index <= 3}
          classNames={"alert"}
          timeout={600}
        >
          <Row item={item}>

            <React.Fragment>
              <td style={{ fontSize: 12 }}>
                <span>{item.name}</span>
                {[item.sellTax, item.buyTax].some((tax) => Boolean(tax) && Boolean((tax ?? 0) > 50)) && (
                  <div className="rug-overlay">
                    RUG PULLED
                  </div>
                )}
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
                    color={iconColor}
                    style={{ stroke: iconColor, color: iconColor, fill: theme.backgroundInteractive }}
                    href={getNetworkLink(item)} />

                  {/* Chart Link */}
                  {(network === 'eth' || network == 'bsc') && <StyledInternalLink to={getChartLink(item)}>
                    <BarChart2 style={{ color: '#F76C1D' }} />
                  </StyledInternalLink>}

                  {/* Buy Link */}
                  {network === 'eth' && <span >
                    <DollarSign onClick={() => setShowModal(item)} style={{ cursor: 'pointer', color: '#779681' }} />
                  </span>}

                  {network === 'bsc' &&
                    <ExternalLink href={`https://kibaswapbsc.app/#/swap?outputCurrency=${item.addr}`}>
                      <DollarSign style={{ color: '#779681' }} />
                    </ExternalLink>}
                </div>
              </td>

              {(<td style={{ textAlign: "center" }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {['bsc', 'eth'].includes(network) && <>
                    {item?.safe === undefined && <Loader />}
                    {item?.safe === true && <CheckCircle fontSize={'18px'} fill={'green'} fillOpacity={0.7} />}
                    {item?.safe === false && <AlertCircle fontSize={'18px'} fill={'red'} fillOpacity={0.7} />}
                  </>}

                  {item?.error && <ItemTooltip error={item.error} />}
                  {!['bsc', 'eth'].includes(item.network?.toLowerCase()) && <p>Switch networks to use this feature</p>}
                </div>
              </td>)}
              {accessDenied === false && (network === 'eth' || network === 'bsc') && (
                <td>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                    {Boolean(liquidityString(item)) && <Badge variant={BadgeVariant.PRIMARY}>{`$${abbreviateNumber(liquidityString(item))}`}</Badge>}
                    {['bsc', 'eth'].includes(item.network.toLowerCase()) &&
                      <>
                        {!modalShowing &&
                          <LinkStyledButton style={{ fontSize: 10, fontFamily: 'Archivo Narrow', borderRadius: 10, fontWeight: 600, padding: 8, color: '#4F4F62' }}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setModalShowing(item);
                            }}>More
                          </LinkStyledButton>
                        }
                        {!!modalShowing && modalShowing?.addr === item.addr && (
                          <DetailsModal
                            token={item}
                            address={item.addr}
                            isOpen={modalShowing}
                            onDismiss={() => setModalShowing(undefined)}
                            network={item.network.toLowerCase() as 'bsc' | 'eth'}
                            symbol={item.symbol} />
                        )}
                      </>
                    }
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
                  {(item?.sellTax || item?.sellTax === 0) && <Badge style={{ fontSize: 14, color: theme.text1 }} color={theme.text1} variant={BadgeVariant.NEGATIVE}>

                    {<small>{item.sellTax}% sell</small>}

                  </Badge>}
                  {(!item?.sellTax && item?.sellTax !== 0 && <AlertCircle fontSize={'18px'} fill={'red'} fillOpacity={0.7} />)}
                </td>
              )}
              <td>{moment(+item.timestamp * 1000).fromNow()}</td>
            </React.Fragment>
          </Row>
        </CSSTransition>
      ))), [data, setShowModal, showModal, modalShowing, RefetchNode, setModalShowing, pagedData, error, searchValue, loading])

  React.useEffect(() => {
    const active = getActiveSort()
    if (active?.key && active?.direction) {
      orderByCallback(active?.key as keyof Token, active?.direction)
    }
  }, [sortState])

  React.useEffect(() => {
    setPage(1)
    setSortState(initialSortState)
    setFlagSafe(false)
    getData(network)
  }, [network])



  // React.useEffect(() => {
  //   if (data &&
  //     !data?.every(a => a.safe !== undefined)
  //   )
  //     flagAllCallback(data?.filter(a => a?.safe === undefined))
  // }, [data])

  return (
    <DarkCard style={{ maxWidth: 1200 }}>
      <SwapTokenForTokenModal item={showModal as Token} isOpen={Boolean(showModal && showModal.addr)} onDismiss={() => setShowModal(undefined)} />
      <Wrapper style={{ color: theme.text1, overflow: 'auto', padding: '9px 14px' }}>
        <div style={{ marginBottom: 10 }}>
          <h1 style={{ fontFamily: 'Open Sans', fontWeight: 'normal' }}>KibaFomo &nbsp;
            <Tooltip text={infoTipText} show={showInfo}>
              <Info onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)} />
            </Tooltip>
          </h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', marginBottom: 15, justifyContent: 'start', alignItems: 'center' }}>
            <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => {
              if (network == 'eth' || loading) return;
              setLoading(true);
              setNetwork('eth');
            }} variant={network === 'eth' ? BadgeVariant.BLUE : BadgeVariant.PRIMARY}>ETH</Badge>
            <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => {
              if (network == 'bsc' || loading) return;
              setLoading(true);
              setNetwork('bsc' || loading);
            }} variant={network === 'bsc' ? BadgeVariant.BLUE : BadgeVariant.PRIMARY}>BSC</Badge>
            <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => {
              if (network == 'avax' || loading) return;
              setLoading(true);
              setNetwork('avax');
            }} variant={network === 'avax' ? BadgeVariant.BLUE : BadgeVariant.PRIMARY}>AVAX</Badge>
            <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => {
              if (network == 'ftm' || loading) return;
              setLoading(true);
              setNetwork('ftm')
            }} variant={network === 'ftm' ? BadgeVariant.BLUE : BadgeVariant.PRIMARY}>FTM</Badge>
            <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => {
              if (network == 'poly' || loading) return;
              setLoading(true);
              setNetwork('poly')
            }} variant={network === 'poly' ? BadgeVariant.BLUE : BadgeVariant.PRIMARY}>POLY</Badge>
            <Badge style={{ marginRight: 5, cursor: 'pointer' }} onClick={() => {
              if (network == 'kcc' || loading) return;
              setLoading(true);
              setNetwork('kcc')
            }} variant={network === 'kcc' ? BadgeVariant.BLUE : BadgeVariant.PRIMARY}>KCC</Badge>
          </div>
          {accessDenied === false && ['bsc', 'eth'].includes(network) && <div>
            <label>Only Show Safe Listings</label> &nbsp;
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
        {accessDenied === false && <ul style={{ display: 'flex', flexFlow: 'row', justifyContent: 'center', alignItems: 'center', listStyle: 'none' }}>
          {getPaginationGroup().map((number) => (
            <li style={{
              color: number === page ? theme.secondary1 : theme.text1,
              textDecoration: number === page ? 600 : 500,
              backgroundColor: number === page ? theme.backgroundInteractive : '',
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
        {fetchedText && <small>Last updated {fetchedText}</small>}
        {accessDenied === false && loading == true && <LoadingSkeleton count={8} />}
        {!loading && accessDenied === false && <Table style={{ fontSize: 12, background: 'transparent', color: theme.text1, width: "100%" }}>
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
                {<th style={{ display: 'table-cell', justifyContent: 'space-between', textAlign: 'left' }}>Liquidity
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
          <ReactCSSTransitionGroup component="tbody">
            {TableMemo()}
          </ReactCSSTransitionGroup>
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
      <Badge variant={BadgeVariant.HOLLOW}>{liquidity && liquidity !== '?' ? `$${liquidity}` : '?'}</Badge>
    </>)

}


const Renounced = ({ address }: { address: any }) => {
  const owner = useContractOwner(address)
  const isRenounced = React.useMemo(() => owner === '0x0000000000000000000000000000000000000000', [owner])
  return (
    <Circle fill={isRenounced ? 'green' : 'red'} />
  )
}