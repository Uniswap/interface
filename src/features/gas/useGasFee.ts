import { providers } from 'ethers'
import { useQuery } from 'react-query'
import { useWalletProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { GAS_FEE_REFRESH_INTERVAL } from 'src/constants/gas'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { FeeInfo } from 'src/features/gas/types'
import { logger } from 'src/utils/logger'

export function useGasFee(chainId: ChainId, tx?: providers.TransactionRequest) {
  const provider = useWalletProvider(chainId)

  return useQuery<FeeInfo>(
    ['gasFee', chainId, tx],
    async () => {
      try {
        if (!chainId || !provider || !tx)
          throw new Error('Missing params. Query should not be enabled.')
        logger.debug('useGasFee', '', 'Computing gas fee for tx on chain:', chainId)
        const feeInfo = await computeGasFee(chainId, tx, provider)
        return feeInfo
      } catch (error) {
        logger.error('useGasFee', '', 'Error computing gas fee', error)
        throw error
      }
    },
    {
      enabled: !!(chainId && provider && tx),
      refetchInterval: GAS_FEE_REFRESH_INTERVAL,
    }
  )
}
