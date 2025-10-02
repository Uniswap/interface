import { TradingApi } from '@universe/api'
import { Signer } from 'ethers/lib/ethers'
import { useCallback } from 'react'
import { useSigner } from 'uniswap/src/contexts/UniswapContext'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { isWebApp } from 'utilities/src/platform'

async function getSignature(permitData: TradingApi.NullablePermit, signer: Signer): Promise<string | undefined> {
  const { domain, types, values } = permitData || {}
  if (!domain || !types || !values) {
    return undefined
  }
  return signTypedData({ domain, types, value: values, signer })
}

export type PresignPermitFn = (permitData: TradingApi.NullablePermit) => Promise<string | undefined>

/**
 * Returns a signing utility that can be used to sign permits needed for legacy /swap calldata fetching,
 * for applicable environments.
 */
export function usePresignPermit(): PresignPermitFn | undefined {
  const signer = useSigner()

  const presignPermit = useCallback(
    async (permitData: TradingApi.NullablePermit) => {
      if (!signer) {
        return undefined
      }
      return getSignature(permitData, signer)
    },
    [signer],
  )

  // In environments that can sign typed data without UI prompts (e.g., mobile / ext),
  // we can sign permits when preparing SwapTxAndGasInfo, which allows earlier access to
  // calldata / simulation results. In dapp environments (interface), if a permit is required,
  // signing and calldata fetching are deferred until the swap execution phase.
  return isWebApp ? undefined : presignPermit
}
