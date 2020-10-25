import { ChainId, Fraction, JSBI, Token } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { abi as ICTokenABI } from '../constants/abis/ctoken.json'
import { Interface } from '@ethersproject/abi'
import { useComptrollerContract, useOracleContract } from '../hooks/useContract'
import { CTOKEN_LISTS } from '../constants/lend'
import { balanceFormat, underlyingPriceFormat } from '../utils'

const CTOKEN_INTERFACE = new Interface(ICTokenABI)

export enum CTokenState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export const ETH_MANTISSA = 1e18
export const BLOCKS_PER_DAY = 4 * 60 * 24
export const DAYS_PER_YEAR = 365

export const ONE = JSBI.BigInt(1)
// export const EXA_BASE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const EXCHANGE_RATE_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const COLLATERAL_FACTOR_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const LIQUIDITY = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))

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
    collateralFactorMantissa?: number
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

  public getSupplyApy(): number {
    return (Math.pow(((this.supplyRatePerBlock ?? 0) / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR - 1) - 1) * 100
  }

  public getBorrowApy() {
    return (Math.pow(((this.borrowRatePerBlock ?? 0) / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR - 1) - 1) * 100
  }

  public getSupplyBalanceAmount() {
    return this.exchangeRateMantissa && this.supplyBalance && this.decimals
      ? JSBI.divide(
          JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
          COLLATERAL_FACTOR_MANTISSA
        )
      : JSBI.BigInt(0)
  }

  public getSupplyBalance() {
    return parseFloat(
      this.exchangeRateMantissa && this.supplyBalance && this.decimals && this.underlyingPrice
        ? new Fraction(
            JSBI.multiply(
              JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
              JSBI.BigInt(this.underlyingPrice ?? 0)
            ),
            JSBI.multiply(
              JSBI.multiply(balanceFormat(this.decimals), EXCHANGE_RATE_MANTISSA),
              underlyingPriceFormat(this.decimals)
            )
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }

  public getBorrowBalance() {
    return parseFloat(
      this.borrowBalance && this.decimals && this.underlyingPrice
        ? new Fraction(
            JSBI.multiply(JSBI.BigInt(this.borrowBalance ?? 0), JSBI.BigInt(this.underlyingPrice ?? 0)),
            JSBI.multiply(balanceFormat(this.decimals), underlyingPriceFormat(this.decimals))
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }

  public getLiquidity(): JSBI {
    return this.liquidity && this.decimals && this.underlyingPrice
      ? JSBI.divide(
          JSBI.multiply(JSBI.BigInt(this.liquidity), JSBI.BigInt(this.underlyingPrice)),
          JSBI.multiply(underlyingPriceFormat(this.decimals), JSBI.BigInt('1000'))
        )
      : JSBI.BigInt('0')
  }

  public getUnderlyingPrice(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.underlyingPrice ?? 0), balanceFormat(this.decimals)),
      underlyingPriceFormat(this.decimals)
    )
  }

  // public getSuppliedValue() {
  //   return parseFloat(
  //     this.exchangeRateMantissa &&
  //       this.supplyBalance &&
  //       this.decimals &&
  //       this.underlyingPrice &&
  //       this.collateralFactorMantissa
  //       ? new Fraction(
  //           JSBI.multiply(
  //             JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
  //             JSBI.multiply(JSBI.BigInt(this.underlyingPrice ?? 0), JSBI.BigInt(this.collateralFactorMantissa ?? 0))
  //           ),
  //           JSBI.multiply(
  //             JSBI.multiply(balanceFormat(this.decimals), EXCHANGE_RATE_MANTISSA),
  //             JSBI.multiply(underlyingPriceFormat(this.decimals), COLLATERAL_FACTOR_MANTISSA)
  //           )
  //         ).toSignificant(18)
  //       : JSBI.BigInt('0').toString()
  //   )
  // }

  public getSuppliedValue(): JSBI {
    return JSBI.divide(
      JSBI.multiply(
        JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
        JSBI.BigInt(this.underlyingPrice ?? 0)
      ),
      JSBI.multiply(underlyingPriceFormat(this.decimals), EXCHANGE_RATE_MANTISSA)
    )
  }
}

export function useCTokens(): [CTokenState, CToken | null][] {
  const { chainId, account } = useActiveWeb3React()

  const cTokenList = CTOKEN_LISTS[chainId ?? ChainId.MAINNET]

  const accountArg = useMemo(() => [account ?? undefined], [account])

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

      if (supplyRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (borrowRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (accountSnapshotResultLoading) return [CTokenState.LOADING, null]
      if (cashResultLoading) return [CTokenState.LOADING, null]
      if (membershipLoading) return [CTokenState.LOADING, null]
      if (underlyingPriceLoading) return [CTokenState.LOADING, null]
      if (marketsResultLoading) return [CTokenState.LOADING, null]

      if (!supplyRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!accountSnapshotValue) return [CTokenState.NOT_EXISTS, null]
      if (!cashValue) return [CTokenState.NOT_EXISTS, null]
      if (!membershipValue) return [CTokenState.NOT_EXISTS, null]
      if (!underlyingPriceValue) return [CTokenState.NOT_EXISTS, null]
      if (!marketsValue) return [CTokenState.NOT_EXISTS, null]

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
          marketsValue[1]
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
    cTokenList,
    chainId
  ])
}
