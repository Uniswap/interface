import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { formatUnits, parseEther } from '@ethersproject/units'
import { DAO_TREASURY, GEN_ADDRESS } from 'constants/addresses'
import { BASE_TOKEN_DECIMALS, BOND_DETAILS, IBondDetails } from 'constants/bonds'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useState } from 'react'
import { TransactionType } from 'state/transactions/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { IBond, IBondCore, IMetadata, ITerms } from 'types/bonds'
import { prettifySeconds } from 'utils'
import { getTokenPrice } from 'utils/prices'

import { useBondDepository } from './useContract'

export interface IProcessBondArgs {
  index: number
  chainId: number
  bond: IBondCore
  terms: ITerms
  metadata: IMetadata
  depository: Contract | null
  genPrice: number
}

export interface IPurchaseBondArgs {
  account: string | null | undefined
  bond: IBond
  amount: number
  maxPrice: number
}

export interface IPurchaseBondCallbackReturn {
  success: boolean
  txHash: string | null
}

export type PurchaseBondCallback = (args: IPurchaseBondArgs) => Promise<IPurchaseBondCallbackReturn>

// token0 -> Genesis
// token1 -> Dai
function useGenTokenPrice() {
  const [genPrice, setGenPrice] = useState<number>(0)

  const getGenPrice = useCallback(async () => {
    const genPrice = await getTokenPrice(GEN_ADDRESS[SupportedChainId.POLYGON_MUMBAI], SupportedChainId.POLYGON_MUMBAI)

    setGenPrice(genPrice as number)
  }, [])

  useEffect(() => {
    ;(async () => await getGenPrice())()
  }, [getGenPrice])

  return genPrice
}

export function useGetAllBonds() {
  const genPrice = useGenTokenPrice()
  const depository = useBondDepository()
  const { chainId } = useActiveWeb3React()

  const [error, setError] = useState<string | null>(null)
  const [bonds, setBonds] = useState<IBond[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getMarkets = useCallback(async (): Promise<IBond[]> => {
    const liveBonds = []

    if (!depository) return []

    const liveBondIndexes = await depository.liveMarkets()
    const termPromises = liveBondIndexes.map(async (index: number) => depository.terms(index))
    const bondPromises = liveBondIndexes.map(async (index: number) => depository.markets(index))
    const metadataPromises = liveBondIndexes.map(async (index: number) => depository.metadata(index))

    for (let index = 0; index < liveBondIndexes.length; index++) {
      const terms: ITerms = await termPromises[index]
      const bond: IBondCore = await bondPromises[index]
      const metadata: IMetadata = await metadataPromises[index]

      const finalBond = await processBond({
        index: +liveBondIndexes[index],
        chainId: SupportedChainId.POLYGON_MUMBAI,
        bond,
        terms,
        metadata,
        depository,
        genPrice,
      })

      liveBonds.push(finalBond)
    }

    return liveBonds.filter((bond) => bond !== null) as IBond[]
  }, [depository, genPrice])

  useEffect(() => {
    setIsLoading(true)
    ;(async () => {
      try {
        setBonds(await getMarkets())
      } catch (err) {
        console.log('ERROR: ', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [setIsLoading, getMarkets, chainId, genPrice])

  return { bonds, isLoading, error }
}

async function processBond({
  chainId,
  bond,
  terms,
  metadata,
  index,
  depository,
  genPrice,
}: IProcessBondArgs): Promise<IBond | null> {
  if (genPrice === 0) {
    console.error('GENESIS: Missing GEN price')
    return null
  }

  const currentTime = Date.now() / 1000
  const bondDetails: IBondDetails = BOND_DETAILS[SupportedChainId.POLYGON_MUMBAI][bond.quoteToken.toLowerCase()]

  if (!bondDetails) {
    console.error('GENESIS: Details of the quote token not present on the front-end')
    return null
  }

  const quoteTokenPrice = await bondDetails.pricingFunction()
  const bondPriceBigNumber = await depository?.marketPrice(index)
  const bondPrice = +bondPriceBigNumber / Math.pow(10, BASE_TOKEN_DECIMALS)
  const bondPriceUSD = quoteTokenPrice * +bondPrice
  const bondDiscount = (genPrice - bondPriceUSD) / genPrice

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
  const maxPayoutOrCapacityInQuote =
    +capacityInQuoteToken > +maxPayoutInQuoteToken ? maxPayoutInQuoteToken : capacityInQuoteToken
  const maxPayoutOrCapacityInBase =
    +capacityInBaseToken > +maxPayoutInBaseToken ? maxPayoutInBaseToken : capacityInBaseToken

  return {
    ...bond,
    ...metadata,
    ...terms,
    index,
    displayName: `${bondDetails.name}`,
    priceUSD: bondPriceUSD,
    priceToken: bondPrice,
    priceTokenBigNumber: bondPriceBigNumber,
    discount: bondDiscount,
    expiration: new Date(terms.vesting * 1000).toDateString(),
    duration,
    isLP: bondDetails.isLP,
    lpUrl: '',
    marketPrice: genPrice,
    quoteToken: bond.quoteToken.toLowerCase(),
    maxPayoutInQuoteToken,
    maxPayoutInBaseToken,
    capacityInQuoteToken,
    capacityInBaseToken,
    soldOut,
    maxPayoutOrCapacityInQuote,
    maxPayoutOrCapacityInBase,
    bondIconSvg: bondDetails.bondIconSvg,
    quoteCurrency: bondDetails.quoteCurrency,
  }
}

export function usePurchaseBondCallback(): PurchaseBondCallback {
  const depository = useBondDepository()
  const addTransaction = useTransactionAdder()

  return useCallback<PurchaseBondCallback>(
    async ({ account, bond, amount, maxPrice }: IPurchaseBondArgs): Promise<IPurchaseBondCallbackReturn> => {
      if (!account) return { success: false, txHash: null }

      try {
        let txHash = null

        if (!depository) return { success: false, txHash }

        const amountBigNumber = BigNumber.from(`${amount}`).mul(BigNumber.from('10').pow(bond.quoteDecimals))
        const maxPriceBignNumber = parseEther(`${maxPrice * 1e18}`)

        const depositTx = await depository.deposit(
          bond.index,
          amountBigNumber,
          maxPriceBignNumber,
          account,
          DAO_TREASURY[SupportedChainId.POLYGON_MUMBAI]
        )

        addTransaction(depositTx, {
          type: TransactionType.BOND,
          quoteTokenAmount: amount,
          quoteTokenSymbol: bond?.quoteCurrency?.symbol,
        })

        await depositTx.wait()

        txHash = depositTx.hash
        return { success: true, txHash }
      } catch (error) {
        console.error('GENESIS: Error on purchasing Bond', error)
        return { success: false, txHash: null }
      }
    },
    [depository]
  )
}
