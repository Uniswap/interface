import { CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useCallback, useState } from 'react'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { GAS_FEE_REFRESH_INTERVAL } from 'src/constants/gas'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { FeeInfo } from 'src/features/gas/types'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { logger } from 'src/utils/logger'
import { useInterval } from 'src/utils/timing'

export function useGasFeeInfo(
  chainId: ChainId | undefined,
  tx: providers.TransactionRequest | null,
  fallbackGasEstimate?: string
) {
  const [gasFeeInfo, setGasFeeInfo] = useState<FeeInfo | undefined>(undefined)
  const provider = useProvider(chainId || ChainId.Mainnet)

  const computeGas = useCallback(async () => {
    try {
      if (!provider || !chainId) {
        throw new Error('Missing params. Query should not be enabled.')
      }

      if (!tx) return

      computeGasFee(chainId, tx, provider, fallbackGasEstimate)
        .then((feeInfo) => {
          setGasFeeInfo(feeInfo)
        })
        .catch((error) => {
          throw error
        })
    } catch (error) {
      logger.error('useGasFee', '', 'Error computing gas fee', error)
    }
  }, [chainId, provider, tx, fallbackGasEstimate])

  useInterval(computeGas, GAS_FEE_REFRESH_INTERVAL)

  return gasFeeInfo
}

export function useUSDGasPrice(chainId: ChainId | undefined, gasFee?: string) {
  const currencyAmount =
    gasFee && chainId
      ? CurrencyAmount.fromRawAmount(NativeCurrency.onChain(chainId), gasFee)
      : undefined

  return useUSDCValue(currencyAmount)?.toExact()
}
