import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { AllowanceTransfer, MaxAllowanceTransferAmount, PERMIT2_ADDRESS, PermitSingle } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import PERMIT2_ABI from 'abis/permit2.json'
import { Permit2 } from 'abis/types'
import { useContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import ms from 'ms.macro'
import { useCallback, useEffect, useMemo, useState } from 'react'

const PERMIT_EXPIRATION = ms`30d`
const PERMIT_SIG_EXPIRATION = ms`30m`

function toDeadline(expiration: number): number {
  return Math.floor((Date.now() + expiration) / 1000)
}

export function usePermitAllowance(token?: Token, owner?: string, spender?: string) {
  const contract = useContract<Permit2>(PERMIT2_ADDRESS, PERMIT2_ABI)
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
    [token, rawAmount]
  )
  useEffect(() => setBlocksPerFetch(allowance?.equalTo(0) ? 1 : undefined), [allowance])

  return useMemo(
    () => ({ permitAllowance: allowance, expiration: result?.expiration, nonce: result?.nonce }),
    [allowance, result?.expiration, result?.nonce]
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
      // Use conedison's signTypedData for better x-wallet compatibility.
      const signature = await signTypedData(provider.getSigner(account), domain, types, values)
      onPermitSignature?.({ ...permit, signature })
      return
    } catch (e: unknown) {
      const symbol = token?.symbol ?? 'Token'
      throw new Error(`${symbol} permit allowance failed: ${e instanceof Error ? e.message : e}`)
    }
  }, [account, chainId, nonce, onPermitSignature, provider, spender, token])
}

/**
 * Calls into the eth_signTypedData methods to add support for wallets with spotty EIP-712 support (eg Safepal) or without any (eg Zerion),
 * by first trying eth_signTypedData, and then falling back to either eth_signTyepdData_v4 or eth_sign.
 * The implementation is copied from ethers (and linted).
 * @see https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/providers/src.ts/json-rpc-provider.ts#L334
 * TODO(https://github.com/ethers-io/ethers.js/pull/3667): Remove if upstreamed.
 */
async function signTypedData(
  signer: JsonRpcSigner,
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  // Use Record<string, any> for the value to match the JsonRpcSigner._signTypedData signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>
) {
  // Populate any ENS names (in-place)
  const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
    return signer.provider.resolveName(name) as Promise<string>
  })

  const address = await signer.getAddress()

  /*
   * Some wallets require special-casing:
   *
   * - MetaMask and Frame (and likely others) implement signTypedData following the original blog post [1].
   *   EIP-712 flips the parameter ordering [2], and we prefer the documented ordering, because...
   * - SafePal Mobile hangs (without rejecting) if passed the old parameter ordering. SafePal also hangs on v4.
   *
   * For a good overview of signing data (and before modifying this code 🙏), see MetaMask's documentation [3].
   *
   * [1]: Blog post introducing signTypedData: https://medium.com/metamask/scaling-web3-with-signtypeddata-91d6efc8b290
   * [2]: signTypedData parameters: https://eips.ethereum.org/EIPS/eip-712#parameters
   * [3]: MetaMask's reference on "Signing Data": https://docs.metamask.io/guide/signing-data.html#signing-data
   */
  try {
    // MetaMask is known to implement v4. Other wallets must use signTypedData, because SafePal hangs on v4.
    // However, MetaMask still falls back to sign in case a wallet impersonating MetaMask does not implement v4.
    if (!signer.provider.connection.url.match(/metamask/)) {
      try {
        return await signer.provider.send('eth_signTypedData', [
          address.toLowerCase(),
          JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value)),
        ])
      } catch (error) {
        // Frame supports v4 but does not self-identify like MetaMask, so it is special-cased to fall back to v4:
        if (typeof error.message === 'string' && error.message.match(/unknown account/i)) {
          console.warn('signTypedData: wallet expects historical parameter ordering, falling back to v4')
        } else {
          throw error
        }
      }
    }

    return await signer.provider.send('eth_signTypedData_v4', [
      address.toLowerCase(),
      JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value)),
    ])
  } catch (error) {
    if (typeof error.message === 'string' && error.message.match(/not (found|implemented)/i)) {
      console.warn('signTypedData: wallet does not implement EIP-712, falling back to sign')
      const hash = _TypedDataEncoder.hash(populated.domain, types, populated.value)
      return await signer.provider.send('eth_sign', [address, hash])
    }
    throw error
  }
}
