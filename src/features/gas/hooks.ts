import { CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useState } from 'react'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { GAS_FEE_REFRESH_INTERVAL } from 'src/constants/gas'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { FeeInfo } from 'src/features/gas/types'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { logger } from 'src/utils/logger'
import { useInterval } from 'src/utils/timing'

export function useGasFeeInfo(chainId: ChainId, tx: providers.TransactionRequest) {
  const [gasFeeInfo, setGasFeeInfo] = useState<FeeInfo | undefined>(undefined)
  const provider = useProvider(chainId)

  useInterval(async () => {
    try {
      if (!provider) {
        throw new Error('Missing params. Query should not be enabled.')
      }

      computeGasFee(chainId, tx, provider)
        .then((feeInfo) => {
          setGasFeeInfo(feeInfo)
        })
        .catch((error) => {
          throw error
        })
    } catch (error) {
      logger.error('useGasFee', '', 'Error computing gas fee', error)
    }
  }, GAS_FEE_REFRESH_INTERVAL)

  return gasFeeInfo
}

export function useGasPrice(chainId: ChainId, gasFeeInfo?: FeeInfo) {
  const currency = NativeCurrency.onChain(chainId)
  const currencyAmount = gasFeeInfo
    ? CurrencyAmount.fromRawAmount(currency, gasFeeInfo.fee.normal)
    : undefined

  return useUSDCValue(currencyAmount)?.toExact()
}
