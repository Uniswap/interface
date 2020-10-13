import { ChainId, Token } from "@uniswap/sdk";
import { useMemo } from "react";
import { useActiveWeb3React } from "../hooks";
import { useMultipleContractSingleData, useSingleContractMultipleData } from "../state/multicall/hooks";
import { abi as ICTokenABI } from '../constants/abis/ctoken.json'
import { Interface } from '@ethersproject/abi'
import { useComptrollerContract, useOracleContract } from "../hooks/useContract";
import { CTOKEN_LISTS } from "../constants/lend";

const CTOKEN_INTERFACE = new Interface(ICTokenABI)

export enum CTokenState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export class CToken extends Token {
  public readonly cAddress: string
  public readonly cDecimals: number
  public readonly cSymbol?: string
  public readonly cName?: string
  public readonly supplyRatePerBlock?: number
  public readonly borrowRatePerBlock?: number
  public readonly supplyBalance?: number
  public readonly borrowBalance?: number
  public readonly liquidity?: number
  public readonly canBeCollateral?: boolean
  public readonly underlyingPrice?: number

  constructor(chainId: ChainId, cAddress: string, address: string, decimals: number, cSymbol?: string, cName?: string, symbol?: string, name?: string,
    supplyRatePerBlock?: number, borrowRatePerBlock?: number, supplyBalance?: number, borrowBalance?: number,
    liquidity?: number, canBeCollateral?: boolean, underlyingPrice?: number) {
    super(chainId, address, decimals, symbol, name)

    this.cAddress = cAddress
    this.cDecimals = 8
    this.cSymbol = cSymbol
    this.cName = cName
    this.supplyRatePerBlock = supplyRatePerBlock
    this.borrowRatePerBlock = borrowRatePerBlock
    this.supplyBalance = supplyBalance
    this.borrowBalance = borrowBalance
    this.liquidity = liquidity
    this.canBeCollateral = canBeCollateral
    this.underlyingPrice = underlyingPrice
  }

  public equals(other: CToken): boolean {
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.cAddress === other.cAddress
  }
}

export function useCTokens(): [CTokenState, CToken | null][] {
  const { chainId, account } = useActiveWeb3React()

  const cTokenList = CTOKEN_LISTS[chainId ?? ChainId.MAINNET]

  const accountArg = useMemo(() => [account ?? undefined], [account])

  const cTokenAddresses = useMemo(
    () =>
      cTokenList.map((cTokenInfo) => {
        return cTokenInfo[0]
      }),
    [cTokenList]
  )

  const membershipArgs = useMemo(
    () =>
      cTokenList.map((cTokenInfo) => {
        return [account ?? '0x0000000000000000000000000000000000000000', cTokenInfo[0]]
      }),
    [cTokenList, account]
  )

  const comptroller = useComptrollerContract()
  const oracle = useOracleContract()

  const supplyRatePerBlockResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'supplyRatePerBlock')
  const borrowRatePerBlockResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'borrowRatePerBlock')
  const accountSnapshotResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'getAccountSnapshot', accountArg)
  const cashResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'getCash')
  const membershipResults = useSingleContractMultipleData(comptroller, 'checkMembership', membershipArgs)
  const underlyingPriceResults = useSingleContractMultipleData(oracle, 'getUnderlyingPrice', cTokenAddresses.map(cTokenAddress => [cTokenAddress]))

  return useMemo(() => {
    return supplyRatePerBlockResults.map((supplyRatePerBlockResult, i) => {
      const { result: supplyRatePerBlockValue, loading: supplyRatePerBlockResultLoading } = supplyRatePerBlockResult
      const { result: borrowRatePerBlockValue, loading: borrowRatePerBlockResultLoading } = borrowRatePerBlockResults[i]
      const { result: accountSnapshotValue, loading: accountSnapshotResultLoading } = accountSnapshotResults.length !== 0 ? accountSnapshotResults[i] : { result: [0, 0, 0, 0], loading: false }
      const { result: cashValue, loading: cashResultLoading } = cashResults[i]
      const { result: membershipValue, loading: membershipLoading } = membershipResults[i]
      const { result: underlyingPriceValue, loading: underlyingPriceLoading } = underlyingPriceResults[i]

      if (supplyRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (borrowRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (accountSnapshotResultLoading) return [CTokenState.LOADING, null]
      if (cashResultLoading) return [CTokenState.LOADING, null]
      if (membershipLoading) return [CTokenState.LOADING, null]
      if (underlyingPriceLoading) return [CTokenState.LOADING, null]

      if (!supplyRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!accountSnapshotValue) return [CTokenState.NOT_EXISTS, null]
      if (!cashValue) return [CTokenState.NOT_EXISTS, null]
      if (!membershipValue) return [CTokenState.NOT_EXISTS, null]
      if (!underlyingPriceValue) return [CTokenState.NOT_EXISTS, null]

      return [
        CTokenState.EXISTS,
        new CToken(chainId ?? ChainId.MAINNET, cTokenList[i][0], cTokenList[i][1], cTokenList[i][2], cTokenList[i][3], cTokenList[i][4], cTokenList[i][5], cTokenList[i][6],
          supplyRatePerBlockValue[0], borrowRatePerBlockValue[0], accountSnapshotValue[1], accountSnapshotValue[2], cashValue[0], membershipValue[0], underlyingPriceValue[0]
        )
      ]
    })
  }, [supplyRatePerBlockResults, borrowRatePerBlockResults, accountSnapshotResults, cashResults, membershipResults, underlyingPriceResults, cTokenList, chainId])
}
