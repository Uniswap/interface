import {
  AllowanceData,
  AllowanceProvider,
  AllowanceTransfer,
  MaxAllowanceTransferAmount,
  PERMIT2_ADDRESS,
  PermitSingle,
} from '@uniswap/permit2-sdk'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import ms from 'ms.macro'
import { useCallback, useEffect, useMemo, useState } from 'react'

const PERMIT_EXPIRATION = ms`30d`
const PERMIT_SIG_EXPIRATION = ms`30m`

function toDeadline(expiration: number): number {
  return Math.floor((Date.now() + expiration) / 1000)
}

export function usePermitAllowance(token?: Token, spender?: string) {
  const { account, provider } = useWeb3React()
  const allowanceProvider = useMemo(() => provider && new AllowanceProvider(provider, PERMIT2_ADDRESS), [provider])
  const [allowanceData, setAllowanceData] = useState<AllowanceData>()

  // If there is no allowanceData, recheck every block so a submitted allowance is immediately observed.
  const blockNumber = useBlockNumber()
  const shouldUpdate = allowanceData ? false : blockNumber

  useEffect(() => {
    if (!account || !token || !spender) return

    allowanceProvider
      ?.getAllowanceData(token.address, account, spender)
      .then((data) => {
        if (stale) return
        setAllowanceData(data)
      })
      .catch((e) => {
        console.warn(`Failed to fetch allowance data: ${e}`)
      })

    let stale = false
    return () => {
      stale = true
    }
  }, [account, allowanceProvider, shouldUpdate, spender, token])

  return allowanceData
}

interface Permit extends PermitSingle {
  sigDeadline: number
}

export interface PermitSignature extends Permit {
  signature: string
}

export function useUpdatePermitAllowance(
  token: Token | undefined,
  spender: string | undefined,
  nonce: number | undefined,
  onPermitSignature: (signature: PermitSignature) => void
) {
  const { account, chainId, provider } = useWeb3React()

  return useCallback(async () => {
    try {
      if (!chainId) throw new Error('missing chainId')
      if (!provider) throw new Error('missing provider')
      if (!token) throw new Error('missing token')
      if (!spender) throw new Error('missing spender')
      if (nonce === undefined) throw new Error('missing nonce')

      const permit: Permit = {
        details: {
          token: token.address,
          amount: MaxAllowanceTransferAmount,
          expiration: toDeadline(PERMIT_EXPIRATION),
          nonce,
        },
        spender,
        sigDeadline: toDeadline(PERMIT_SIG_EXPIRATION),
      }

      const { domain, types, values } = AllowanceTransfer.getPermitData(permit, PERMIT2_ADDRESS, chainId)
      const signature = await provider.getSigner(account)._signTypedData(domain, types, values)
      onPermitSignature?.({ ...permit, signature })
      return
    } catch (e: unknown) {
      const symbol = token?.symbol ?? 'Token'
      throw new Error(`${symbol} permit failed: ${e instanceof Error ? e.message : e}`)
    }
  }, [account, chainId, nonce, onPermitSignature, provider, spender, token])
}
