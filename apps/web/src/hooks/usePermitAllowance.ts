import { AllowanceTransfer, MaxAllowanceTransferAmount, PermitSingle, permit2Address } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useSingleCallResult } from 'lib/hooks/multicall'
import ms from 'ms'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { trace } from 'tracing/trace'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { UserRejectedRequestError, toReadableError } from 'utils/errors'
import { signTypedData } from 'utils/signing'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

const PERMIT_EXPIRATION = ms(`30d`)
const PERMIT_SIG_EXPIRATION = ms(`30m`)

function toDeadline(expiration: number): number {
  return Math.floor((Date.now() + expiration) / 1000)
}

export function usePermitAllowance(token?: Token, owner?: string, spender?: string) {
  const contract = useContract<Permit2>(permit2Address(token?.chainId), PERMIT2_ABI)
  const inputs = useMemo(() => [owner, token?.address, spender], [owner, spender, token?.address])

  // If there is no allowance yet, re-check next observed block.
  // This guarantees that the permitAllowance is synced upon submission and updated upon being synced.
  const [blocksPerFetch, setBlocksPerFetch] = useState<1>()
  const result = useSingleCallResult(contract, 'allowance', inputs, {
    blocksPerFetch,
  }).result as Awaited<ReturnType<Permit2['allowance']>> | undefined

  const rawAmount = result?.amount.toString() // convert to a string before using in a hook, to avoid spurious rerenders
  const allowance = useMemo(
    () => (token && rawAmount ? CurrencyAmount.fromRawAmount(token, rawAmount) : undefined),
    [token, rawAmount],
  )
  useEffect(() => setBlocksPerFetch(allowance?.equalTo(0) ? 1 : undefined), [allowance])

  return useMemo(
    () => ({ permitAllowance: allowance, expiration: result?.expiration, nonce: result?.nonce }),
    [allowance, result?.expiration, result?.nonce],
  )
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
  onPermitSignature: (signature: PermitSignature) => void,
) {
  const account = useAccount()
  const signer = useEthersSigner()
  return useCallback(
    () =>
      trace({ name: 'Permit2', op: 'permit.permit2.signature' }, async (trace) => {
        try {
          if (account.status !== 'connected') {
            throw new Error('wallet not connected')
          }
          if (!account.chainId) {
            throw new Error('connected to an unsupported network')
          }
          if (!signer) {
            throw new Error('missing signer')
          }
          if (!token) {
            throw new Error('missing token')
          }
          if (!spender) {
            throw new Error('missing spender')
          }
          if (nonce === undefined) {
            throw new Error('missing nonce')
          }

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

          const { domain, types, values } = AllowanceTransfer.getPermitData(
            permit,
            permit2Address(token?.chainId),
            account.chainId,
          )
          const signature = await trace.child({ name: 'Sign', op: 'wallet.sign' }, async (walletTrace) => {
            try {
              return await signTypedData(signer, domain, types, values)
            } catch (error) {
              if (didUserReject(error)) {
                walletTrace.setStatus('cancelled')
                const symbol = token?.symbol ?? 'Token'
                throw new UserRejectedRequestError(`${symbol} permit allowance failed: User rejected signature`)
              } else {
                throw error
              }
            }
          })
          onPermitSignature?.({ ...permit, signature })
          return
        } catch (error: unknown) {
          if (error instanceof UserRejectedRequestError) {
            trace.setStatus('cancelled')
            throw error
          } else {
            const symbol = token?.symbol ?? 'Token'
            throw toReadableError(`${symbol} permit allowance failed:`, error)
          }
        }
      }),
    [account.chainId, account.status, nonce, onPermitSignature, signer, spender, token],
  )
}
