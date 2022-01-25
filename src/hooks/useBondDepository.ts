import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { BOND_DETAILS, IBondDetails } from 'constants/bonds'
import { SupportedChainId } from 'constants/chains'
import { usePairContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useState } from 'react'

import { useBondDepository } from './useContract'

interface IBond {
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
  bond: IBond
  terms: ITerms
  metadata: IMetadata
  depository: Contract | null
  genPrice: BigNumber
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

  const [error, setError] = useState(null)
  const [bonds, setBonds] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const getMarkets = useCallback(async () => {
    const liveBonds = []

    const liveBondIndexes = await depository?.liveMarkets()

    const termPromises = liveBondIndexes.map(async (index: number) => depository?.markets(index))
    const bondPromises = liveBondIndexes.map(async (index: number) => depository?.markets(index))
    const metadataPromises = liveBondIndexes.map(async (index: number) => depository?.metadata(index))

    for (const index of liveBondIndexes) {
      const terms: ITerms = await termPromises[index]
      const bond: IBond = await bondPromises[index]
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

      liveBonds.push({ terms, bond, metadata })
    }

    return liveBonds
  }, [depository])

  useEffect(() => {
    setIsLoading(true)

    getMarkets()
      .then((data: any) => {
        setBonds(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [setIsLoading, getMarkets, chainId])

  return { bonds, isLoading, error }
}

// TODO create a liquidity pool with gen token to make sure it has a USD price
async function processBond({ chainId, bond, terms, metadata, index, depository, genPrice }: IProcessMarketArgs) {
  console.log('BOND: ', bond)
  // TODO change the hard coded change
  const bondDetails: IBondDetails = BOND_DETAILS[SupportedChainId.POLYGON_MUMBAI][bond.quoteToken]
  // TODO call the actual pricing function
  const quoteTokenPrice = bondDetails.priceUSD
  const bondPrice = await depository?.marketPrice(index)
  const bondPriceUSD = BigNumber.from(quoteTokenPrice * +bondPrice)
  const bondDiscount = genPrice.sub(bondPriceUSD).div(genPrice)
  console.log('BOND DISCOUNT: ', bondDiscount)
}
