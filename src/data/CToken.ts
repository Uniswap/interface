import { ChainId, JSBI, Token } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { abi as ICTokenABI } from '../constants/abis/ctoken.json'
import { Interface } from '@ethersproject/abi'
import { useComptrollerContract, useOracleContract } from '../hooks/useContract'
import { CTOKEN_LISTS } from '../constants/lend'
import { EXA_BASE } from '../utils'

const CTOKEN_INTERFACE = new Interface(ICTokenABI)

export enum CTokenState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export const ETH_MANTISSA = 1e18
export const BLOCKS_PER_DAY = 5760 // 4 * 60 * 24
export const DAYS_PER_YEAR = 365

export const ONE = JSBI.BigInt(1)
export const EIGHT = JSBI.BigInt(8)
export const EXCHANGE_RATE_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const COLLATERAL_FACTOR_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const UNDERLYING_PRICE_BASE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const LIQUIDITY = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const ZERO_POINT_EIGHT = JSBI.multiply(EIGHT, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(17)))
export const APY_BASE_NUMBER = Math.pow(10, 38)

export class CToken extends Token {
  public readonly cAddress: string
  public readonly cDecimals: number
  public readonly cSymbol?: string
  public readonly cName?: string
  public readonly supplyRatePerBlock?: number
  public readonly borrowRatePerBlock?: number
  public readonly supplyBalance?: number
  public readonly borrowBalance?: number
  public readonly exchangeRateMantissa?: number
  public readonly liquidity?: number
  public readonly canBeCollateral?: boolean
  public readonly underlyingPrice?: number
  public readonly isListed?: boolean
  public readonly collateralFactorMantissa?: number
  public readonly logo0?: string
  public readonly logo1?: string
  public readonly borrowBalanceCurrent?: number
  public readonly balanceOfUnderlying?: number

  constructor(
    chainId: ChainId,
    cAddress: string,
    address: string,
    decimals: number,
    cSymbol?: string,
    cName?: string,
    symbol?: string,
    name?: string,
    supplyRatePerBlock?: number,
    borrowRatePerBlock?: number,
    supplyBalance?: number,
    borrowBalance?: number,
    exchangeRateMantissa?: number,
    liquidity?: number,
    canBeCollateral?: boolean,
    underlyingPrice?: number,
    isListed?: boolean,
    collateralFactorMantissa?: number,
    logo0?: string,
    logo1?: string,
    borrowBalanceCurrent?: number,
    balanceOfUnderlying?: number
  ) {
    super(chainId, address, decimals, symbol, name)

    this.cAddress = cAddress
    this.cDecimals = 8
    this.cSymbol = cSymbol
    this.cName = cName
    this.supplyRatePerBlock = supplyRatePerBlock
    this.borrowRatePerBlock = borrowRatePerBlock
    this.supplyBalance = supplyBalance
    this.borrowBalance = borrowBalance
    this.exchangeRateMantissa = exchangeRateMantissa
    this.liquidity = liquidity
    this.canBeCollateral = canBeCollateral
    this.underlyingPrice = underlyingPrice
    this.isListed = isListed
    this.collateralFactorMantissa = collateralFactorMantissa
    this.logo0 = logo0
    this.logo1 = logo1
    this.borrowBalanceCurrent = borrowBalanceCurrent
    this.balanceOfUnderlying = balanceOfUnderlying
  }

  public equals(other: CToken): boolean {
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.cAddress === other.cAddress
  }

  public isETH(): boolean {
    return this.chainId && this.symbol === 'ETH'
  }

  public getBorrowBalanceAmount() {
    return JSBI.BigInt(this.borrowBalance ?? 0)
  }

  public getSupplyApy(): JSBI {
    const totalRate = Math.floor(
      Math.pow(((this.supplyRatePerBlock ?? 0) / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR - 1) * ETH_MANTISSA
    )

    return JSBI.subtract(JSBI.BigInt(totalRate), EXA_BASE)
  }

  public getBorrowApy(): JSBI {
    const totalRate = Math.floor(
      Math.pow(((this.borrowRatePerBlock ?? 0) / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR - 1) * ETH_MANTISSA
    )

    return JSBI.subtract(JSBI.BigInt(totalRate), EXA_BASE)
  }

  public getSupplyBalanceAmount(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
      EXA_BASE
    )
  }

  public getSupplyBalanceJSBI(): JSBI {
    return JSBI.divide(
      JSBI.multiply(this.getSupplyBalanceAmount(), JSBI.BigInt(this.underlyingPrice ?? 0)),
      UNDERLYING_PRICE_BASE
    )
  }

  public getSuppliedValue(): JSBI {
    return JSBI.divide(
      JSBI.multiply(this.getSupplyBalanceJSBI(), JSBI.BigInt(this.collateralFactorMantissa ?? 0)),
      COLLATERAL_FACTOR_MANTISSA
    )
  }

  public getBorrowBalanceJSBI(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.borrowBalance ?? 0), JSBI.BigInt(this.underlyingPrice ?? 0)),
      UNDERLYING_PRICE_BASE
    )
  }

  public getLiquidity(): JSBI {
    return JSBI.BigInt(this.liquidity ?? 0)
  }

  public getLiquidityValue(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.liquidity ?? 0), JSBI.BigInt(this.underlyingPrice ?? 0)),
      EXA_BASE
    )
  }

  public getUnderlyingPrice(): JSBI {
    return JSBI.BigInt(this.underlyingPrice ?? 0)
  }

  public getCollateralFactorMantissa(): JSBI {
    return JSBI.BigInt(this.collateralFactorMantissa ?? 0)
  }
}

