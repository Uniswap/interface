import { Token } from '@teleswap/sdk'
import ERC20_INTERFACE from 'constants/abis/erc20'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { NEVER_RELOAD, useMultipleContractSingleData } from 'state/multicall/hooks'

import { useDefaultTokensAddress } from './usePresetContractAddress'

export function usePresetTokens() {
  const { chainId } = useActiveWeb3React()
  const { WETH, USDC, USDT, DAI } = useDefaultTokensAddress()
  // const wethContract = useTokenContract(WETH, false)
  // const usdcContract = useTokenContract(USDC, false)
  // const usdtContract = useTokenContract(USDT, false)
  // const daiContract = useTokenContract(DAI, false)
  // const wethDecimals = useSingleCallResult(wethContract, 'decimals', undefined, NEVER_RELOAD)
  // const usdcDecimals = useSingleCallResult(usdcContract, 'decimals', undefined, NEVER_RELOAD)
  // const usdtDecimals = useSingleCallResult(usdtContract, 'decimals', undefined, NEVER_RELOAD)
  // const daiDecimals = useSingleCallResult(daiContract, 'decimals', undefined, NEVER_RELOAD)

  const [
    wethDecimalMulticallResults,
    usdcDecimalMulticallResults,
    usdtDecimalMulticallResults,
    daiDecimalMulticallResults
  ] = useMultipleContractSingleData([WETH, USDC, USDT, DAI], ERC20_INTERFACE, 'decimals', undefined, NEVER_RELOAD)
  const [
    wethSymbolMulticallResults,
    usdcSymbolMulticallResults,
    usdtSymbolMulticallResults,
    daiSymbolMulticallResults
  ] = useMultipleContractSingleData([WETH, USDC, USDT, DAI], ERC20_INTERFACE, 'symbol', undefined, NEVER_RELOAD)
  const [wethNameMulticallResults, usdcNameMulticallResults, usdtNameMulticallResults, daiNameMulticallResults] =
    useMultipleContractSingleData([WETH, USDC, USDT, DAI], ERC20_INTERFACE, ' name', undefined, NEVER_RELOAD)

  // const wethSymbol = useSingleCallResult(wethContract, 'symbol', undefined, NEVER_RELOAD)
  // const usdcSymbol = useSingleCallResult(usdcContract, 'symbol', undefined, NEVER_RELOAD)
  // const usdtSymbol = useSingleCallResult(usdtContract, 'symbol', undefined, NEVER_RELOAD)
  // const daiSymbol = useSingleCallResult(daiContract, 'symbol', undefined, NEVER_RELOAD)

  // const wethDecimals = useSingleCallResult(wethContract, 'decimals', undefined, NEVER_RELOAD)
  // const usdcDecimals = useSingleCallResult(usdcContract, 'decimals', undefined, NEVER_RELOAD)
  // const usdtDecimals = useSingleCallResult(usdtContract, 'decimals', undefined, NEVER_RELOAD)
  // const daiDecimals = useSingleCallResult(daiContract, 'decimals', undefined, NEVER_RELOAD)
  return useMemo<Token[]>(() => {
    if (!chainId) {
      return []
    }
    const result: Token[] = []
    if (
      WETH &&
      wethDecimalMulticallResults &&
      wethDecimalMulticallResults.result &&
      wethSymbolMulticallResults &&
      wethSymbolMulticallResults.result &&
      wethNameMulticallResults &&
      wethNameMulticallResults.result
    ) {
      result.push(
        new Token(
          chainId,
          WETH,
          wethDecimalMulticallResults?.result[0],
          wethSymbolMulticallResults.result[0],
          wethNameMulticallResults.result[0]
        )
      )
    }
    if (
      USDC &&
      usdcDecimalMulticallResults &&
      usdcDecimalMulticallResults.result &&
      usdcSymbolMulticallResults &&
      usdcSymbolMulticallResults.result &&
      usdcNameMulticallResults &&
      usdcNameMulticallResults.result
    ) {
      result.push(
        new Token(
          chainId,
          USDC,
          usdcDecimalMulticallResults?.result[0],
          usdcSymbolMulticallResults.result[0],
          usdcNameMulticallResults.result[0]
        )
      )
    }
    if (
      USDT &&
      usdtDecimalMulticallResults &&
      usdtDecimalMulticallResults.result &&
      usdtSymbolMulticallResults &&
      usdtSymbolMulticallResults.result &&
      usdtNameMulticallResults &&
      usdtNameMulticallResults.result
    ) {
      result.push(
        new Token(
          chainId,
          USDT,
          usdtDecimalMulticallResults?.result[0],
          usdtSymbolMulticallResults.result[0],
          usdtNameMulticallResults.result[0]
        )
      )
    }
    if (
      DAI &&
      daiDecimalMulticallResults &&
      daiDecimalMulticallResults.result &&
      daiSymbolMulticallResults &&
      daiSymbolMulticallResults.result &&
      daiNameMulticallResults &&
      daiNameMulticallResults.result
    ) {
      result.push(
        new Token(
          chainId,
          DAI,
          daiDecimalMulticallResults?.result[0],
          daiSymbolMulticallResults.result[0],
          daiNameMulticallResults.result[0]
        )
      )
    }
    return result
  }, [
    chainId,
    wethDecimalMulticallResults,
    usdcDecimalMulticallResults,
    usdtDecimalMulticallResults,
    daiDecimalMulticallResults,
    wethSymbolMulticallResults,
    usdcSymbolMulticallResults,
    usdtSymbolMulticallResults,
    daiSymbolMulticallResults,
    wethNameMulticallResults,
    usdcNameMulticallResults,
    usdtNameMulticallResults,
    daiNameMulticallResults,
    WETH,
    USDC,
    USDT,
    DAI
  ])
}
