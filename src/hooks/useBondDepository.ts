import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { formatUnits } from '@ethersproject/units'
import { BOND_DETAILS, IBondDetails } from 'constants/bonds'
import { SupportedChainId } from 'constants/chains'
import { usePairContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useState } from 'react'

import { useBondDepository } from './useContract'

// TODO move to a constants file
const BASE_TOKEN_DECIMALS = 9

export interface IBond extends IBondCore, IMetadata, ITerms {
  index: number
  displayName: string
  priceUSD: BigNumber
  priceToken: number
  priceTokenBigNumber: BigNumber
  discount: string
  duration: string
  expiration: string
  isLP: boolean
  lpUrl: string
  marketPrice: BigNumber
  soldOut: boolean
  capacityInBaseToken: string
  capacityInQuoteToken: string
  maxPayoutInBaseToken: string
  maxPayoutInQuoteToken: string
  maxPayoutOrCapacityInQuote: string
  maxPayoutOrCapacityInBase: string
}

interface IBondCore {
  quoteToken: string
  capacityInQuote: boolean
  capacity: BigNumber
  totalDebt: BigNumber
  maxPayout: BigNumber
  purchased: BigNumber
  sold: BigNumber
}

interface IMetadata {
  lastTune: number
  lastDecay: number
  length: number
  depositInterval: number
  tuneInterval: number
  quoteDecimals: number
}

interface ITerms {
  fixedTerm: boolean
  controlVariable: BigNumber
  vesting: number
  conclusion: number
  maxDebt: BigNumber
}

interface IProcessMarketArgs {
  index: number
  chainId: number
  bond: IBondCore
  terms: ITerms
  metadata: IMetadata
  depository: Contract | null
  genPrice: BigNumber
}

// TODO move this function to a helper file
export function prettifySeconds(seconds: number, resolution?: string) {
  if (seconds !== 0 && !seconds) {
    return ''
  }

  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)

  if (resolution === 'day') {
    return d + (d == 1 ? ' day' : ' days')
  }

  const dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
  const hDisplay = h > 0 ? h + (h == 1 ? ' hr, ' : ' hrs, ') : ''
  const mDisplay = m > 0 ? m + (m == 1 ? ' min' : ' mins') : ''

  let result = dDisplay + hDisplay + mDisplay
  if (mDisplay === '') {
    result = result.slice(0, result.length - 2)
  }

  return result
}

// TOKEN 0 => Genesis
// TOKEN 1 => Dai
function useGenTokenPrice() {
  const [genPrice, setGenPrice] = useState<BigNumber>(BigNumber.from('0'))

  const DAI_GEN_PAIR = '0x3d90706560b2fcb29d0a41aeeed551c96b62f608'
  const pair = usePairContract(DAI_GEN_PAIR)

  const getGenPrice = useCallback(() => {
    pair?.getReserves().then((reserves: any) => {
      const genReserves = reserves.reserve0.mul(BigNumber.from('10').pow(BigNumber.from('9')))
      const daiReserves = reserves.reserve1
      const price = genReserves.div(daiReserves)
      setGenPrice(price)
    })
  }, [pair])

  useEffect(() => getGenPrice(), [getGenPrice])

  return genPrice
}

