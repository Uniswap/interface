import { AllowanceTransfer, MaxAllowanceTransferAmount, PermitSingle, permit2Address } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useTriggerOnTransactionType } from 'hooks/useTriggerOnTransactionType'
import ms from 'ms'
import { useCallback, useMemo, useRef } from 'react'
import { PERMIT2_ABI } from 'uniswap/src/abis/permit2'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { toReadableError, UserRejectedRequestError } from 'utils/errors'
import { signTypedData } from 'utils/signing'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

const PERMIT_EXPIRATION = ms(`30d`)
const PERMIT_SIG_EXPIRATION = ms(`30m`)

function toDeadline(expiration: number): number {
  return Math.floor((Date.now() + expiration) / 1000)
}

export function usePermitAllowance({ token, owner, spender }: { token?: Token; owner?: string; spender?: string }) {
  const queryEnabled = !!owner && !!token?.address && !!spender
  const { data, refetch: refetchAllowance } = useReadContract({
    address: assume0xAddress(permit2Address(token?.chainId)),
    abi: PERMIT2_ABI,
    chainId: token?.chainId,
    functionName: 'allowance',
    args: queryEnabled ? [assume0xAddress(owner), assume0xAddress(token.address), assume0xAddress(spender)] : undefined,
    query: { enabled: queryEnabled },
  })
  // Permit allowance is updated on chain when a swap is confirmed including a permit signature; we refetch permit allowance when a swap is confirmed
  useTriggerOnTransactionType(TransactionType.Swap, refetchAllowance)

  return useMemo(() => {
    if (!data) {
      return { permitAllowance: undefined, expiration: undefined, nonce: undefined }
    }

    const [amount, expiration, nonce] = data
    const allowance = token ? CurrencyAmount.fromRawAmount(token, amount.toString()) : undefined

    return { permitAllowance: allowance, expiration, nonce }
  }, [data, token])
}

interface Permit extends PermitSingle {
  sigDeadline: number
}

export interface PermitSignature extends Permit {
  signature: string
}

export function useUpdatePermitAllowance({
  token,
  spender,
  nonce,
  onPermitSignature,
}: {
  token?: Token
  spender?: string
  nonce?: number
  onPermitSignature: (signature: PermitSignature) => void
}) {
  const account = useAccount()
  const signer = useEthersSigner()
  const accountRef = useRef(account)
  accountRef.current = account
  const signerRef = useRef(signer)
  signerRef.current = signer

  return useCallback(async () => {
    try {
      const account = accountRef.current
      if (account.status !== 'connected') {
        throw new Error('wallet not connected')
      }
      if (!account.chainId) {
        throw new Error('connected to an unsupported network')
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
        permit2Address(token.chainId),
        account.chainId,
      )
      const signature = await (async () => {
        try {
          const signer = signerRef.current
          if (!signer) {
            throw new Error('missing signer')
          }
          return await signTypedData({ signer, domain, types, value: values })
        } catch (error) {
          if (didUserReject(error)) {
            const symbol = token.symbol ?? 'Token'
            throw new UserRejectedRequestError(`${symbol} permit allowance failed: User rejected signature`)
          } else {
            throw error
          }
        }
      })()
      onPermitSignature({ ...permit, signature })
      return
    } catch (error: unknown) {
      if (error instanceof UserRejectedRequestError) {
        throw error
      } else {
        const symbol = token?.symbol ?? 'Token'
        throw toReadableError(`${symbol} permit allowance failed:`, error)
      }
    }
  }, [nonce, onPermitSignature, spender, token])
}