export function useCTokens(): [CTokenState, CToken | null][] {
  const { chainId, account } = useActiveWeb3React()

  const cTokenList = CTOKEN_LISTS[chainId ?? ChainId.MAINNET]

  const accountArg = useMemo(() => [account ?? '0x0000000000000000000000000000000000000000'], [account])

  const cTokenAddresses = useMemo(
    () =>
      cTokenList.map(cTokenInfo => {
        return cTokenInfo[0]
      }),
    [cTokenList]
  )

  const membershipArgs = useMemo(
    () =>
      cTokenList.map(cTokenInfo => {
        return [account ?? '0x0000000000000000000000000000000000000000', cTokenInfo[0]]
      }),
    [cTokenList, account]
  )

  const comptroller = useComptrollerContract()
  const oracle = useOracleContract()

  const supplyRatePerBlockResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'supplyRatePerBlock'
  )
  const borrowRatePerBlockResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'borrowRatePerBlock'
  )
  const accountSnapshotResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'getAccountSnapshot',
    accountArg
  )
  const cashResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'getCash')
  const membershipResults = useSingleContractMultipleData(comptroller, 'checkMembership', membershipArgs)
  const underlyingPriceResults = useSingleContractMultipleData(
    oracle,
    'getUnderlyingPrice',
    cTokenAddresses.map(cTokenAddress => [cTokenAddress])
  )
  const marketsResults = useSingleContractMultipleData(
    comptroller,
    'markets',
    cTokenAddresses.map(cTokenAddress => [cTokenAddress])
  )
  const borrowBalanceCurrentResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'borrowBalanceCurrent',
    accountArg
  )
  const balanceOfUnderlyingResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'balanceOfUnderlying',
    accountArg
  )

  return useMemo(() => {
    return supplyRatePerBlockResults.map((supplyRatePerBlockResult, i) => {
      const { result: supplyRatePerBlockValue, loading: supplyRatePerBlockResultLoading } = supplyRatePerBlockResult
      const { result: borrowRatePerBlockValue, loading: borrowRatePerBlockResultLoading } = borrowRatePerBlockResults[i]
      const { result: accountSnapshotValue, loading: accountSnapshotResultLoading } =
        accountSnapshotResults.length !== 0 ? accountSnapshotResults[i] : { result: [0, 0, 0, 0], loading: false }
      const { result: cashValue, loading: cashResultLoading } = cashResults[i]
      const { result: membershipValue, loading: membershipLoading } = membershipResults[i]
      const { result: underlyingPriceValue, loading: underlyingPriceLoading } = underlyingPriceResults[i]
      const { result: marketsValue, loading: marketsResultLoading } =
        marketsResults.length !== 0 ? marketsResults[i] : { result: [0, 0, 0], loading: false }
      const { result: borrowBalanceCurrentValue, loading: borrowBalanceCurrentLoading } = borrowBalanceCurrentResults[i]
      const { result: balanceOfUnderlyingValue, loading: balanceOfUnderlyingLoading } = balanceOfUnderlyingResults[i]

      if (supplyRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (borrowRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (accountSnapshotResultLoading) return [CTokenState.LOADING, null]
      if (cashResultLoading) return [CTokenState.LOADING, null]
      if (membershipLoading) return [CTokenState.LOADING, null]
      if (underlyingPriceLoading) return [CTokenState.LOADING, null]
      if (marketsResultLoading) return [CTokenState.LOADING, null]
      if (borrowBalanceCurrentLoading) return [CTokenState.LOADING, null]
      if (balanceOfUnderlyingLoading) return [CTokenState.LOADING, null]

      if (!supplyRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!accountSnapshotValue) return [CTokenState.NOT_EXISTS, null]
      if (!cashValue) return [CTokenState.NOT_EXISTS, null]
      if (!membershipValue) return [CTokenState.NOT_EXISTS, null]
      if (!underlyingPriceValue) return [CTokenState.NOT_EXISTS, null]
      if (!marketsValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowBalanceCurrentValue) return [CTokenState.NOT_EXISTS, null]
      if (!balanceOfUnderlyingValue) return [CTokenState.NOT_EXISTS, null]

      return [
        CTokenState.EXISTS,
        new CToken(
          chainId ?? ChainId.MAINNET,
          cTokenList[i][0],
          cTokenList[i][1],
          cTokenList[i][2],
          cTokenList[i][3],
          cTokenList[i][4],
          cTokenList[i][5],
          cTokenList[i][6],
          supplyRatePerBlockValue[0],
          borrowRatePerBlockValue[0],
          accountSnapshotValue[1],
          accountSnapshotValue[2],
          accountSnapshotValue[3],
          cashValue[0],
          membershipValue[0],
          underlyingPriceValue[0],
          marketsValue[0],
          marketsValue[1],
          cTokenList[i][7],
          cTokenList[i][8],
          borrowBalanceCurrentValue[0],
          balanceOfUnderlyingValue[0]
        )
      ]
    })
  }, [
    supplyRatePerBlockResults,
    borrowRatePerBlockResults,
    accountSnapshotResults,
    cashResults,
    membershipResults,
    underlyingPriceResults,
    marketsResults,
    borrowBalanceCurrentResults,
    balanceOfUnderlyingResults,
    chainId,
    cTokenList
  ])
}