export function useGetAllBonds() {
  const genPrice = useGenTokenPrice()
  const depository = useBondDepository()
  const { chainId } = useActiveWeb3React()

  const [error, setError] = useState<string | null>(null)
  const [bonds, setBonds] = useState<IBondDetails[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getMarkets = useCallback(async () => {
    const liveBonds = []

    const liveBondIndexes = await depository?.liveMarkets()

    const termPromises = liveBondIndexes.map(async (index: number) => depository?.markets(index))
    const bondPromises = liveBondIndexes.map(async (index: number) => depository?.markets(index))
    const metadataPromises = liveBondIndexes.map(async (index: number) => depository?.metadata(index))

    for (const index of liveBondIndexes) {
      const terms: ITerms = await termPromises[index]
      const bond: IBondCore = await bondPromises[index]
      const metadata: IMetadata = await metadataPromises[index]

      const finalBond = await processBond({
        index,
        chainId: SupportedChainId.POLYGON_MUMBAI,
        bond,
        terms,
        metadata,
        depository,
        genPrice,
      })

      liveBonds.push(finalBond)
    }

    return liveBonds
  }, [depository])

  useEffect(() => {
    setIsLoading(true)

    getMarkets()
      .then((data: any) => {
        setBonds(data)
      })
      .catch((err) => {
        console.log(err)
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [setIsLoading, getMarkets, chainId])

  return { bonds, isLoading, error }
}

// TODO create a liquidity pool with gen token to make sure it has a USD price
async function processBond({
  chainId,
  bond,
  terms,
  metadata,
  index,
  depository,
  genPrice,
}: IProcessMarketArgs): Promise<IBond | null> {
  const currentTime = Date.now() / 1000
  // TODO change the hard coded change
  const bondDetails: IBondDetails = BOND_DETAILS[SupportedChainId.POLYGON_MUMBAI][bond.quoteToken]
  // TODO call the actual pricing function
  const quoteTokenPrice = bondDetails.priceUSD
  const bondPriceBigNumber = await depository?.marketPrice(index)
  // const _bondPrice = +bondPriceBigNumber / Math.pow(10, BASE_TOKEN_DECIMALS)
  // const _bondPriceUSD = quoteTokenPrice * +bondPrice

  const bondPrice = bondPriceBigNumber.div(BigNumber.from('10').mul(BigNumber.from(BASE_TOKEN_DECIMALS)))
  const bondPriceUSD = quoteTokenPrice.mul(bondPrice)
  // const bondDiscount = genPrice.sub(bondPriceUSD).div(genPrice)
  const bondDiscount = genPrice.sub(bondPriceUSD).div(genPrice)

  console.log('Bond Discount', bondDiscount)

  let capacityInBaseToken: string, capacityInQuoteToken: string

  if (bond.capacityInQuote) {
    capacityInBaseToken = formatUnits(
      bond.capacity.mul(Math.pow(10, 2 * BASE_TOKEN_DECIMALS - metadata.quoteDecimals)).div(bondPriceBigNumber),
      BASE_TOKEN_DECIMALS
    )
    capacityInQuoteToken = formatUnits(bond.capacity, metadata.quoteDecimals)
  } else {
    capacityInBaseToken = formatUnits(bond.capacity, BASE_TOKEN_DECIMALS)
    capacityInQuoteToken = formatUnits(
      bond.capacity.mul(bondPriceBigNumber).div(Math.pow(10, 2 * BASE_TOKEN_DECIMALS - metadata.quoteDecimals)),
      metadata.quoteDecimals
    )
  }

  const maxPayoutInBaseToken = formatUnits(bond.maxPayout, BASE_TOKEN_DECIMALS)
  const maxPayoutInQuoteToken = formatUnits(
    bond.maxPayout.mul(bondPriceBigNumber).div(Math.pow(10, 2 * BASE_TOKEN_DECIMALS - metadata.quoteDecimals)),
    metadata.quoteDecimals
  )

  let seconds = 0
  if (terms.fixedTerm) {
    const vestingTime = currentTime + terms.vesting
    seconds = vestingTime - currentTime
  } else {
    const conclusionTime = terms.conclusion
    seconds = conclusionTime - currentTime
  }
  let duration = ''
  if (seconds > 86400) {
    duration = prettifySeconds(seconds, 'day')
  } else {
    duration = prettifySeconds(seconds)
  }

  // SAFETY CHECKs
  // 1. check sold out
  let soldOut = false
  if (+capacityInBaseToken < 1 || +maxPayoutInBaseToken < 1) soldOut = true
  const maxPayoutOrCapacityInQuote = bond.maxPayout.gt(bond.capacity) ? capacityInQuoteToken : maxPayoutInQuoteToken
  const maxPayoutOrCapacityInBase = bond.maxPayout.gt(bond.capacity) ? capacityInBaseToken : maxPayoutInBaseToken

  return {
    ...bond,
    ...metadata,
    ...terms,
    index,
    displayName: `${bondDetails.name}`,
    priceUSD: bondPriceUSD,
    priceToken: bondPrice,
    priceTokenBigNumber: bondPriceBigNumber,
    discount: `${bondDiscount}`,
    expiration: new Date(terms.vesting * 1000).toDateString(),
    duration,
    isLP: bondDetails.isLP,
    // lpUrl: bondDetails.isLP ? bondDetails.lpUrl[chainId] : '',
    lpUrl: '', // TODO check what lpUrl is used for
    marketPrice: genPrice,
    quoteToken: bond.quoteToken.toLowerCase(),
    maxPayoutInQuoteToken,
    maxPayoutInBaseToken,
    capacityInQuoteToken,
    capacityInBaseToken,
    soldOut,
    maxPayoutOrCapacityInQuote,
    maxPayoutOrCapacityInBase,
  }
}
