import { ChainId, Token } from "@uniswap/sdk";
import { useMemo } from "react";
import { useActiveWeb3React } from "../hooks";
import { useMultipleContractSingleData } from "../state/multicall/hooks";
import { abi as ICTokenABI } from '../constants/abis/ctoken.json'
import { Interface } from '@ethersproject/abi'

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
  public readonly borrowBalance?: number // getaccountsnapshot
  public readonly liquidity?: number // getCash
  public readonly canBeCollateral?: boolean // accountAssets

  constructor(chainId: ChainId, cAddress: string, address: string, decimals: number, cSymbol?: string, cName?: string, symbol?: string, name?: string,
    supplyRatePerBlock?: number, borrowRatePerBlock?: number,
    supplyBalance?: number, borrowBalance?: number, liquidity?: number, canBeCollateral?: boolean) {
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
  }

  public equals(other: CToken): boolean {
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.cAddress === other.cAddress
  }
}

export function useCTokens(cTokenList: [number, string, string, number, string, string, string, string][], accountAssets: string[] | undefined): [CTokenState, CToken | null][] {
  const { account } = useActiveWeb3React()

  const accountArg = useMemo(() => [account ?? undefined], [account])

  const cTokenAddresses = useMemo(
    () =>
      cTokenList.map(([chainId, cAddress, address, decimals, cSymbol, cName, symbol, name]) => {
        return cAddress
      }),
    [cTokenList]
  )

  const supplyRatePerBlockResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'supplyRatePerBlock')
  const borrowRatePerBlockResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'borrowRatePerBlock')
  const accountSnapshotResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'getAccountSnapshot', accountArg)
  const cashResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'getCash')

  return useMemo(() => {
    return supplyRatePerBlockResults.map((supplyRatePerBlockResult, i) => {
      const { result: supplyRatePerBlockValue, loading: supplyRatePerBlockResultLoading } = supplyRatePerBlockResult
      const { result: borrowRatePerBlockValue, loading: borrowRatePerBlockResultLoading } = borrowRatePerBlockResults[i]
      const { result: accountSnapshotValue, loading: accountSnapshotResultLoading } = accountSnapshotResults[i]
      const { result: cashValue, loading: cashResultLoading } = cashResults[i]

      if (supplyRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (borrowRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (accountSnapshotResultLoading) return [CTokenState.LOADING, null]
      if (cashResultLoading) return [CTokenState.LOADING, null]

      if (!supplyRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!accountSnapshotValue) return [CTokenState.NOT_EXISTS, null]
      if (!cashValue) return [CTokenState.NOT_EXISTS, null]

      return [
        CTokenState.EXISTS,
        new CToken(cTokenList[i][0], cTokenList[i][1], cTokenList[i][2], cTokenList[i][3], cTokenList[i][4], cTokenList[i][5], cTokenList[i][6], cTokenList[i][7],
          supplyRatePerBlockValue[0], borrowRatePerBlockValue[0], accountSnapshotValue[1], accountSnapshotValue[2], cashValue[0], false
        )
      ]
    })
  }, [supplyRatePerBlockResults, borrowRatePerBlockResults, accountSnapshotResults, cashResults, cTokenList])
}
