import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, Percent, Price, Token } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { RowBetween, RowFixed } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { LIMIT_ORDER_MANAGER_ADDRESSES } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { DAI, KROM, USDC, USDT } from 'constants/tokens'
import { poll } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { useKromatikaRouter, useLimitOrderManager } from 'hooks/useContract'
import { useGaslessCallback } from 'hooks/useGaslessCallback'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { PoolState, usePool } from 'hooks/usePools'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'
import { DateTime } from 'luxon/src/luxon'
import { darken } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactGA from 'react-ga'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, HideSmall, MEDIA_WIDTHS, TYPE } from 'theme'
import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { unwrappedToken } from 'utils/unwrappedToken'

import RangeBadge from '../../components/Badge/RangeBadge'
import { getPriceOrderingFromPositionForUI } from '../../components/PositionListItem'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { usePositionTokenURI } from '../../hooks/usePositionTokenURI'
import useTheme from '../../hooks/useTheme'
import { TransactionType } from '../../state/transactions/actions'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { LoadingRows } from './styleds'

const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))

const PageWrapper = styled.div`
  min-width: 800px;
  max-width: 960px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 680px;
    max-width: 680px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 600px;
    max-width: 600px;
  `};

  @media only screen and (max-width: 620px) {
    min-width: 500px;
    max-width: 500px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 340px;
    max-width: 340px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 4px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  background-color: ${({ theme }) => theme.bg2};
    border-radius: 20px;
    padding: 8px 0;
`};
`

const LinkRow = styled(ExternalLink)`
  align-items: center;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;

  justify-content: space-between;
  color: ${({ theme }) => theme.text1};
  margin: 8px 0;
  padding: 16px;
  text-decoration: none;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg6};

  &:last-of-type {
    margin: 8px 0 0 0;
  }

  & > div:not(:first-child) {
    text-align: center;
  }

  :hover {
    background-color: ${({ theme }) => darken(0.03, theme.bg6)};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    row-gap: 12px;
  `};
`

const PriceDetails = styled(DarkCard)`
  box-shadow: 0 0 12px 6px ${({ theme }) => theme.shadow2};
`

const TradeHistory = styled(DarkCard)`
  box-shadow: 0 0 12px 6px ${({ theme }) => theme.shadow2};
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <TYPE.label {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  text-align: center;
  margin-right: 4px;
  font-weight: 500;
`

const HoverText = styled(TYPE.main)`
  text-decoration: none;
  color: ${({ theme }) => theme.text3};

  :hover {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
`

const DoubleArrow = styled.span`
  color: ${({ theme }) => theme.text3};
  margin: 0 1rem;
`
const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%:
  `};
`

function LinkedCurrency({ chainId, currency }: { chainId?: number; currency?: Currency }) {
  const address = (currency as Token)?.address

  if (typeof chainId === 'number' && address) {
    return (
      <ExternalLink href={getExplorerLink(chainId, address, ExplorerDataType.TOKEN)}>
        <RowFixed>
          <CurrencyLogo currency={currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
          <TYPE.main>{currency?.symbol} ↗</TYPE.main>
        </RowFixed>
      </ExternalLink>
    )
  }

  return (
    <RowFixed>
      <CurrencyLogo currency={currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
      <TYPE.main>{currency?.symbol}</TYPE.main>
    </RowFixed>
  )
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>
) {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    } else if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
}

function countZeroes(x: string | number) {
  let counter = 0
  for (let i = 2; i < x.toString().length; i++) {
    if (x.toString().charAt(i) != '0') return counter

    counter++
  }
  return counter
}

function commafy(num: number | string | undefined) {
  if (num == undefined) return undefined
  const str = num.toString().split('.')
  if (str[0].length >= 4) {
    str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,')
  }
  return str.join('.')
}

function formatPrice(value: string | number | undefined) {
  if (value == undefined) return undefined

  if (Number(value) > 9) return commafy(Number(value).toFixed())
  const numberOfZeros = countZeroes(Number(value).toFixed(20))

  if (3 > numberOfZeros && numberOfZeros > 0) return commafy(Number(value).toFixed(3))

  if (Number(value) >= 1) return commafy(Number(value).toFixed(1))

  if (commafy(Number(value).toFixed(3)) != '0.000') return commafy(Number(value).toFixed(3))

  return 0
}

function isToken0Stable(token0: Token | undefined): boolean {
  if (token0 == undefined) return false
  const stables = [DAI, USDC, USDT]
  let flag = false

  stables.forEach((stable) => (stable && stable.symbol && stable?.symbol == token0.symbol ? (flag = true) : ''))
  return flag
}

// snapshots a src img into a canvas
function getSnapshot(src: HTMLImageElement, canvas: HTMLCanvasElement, targetHeight: number) {
  const context = canvas.getContext('2d')

  if (context) {
    let { width, height } = src

    // src may be hidden and not have the target dimensions
    const ratio = width / height
    height = targetHeight
    width = Math.round(ratio * targetHeight)

    // Ensure crispness at high DPIs
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    context.scale(devicePixelRatio, devicePixelRatio)

    context.clearRect(0, 0, width, height)
    context.drawImage(src, 0, 0, width, height)
  }
}

const useInverter = ({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

export function PositionPage({
  match: {
    params: { tokenId: tokenIdFromUrl },
  },
  history,
}: RouteComponentProps<{ tokenId?: string }>) {
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useTheme()

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined
  const {
    loading,
    position: positionDetails,
    createdLogs,
    processedLogs,
    collectedLogs,
  } = useV3PositionFromTokenId(parsedTokenId)

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
    tokenId,
    processed,
    tokensOwed0,
    tokensOwed1,
    owner,
  } = positionDetails || {}

  const { transactionHash: createdTxn, event: createdEvent, blockHash: createdBlockNumber } = createdLogs || {}

  const { transactionHash: processedTxn, event: processedEvent, blockHash: processedBlockNumber } = processedLogs || {}

  const { transactionHash: collectedTxn, event: collectedEvent, blockHash: collectedBlockNumber } = collectedLogs || {}

  const removed = liquidity?.eq(0)

  const { gaslessCallback } = useGaslessCallback()

  const kromatikaRouter = useKromatikaRouter()

  // FIXME disabled
  const isExpertMode = false

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const metadata = usePositionTokenURI(parsedTokenId)

  const currency0Wrapped = token0 ? token0 : undefined
  const currency1Wrapped = token1 ? token1 : undefined
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)
  const isClosed: boolean = processed ? true : false

  // handle manual inversion
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)
  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  const ratio = useMemo(() => {
    return priceLower && pool && priceUpper
      ? getRatio(
          inverted ? priceUpper.invert() : priceLower,
          pool.token0Price,
          inverted ? priceLower.invert() : priceUpper
        )
      : undefined
  }, [inverted, pool, priceLower, priceUpper])

  const [collecting, setCollecting] = useState<boolean>(false)
  const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (collectMigrationHash) {
      // dont jump to pool page if creating
      history.push('/limitorder/')
    }
    //setCollectMigrationHash('')
  }, [history, collectMigrationHash])

  // usdc prices always in terms of tokens
  const price0 = useUSDCPrice(currency0 ?? undefined)
  const price1 = useUSDCPrice(currency1 ?? undefined)

  const feeValue0: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!tokensOwed0 || !currency0) return undefined
    return CurrencyAmount.fromRawAmount(currency0 as Token, tokensOwed0?.toString())
  }, [currency0, tokensOwed0])

  const feeValue1: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!tokensOwed1 || !currency1) return undefined
    return CurrencyAmount.fromRawAmount(currency1 as Token, tokensOwed1?.toString())
  }, [currency1, tokensOwed1])

  const fiatValueOfLiquidity: CurrencyAmount<Token> | null = useMemo(() => {
    if (!price0 || !price1 || !feeValue0 || !feeValue1) return null
    const amount0 = price0.quote(feeValue0)
    const amount1 = price1.quote(feeValue1)
    return amount0.add(amount1)
  }, [price0, price1, feeValue0, feeValue1])

  const currencyAmount = feeValue0?.greaterThan(0) ? feeValue0 : feeValue1

  const orderType = createdEvent?.orderType

  const serviceFeePaid = processedEvent?.serviceFeePaid

  const collectedAmount0 = collectedEvent?.tokensOwed0
  const collectedAmount1 = collectedEvent?.tokensOwed1

  const serviceFeePaidKrom: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!serviceFeePaid || !chainId) return undefined
    return CurrencyAmount.fromRawAmount(KROM[chainId], serviceFeePaid?.toString())
  }, [serviceFeePaid, chainId])

  const createdEventAmount0 = createdEvent?.amount0
  const createdEventAmount1 = createdEvent?.amount1

  const currencyCreatedEventAmount: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!createdEventAmount0 || !currency0Wrapped) return undefined
    if (!createdEventAmount1 || !currency1Wrapped) return undefined

    if (createdEventAmount0.gt(createdEventAmount1)) {
      return CurrencyAmount.fromRawAmount(currency0Wrapped as Token, createdEventAmount0?.toString())
    }
    return CurrencyAmount.fromRawAmount(currency1Wrapped as Token, createdEventAmount1?.toString())
  }, [createdEventAmount0, currency0Wrapped, createdEventAmount1, currency1Wrapped])

  const collectedValue0: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!collectedAmount0 || !currency0) return undefined
    return CurrencyAmount.fromRawAmount(currency0 as Token, collectedAmount0?.toString())
  }, [currency0, collectedAmount0])

  const collectedValue1: CurrencyAmount<Token> | undefined = useMemo(() => {
    if (!collectedAmount1 || !currency1) return undefined
    return CurrencyAmount.fromRawAmount(currency1 as Token, collectedAmount1?.toString())
  }, [currency1, collectedAmount1])

  const [createdBlockDate, setCreatedBlockDate] = useState<DateTime>()
  const [processedBlockDate, setProcessedBlockDate] = useState<DateTime>()

  useEffect(() => {
    let active = true
    load()
    return () => {
      active = false
    }

    async function load() {
      setCreatedBlockDate(undefined) // this is optional
      if (createdBlockNumber) {
        const res = await library?.getBlock(createdBlockNumber)
        if (!res?.timestamp) {
          return
        }
        setCreatedBlockDate(DateTime.fromSeconds(res?.timestamp))
      }
    }
  }, [createdBlockNumber, library])

  useEffect(() => {
    let active = true
    load()
    return () => {
      active = false
    }

    async function load() {
      setProcessedBlockDate(undefined) // this is optional
      if (collectedBlockNumber) {
        const res = await library?.getBlock(collectedBlockNumber)
        if (!res?.timestamp) {
          return
        }
        setProcessedBlockDate(DateTime.fromSeconds(res?.timestamp))
      }
    }
  }, [collectedBlockNumber, library])

  // TODO (pai) fix the target price ; upper or lower ; buy or sell
  const positionSummaryLink = useMemo(() => {
    if (!chainId || !createdTxn) return undefined

    return getExplorerLink(chainId, createdTxn, ExplorerDataType.TRANSACTION)
  }, [chainId, createdTxn])

  const collectedSummaryLink = useMemo(() => {
    if (!chainId || !collectedTxn) return undefined

    return getExplorerLink(chainId, collectedTxn, ExplorerDataType.TRANSACTION)
  }, [chainId, collectedTxn])

  const sqrtRatioX96Recalc = createdEvent?.sqrtPriceX96

  const createdPrice = useMemo(() => {
    if (!currency0Wrapped || !currency1Wrapped || !sqrtRatioX96Recalc) return undefined
    const ratioX192 = JSBI.multiply(JSBI.BigInt(sqrtRatioX96Recalc), JSBI.BigInt(sqrtRatioX96Recalc))
    return new Price(currency0Wrapped, currency1Wrapped, Q192, ratioX192)
  }, [currency0Wrapped, currency1Wrapped, sqrtRatioX96Recalc])

  // TODO (pai) fix the target price ; upper or lower ; buy or sell
  const targetPrice = useMemo(() => {
    if (createdPrice) {
      if (createdPrice?.baseCurrency != currencyCreatedEventAmount?.currency) {
        return createdPrice.invert()
      }
      return createdPrice
    }
    if (priceUpper?.baseCurrency != currencyCreatedEventAmount?.currency) {
      // invert
      return priceUpper?.invert()
    }
    return priceUpper
  }, [createdPrice, currencyCreatedEventAmount, priceUpper])

  const addTransaction = useTransactionAdder()
  const limitManager = useLimitOrderManager()
  const collect = useCallback(() => {
    if (!chainId || !feeValue0 || !feeValue1 || !limitManager || !account || !tokenId || !library) return

    setCollecting(true)

    const calldata = limitManager.interface.encodeFunctionData('collect', [tokenId])

    const txn = {
      to: limitManager.address,
      data: calldata,
      value: '0x0',
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(chainId, estimate),
        }
        setCollectMigrationHash(null)
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setCollectMigrationHash(response.hash)
            setCollecting(false)

            ReactGA.event({
              category: 'Liquidity',
              action: 'Collect',
              label: [feeValue0.currency.symbol, feeValue1.currency.symbol].join('/'),
            })

            addTransaction(response, {
              type: TransactionType.COLLECT_FEES,
              currencyId0: currencyId(feeValue0.currency),
              currencyId1: currencyId(feeValue1.currency),
            })
          })
      })
      .catch((error) => {
        setCollectMigrationHash(null)
        setCollecting(false)
        console.error(error)
      })
  }, [chainId, feeValue0, feeValue1, limitManager, account, tokenId, addTransaction, library])
  const cancel = useCallback(() => {
    if (!chainId || !feeValue0 || !feeValue1 || !limitManager || !account || !tokenId || !library) return

    setCollecting(true)

    const calldata = limitManager.interface.encodeFunctionData('cancelLimitOrder', [tokenId])

    const txn = {
      to: limitManager.address,
      data: calldata,
      value: '0x0',
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(chainId, estimate),
        }

        if (isExpertMode && kromatikaRouter) {
          const routerCalldata = kromatikaRouter.interface.encodeFunctionData('execute', [
            LIMIT_ORDER_MANAGER_ADDRESSES[chainId],
            calldata,
          ])

          const txParams = {
            data: routerCalldata,
            to: kromatikaRouter.address,
            from: account,
            gasLimit: calculateGasMargin(chainId, estimate).add(100000).toHexString(),
            signatureType: 'EIP712_SIGN',
          }

          return gaslessCallback().then((gaslessProvider) => {
            if (!gaslessProvider) return
            return gaslessProvider.send('eth_sendTransaction', [txParams]).then(async (response: any) => {
              const txResponse = await poll(
                async () => {
                  const tx = await gaslessProvider.getTransaction(response)
                  if (tx === null) {
                    return undefined
                  }
                  const blockNumber = await gaslessProvider._getInternalBlockNumber(
                    100 + 2 * gaslessProvider.pollingInterval
                  )
                  return gaslessProvider._wrapTransaction(tx, response, blockNumber)
                },
                { oncePoll: gaslessProvider }
              )

              setCollectMigrationHash(response)
              setCollecting(false)

              ReactGA.event({
                category: 'Liquidity',
                action: 'Cancel',
                label: [feeValue0.currency.symbol, feeValue1.currency.symbol].join('/'),
              })

              if (txResponse) {
                addTransaction(txResponse, {
                  type: TransactionType.COLLECT_FEES,
                  currencyId0: currencyId(feeValue0.currency),
                  currencyId1: currencyId(feeValue1.currency),
                })
              }
              history.push('/limitorder/')
            })
          })
        } else {
          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setCollectMigrationHash(response.hash)
              setCollecting(false)

              ReactGA.event({
                category: 'Liquidity',
                action: 'Cancel',
                label: [feeValue0.currency.symbol, feeValue1.currency.symbol].join('/'),
              })

              addTransaction(response, {
                type: TransactionType.COLLECT_FEES,
                currencyId0: currencyId(feeValue0.currency),
                currencyId1: currencyId(feeValue1.currency),
              })
              history.push('/limitorder/')
            })
        }
      })
      .catch((error) => {
        setCollecting(false)
        console.error(error)
      })
  }, [
    chainId,
    feeValue0,
    feeValue1,
    limitManager,
    account,
    tokenId,
    library,
    isExpertMode,
    kromatikaRouter,
    gaslessCallback,
    history,
    addTransaction,
  ])

  const ownsNFT = owner === account

  const feeValueUpper = inverted ? feeValue0 : feeValue1
  const feeValueLower = inverted ? feeValue1 : feeValue0

  const [invert, setInvert] = useState(true)

  // check if price is within range
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  const token0USD = Number(price0?.toFixed(10))
  const token1USD = Number(price1?.toFixed(10))

  const kromToken = (chainId && KROM[chainId]) || undefined
  const kromPriceUSD = useUSDCPrice(kromToken)
  const feePaidUSD = Number(serviceFeePaidKrom?.toSignificant(2)) * Number(kromPriceUSD?.toSignificant(5))
  const collectedAmount0USD = Number(collectedValue0?.toSignificant(6)) * token0USD
  const collectedAmount1USD = Number(collectedValue1?.toSignificant(6)) * token1USD

  const targetPriceUSD = inverted
    ? token1USD / Number(priceUpper?.toSignificant(10))
    : token0USD / Number(priceUpper?.toSignificant(10))

  const currentPriceInUSD = inverted
    ? token1USD / Number(pool?.token1Price.toSignificant(10))
    : token0USD / Number(pool?.token0Price.toSignificant(10))
  const token1PriceUSD = (Number(price1?.toSignificant(10)) * Number(feeValue1?.toSignificant(10))).toFixed(1)

  const feeValue0USD = Number(feeValue0?.toSignificant(6)) * Number(currentPriceInUSD)

  const serviceFeePaidUSD =
    serviceFeePaidKrom &&
    kromPriceUSD &&
    Number(serviceFeePaidKrom?.toSignificant(2)) * Number(kromPriceUSD?.toSignificant(3))

  const collectedValue0USD = collectedValue0 && token0 && Number(collectedValue0?.toSignificant(3)) * token0USD
  const isTokenStable = isToken0Stable(pool?.token0) ?? undefined

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <LightCard padding="12px 16px">
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueUpper?.currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
                <TYPE.main>{feeValueUpper ? formatCurrencyAmount(feeValueUpper, 4) : '-'}</TYPE.main>
              </RowFixed>
              <TYPE.main>{feeValueUpper?.currency?.symbol}</TYPE.main>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <CurrencyLogo currency={feeValueLower?.currency} size={'20px'} style={{ marginRight: '0.5rem' }} />
                <TYPE.main>{feeValueLower ? formatCurrencyAmount(feeValueLower, 4) : '-'}</TYPE.main>
              </RowFixed>
              <TYPE.main>{feeValueLower?.currency?.symbol}</TYPE.main>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <TYPE.italic>
          {isClosed ? (
            <Trans>Collecting amounts will withdraw currently available amounts for you.</Trans>
          ) : (
            <Trans>Canceling the trade will withdraw available amounts for you.</Trans>
          )}
        </TYPE.italic>
        <ButtonPrimary onClick={isClosed ? collect : cancel}>
          {isClosed ? <Trans>Collect</Trans> : <Trans>Cancel Trade</Trans>}
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const onOptimisticChain = chainId && [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)

  const limitTrade0USD = inverted
    ? token0USD
      ? Number(currencyCreatedEventAmount?.toSignificant(4)) * token0USD
      : Number(currencyCreatedEventAmount?.toSignificant(4)) * currentPriceInUSD
    : token1USD
    ? Number(currencyCreatedEventAmount?.toSignificant(4)) * token1USD
    : Number(currencyCreatedEventAmount?.toSignificant(4)) * currentPriceInUSD

  const limitTrade1USD = inverted
    ? currencyCreatedEventAmount && Number(targetPrice?.quote(currencyCreatedEventAmount).toSignificant(2)) * token1USD
    : currencyCreatedEventAmount && Number(targetPrice?.quote(currencyCreatedEventAmount).toSignificant(2)) * token0USD

  const tokenPosition0 =
    currencyCreatedEventAmount?.currency && unwrappedToken(currencyCreatedEventAmount?.currency)?.symbol

  const limitOrder0USD =
    tokenPosition0 == currency0?.symbol
      ? token0USD
        ? Number(currencyCreatedEventAmount?.toSignificant(4)) * token0USD
        : Number(currencyCreatedEventAmount?.toSignificant(4)) * currentPriceInUSD
      : token1USD
      ? Number(currencyCreatedEventAmount?.toSignificant(4)) * token1USD
      : Number(currencyCreatedEventAmount?.toSignificant(4)) * currentPriceInUSD

  const limitOrder1USD =
    tokenPosition0 == currency0?.symbol
      ? currencyCreatedEventAmount &&
        Number(targetPrice?.quote(currencyCreatedEventAmount).toSignificant(2)) * token1USD
      : currencyCreatedEventAmount &&
        Number(targetPrice?.quote(currencyCreatedEventAmount).toSignificant(2)) * token0USD

  const currentPriceInUSDFixed = currentPriceInUSD.toFixed(20)
  let currentPriceInUSDFormatted = ''
  if (Number(currentPriceInUSDFormatted) > 9)
    currentPriceInUSDFormatted = commafy(Number(currentPriceInUSDFixed).toFixed()) || ''
  const numberOfZeros = countZeroes(currentPriceInUSDFixed)
  const leftoverDigits = currentPriceInUSDFixed.toString().substring(2 + numberOfZeros)

  if (3 > numberOfZeros && numberOfZeros > 0) currentPriceInUSDFormatted = Number(currentPriceInUSDFixed).toFixed(6)

  return loading || poolState === PoolState.LOADING || !feeAmount ? (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  ) : (
    <>
      <PageWrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={() => setShowConfirm(false)}
          attemptingTxn={collecting}
          hash={collectMigrationHash ?? ''}
          content={() => (
            <ConfirmationModalContent
              title={isClosed ? <Trans>Collect</Trans> : <Trans>Cancel</Trans>}
              onDismiss={() => handleDismissConfirmation}
              topContent={modalHeader}
            />
          )}
          pendingText={isClosed ? <Trans>Collecting tokens</Trans> : <Trans>Cancelling trade</Trans>}
        />
        <AutoColumn gap="md">
          <AutoColumn gap="sm">
            <Link style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }} to="/limitorder">
              <HoverText>
                <Trans>← Back to Limit Orders</Trans>
              </HoverText>
            </Link>
            <ResponsiveRow>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={24} margin={true} />
                <TYPE.label fontSize={24} mr="10px">
                  &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
                </TYPE.label>
                <Badge style={{ marginRight: '8px' }}>
                  <BadgeText>
                    <Trans>{new Percent(feeAmount, 1_000_000).toSignificant()}%</Trans>
                  </BadgeText>
                </Badge>
                <RangeBadge removed={removed} inRange={inRange} closed={isClosed} isUnderfunded={false} />
              </RowFixed>
              {ownsNFT && tokenId && (
                <RowFixed>
                  {!isClosed ? (
                    <ButtonConfirmed
                      disabled={collecting || !!collectMigrationHash}
                      confirmed={!!collectMigrationHash && !isCollectPending}
                      width="fit-content"
                      style={{ borderRadius: '20px' }}
                      padding="4px 8px"
                      onClick={() => setShowConfirm(true)}
                    >
                      {!!collectMigrationHash && !isCollectPending ? (
                        <TYPE.main color={theme.text1}>
                          <Trans> Canceled</Trans>
                        </TYPE.main>
                      ) : isCollectPending || collecting ? (
                        <TYPE.main color={theme.text1}>
                          {' '}
                          <Dots>
                            <Trans>Cancelling</Trans>
                          </Dots>
                        </TYPE.main>
                      ) : (
                        <>
                          <TYPE.main color={theme.white}>
                            <Trans>Cancel Trade</Trans>
                          </TYPE.main>
                        </>
                      )}
                    </ButtonConfirmed>
                  ) : (
                    <ButtonConfirmed
                      disabled={true}
                      confirmed={!!collectMigrationHash && !isCollectPending}
                      width="fit-content"
                      style={{ borderRadius: '20px' }}
                      padding="4px 8px"
                      onClick={() => setShowConfirm(true)}
                    >
                      <TYPE.main color={theme.text1}>
                        <Trans> Collected</Trans>
                      </TYPE.main>
                    </ButtonConfirmed>
                  )}
                </RowFixed>
              )}
            </ResponsiveRow>
            <RowBetween></RowBetween>
          </AutoColumn>
          <PriceDetails>
            <AutoColumn gap="md">
              <DarkCard style={{ padding: '0' }}>
                <AutoColumn gap="md" style={{ width: '100%' }}>
                  <AutoColumn gap="md">
                    <Label>
                      <Trans>Amounts</Trans>
                    </Label>
                    {fiatValueOfLiquidity?.greaterThan(new Fraction(1, 100)) ? (
                      <TYPE.largeHeader fontSize={36} fontWeight={400}>
                        <Trans>${fiatValueOfLiquidity.toFixed(2, { groupSeparator: ',' })}</Trans>
                      </TYPE.largeHeader>
                    ) : (
                      <TYPE.largeHeader color={theme.text1} fontSize={36} fontWeight={400}>
                        <Trans>$-</Trans>
                      </TYPE.largeHeader>
                    )}
                  </AutoColumn>
                  <LightCard padding="12px 16px">
                    <AutoColumn gap="md">
                      <RowBetween>
                        <LinkedCurrency chainId={chainId} currency={currencyQuote} />
                        <RowFixed>
                          <TYPE.main>
                            {inverted ? commafy(feeValue0?.toSignificant(6)) : commafy(feeValue1?.toSignificant(6))}
                            {'  '} &nbsp;
                          </TYPE.main>
                          <TYPE.darkGray>
                            <TYPE.darkGray>
                              {' '}
                              {inverted ? (
                                feeValue0USD ? (
                                  <span> (${formatPrice(feeValue0USD)})</span>
                                ) : (
                                  ''
                                )
                              ) : token1PriceUSD ? (
                                <span> (${formatPrice(token1PriceUSD)})</span>
                              ) : (
                                ''
                              )}{' '}
                            </TYPE.darkGray>{' '}
                          </TYPE.darkGray>
                          {typeof ratio === 'number' && !removed ? (
                            <Badge style={{ marginLeft: '10px' }}>
                              <TYPE.main fontSize={14}>
                                <Trans>{inverted ? ratio : 100 - ratio}%</Trans>
                              </TYPE.main>
                            </Badge>
                          ) : null}
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <LinkedCurrency chainId={chainId} currency={currencyBase} />
                        <RowFixed>
                          <TYPE.main>
                            {inverted ? commafy(feeValue1?.toSignificant(5)) : commafy(feeValue0?.toSignificant(5))}{' '}
                            &nbsp;
                          </TYPE.main>

                          <TYPE.darkGray>
                            {' '}
                            {inverted ? (
                              token1PriceUSD ? (
                                <span> (${formatPrice(token1PriceUSD)})</span>
                              ) : (
                                ''
                              )
                            ) : feeValue0USD ? (
                              <span> (${formatPrice(feeValue0USD)})</span>
                            ) : (
                              ''
                            )}{' '}
                          </TYPE.darkGray>

                          {typeof ratio === 'number' && !removed ? (
                            <Badge style={{ marginLeft: '10px' }}>
                              <TYPE.main color={theme.text2} fontSize={14}>
                                <Trans>{inverted ? 100 - ratio : ratio}%</Trans>
                              </TYPE.main>
                            </Badge>
                          ) : null}
                        </RowFixed>
                      </RowBetween>
                    </AutoColumn>
                  </LightCard>
                </AutoColumn>
              </DarkCard>
              <DarkCard style={{ padding: '0' }}>
                <RowBetween>
                  <RowFixed>
                    <Label display="flex" style={{ marginRight: '12px' }}>
                      <Trans>Price Details</Trans>
                    </Label>
                  </RowFixed>
                </RowBetween>
                <br />
                <RowBetween>
                  <LightCard padding="12px" width="100%">
                    <AutoColumn gap="8px" justify="center">
                      <ExtentsText>
                        <Trans>Current price </Trans>
                      </ExtentsText>
                      <TYPE.mediumHeader textAlign="center">
                        <span onClick={() => setInvert(!invert)}>
                          {inverted
                            ? pool && commafy(pool.token1Price?.toSignificant(6))
                            : pool && commafy(pool.token0Price?.toSignificant(6))}
                        </span>
                      </TYPE.mediumHeader>
                      <TYPE.darkGray>
                        {!isTokenStable && currentPriceInUSD && numberOfZeros <= 2 ? (
                          <span>(${formatPrice(currentPriceInUSD)})</span>
                        ) : (
                          ''
                        )}
                        {numberOfZeros > 2 && !isTokenStable ? (
                          <span>
                            ($ 0.0<sub>{numberOfZeros}</sub>
                            {leftoverDigits.substring(0, 4)})
                          </span>
                        ) : (
                          ''
                        )}
                      </TYPE.darkGray>
                      <ExtentsText>
                        {' '}
                        <Trans>
                          <span onClick={() => setInvert(!invert)}>
                            {invert ? currencyQuote?.symbol : currencyBase?.symbol} per{' '}
                            {invert ? currencyBase?.symbol : currencyQuote?.symbol}
                          </span>
                        </Trans>
                      </ExtentsText>
                    </AutoColumn>
                  </LightCard>

                  <DoubleArrow>⟷</DoubleArrow>
                  <LightCard padding="12px" width="100%">
                    <AutoColumn gap="8px" justify="center">
                      <ExtentsText>
                        <Trans>Target price</Trans>
                      </ExtentsText>
                      <TYPE.mediumHeader textAlign="center">
                        {priceUpper ? commafy(priceUpper?.toSignificant(6)) : ''}
                        {''}{' '}
                      </TYPE.mediumHeader>
                      <TYPE.darkGray>
                        {targetPriceUSD && !isTokenStable ? <span>(${formatPrice(targetPriceUSD)})</span> : ''}
                      </TYPE.darkGray>

                      <ExtentsText>
                        {' '}
                        <Trans>
                          <span onClick={() => setInvert(!invert)}>
                            {invert ? currencyQuote?.symbol : currencyBase?.symbol} per{' '}
                            {invert ? currencyBase?.symbol : currencyQuote?.symbol}
                          </span>
                        </Trans>
                      </ExtentsText>
                    </AutoColumn>
                  </LightCard>
                </RowBetween>
              </DarkCard>
            </AutoColumn>
          </PriceDetails>
          <TradeHistory>
            <AutoColumn gap="2px" style={{ width: '100%' }}>
              <AutoColumn gap="2px">
                <RowBetween style={{ alignItems: 'flex-start' }}>
                  <AutoColumn gap="2px">
                    <Label>
                      <Trans>Trade History</Trans>
                    </Label>
                  </AutoColumn>
                </RowBetween>
              </AutoColumn>

              {currencyCreatedEventAmount && positionSummaryLink ? (
                <LinkRow href={positionSummaryLink}>
                  <RangeLineItem>
                    <ExtentsText>
                      <Trans>{createdBlockDate && createdBlockDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
                    </ExtentsText>
                    <HideSmall>
                      <DoubleArrow>⟷</DoubleArrow>{' '}
                    </HideSmall>
                    <TYPE.small>
                      <Trans>
                        Created Limit Trade {commafy(currencyCreatedEventAmount?.toSignificant())}{' '}
                        {currencyCreatedEventAmount?.currency
                          ? unwrappedToken(currencyCreatedEventAmount?.currency)?.symbol
                          : ''}{' '}
                        {limitOrder0USD ? <span>(${formatPrice(limitOrder0USD)}) </span> : ' '}
                        for{' '}
                        {targetPrice && currencyCreatedEventAmount
                          ? commafy(targetPrice?.quote(currencyCreatedEventAmount).toSignificant())
                          : ''}{' '}
                        {targetPrice?.quoteCurrency ? unwrappedToken(targetPrice?.quoteCurrency)?.symbol : ''}
                        {limitOrder1USD ? <span> (${formatPrice(limitOrder1USD)}) </span> : ''}↗
                      </Trans>
                    </TYPE.small>
                  </RangeLineItem>
                </LinkRow>
              ) : (
                ''
              )}
              {collectedSummaryLink ? (
                <LinkRow href={collectedSummaryLink}>
                  <RangeLineItem>
                    <ExtentsText>
                      <Trans>{processedBlockDate && processedBlockDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
                    </ExtentsText>
                    <HideSmall>
                      <DoubleArrow>⟷</DoubleArrow>{' '}
                    </HideSmall>
                    <TYPE.small>
                      <Trans>
                        Collected {collectedValue0 ? commafy(collectedValue0?.toSignificant(3)) : ''}{' '}
                        {collectedValue0?.currency ? unwrappedToken(collectedValue0?.currency)?.symbol : ''}
                        {collectedValue0USD ? <span> (${formatPrice(collectedValue0USD)}) </span> : ' '} and{' '}
                        {collectedValue1 ? commafy(collectedValue1?.toFixed(6)) : ''}{' '}
                        {collectedValue1?.currency ? unwrappedToken(collectedValue1?.currency)?.symbol : ''}
                        {collectedAmount1USD ? <span> (${formatPrice(collectedAmount1USD)})</span> : ''}
                      </Trans>
                    </TYPE.small>
                  </RangeLineItem>
                </LinkRow>
              ) : (
                ''
              )}

              {serviceFeePaidKrom && collectedSummaryLink ? (
                <LinkRow href={collectedSummaryLink}>
                  <RangeLineItem>
                    <ExtentsText>
                      <Trans>{processedBlockDate && processedBlockDate.toLocaleString(DateTime.DATETIME_FULL)}</Trans>
                    </ExtentsText>
                    <HideSmall>
                      <DoubleArrow>⟷</DoubleArrow>{' '}
                    </HideSmall>
                    <TYPE.small>
                      <Trans>
                        Paid {serviceFeePaidKrom?.toSignificant(2)}{' '}
                        {serviceFeePaidKrom?.currency ? unwrappedToken(serviceFeePaidKrom?.currency)?.symbol : ''}{' '}
                        {serviceFeePaidUSD ? <span>(${formatPrice(serviceFeePaidUSD)}) </span> : ' '}
                        service fees ↗
                      </Trans>
                    </TYPE.small>
                  </RangeLineItem>
                </LinkRow>
              ) : (
                ''
              )}
            </AutoColumn>
          </TradeHistory>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
