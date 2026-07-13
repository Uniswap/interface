import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { ensure0xHex } from '@universe/encoding'
import type { WalletClient } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import {
  type PreparedViemSignTypedData,
  adaptEthersSignerToWalletClient,
  prepareViemSignTypedData,
  sendViemSignTypedData,
} from './viem'

// EIP-712 fixture from the spec example.
const wallet = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826'
const domain: TypedDataDomain = {
  name: 'Ether Mail',
  version: '1',
  chainId: '1',
  verifyingContract: '0xcccccccccccccccccccccccccccccccccccccccc',
}
const types: Record<string, TypedDataField[]> = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' },
  ],
  Mail: [
    { name: 'from', type: 'Person' },
    { name: 'to', type: 'Person' },
    { name: 'contents', type: 'string' },
  ],
}
const value = {
  from: { name: 'Cow', wallet },
  to: { name: 'Bob', wallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
  contents: 'Hello, Bob!',
}
const expectedEip712Hash = '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2'

/**
 * Mock matching a slice of `WalletClient`
 */
function makeWalletClient(address: string = wallet) {
  const request = vi.fn()
  const walletClient = {
    account: { address: ensure0xHex(address), type: 'json-rpc' as const },
    request,
  } as unknown as WalletClient
  return { walletClient, request }
}

describe('prepareViemSignTypedData', () => {
  it('produces the canonical EIP-712 payload', async () => {
    const { walletClient } = makeWalletClient()
    const prepared = await prepareViemSignTypedData({ walletClient, domain, types, value })
    expect(JSON.parse(prepared.message)).toEqual(expect.objectContaining({ domain, message: value }))
  })

  it('lowercases the wallet client address', async () => {
    const { walletClient } = makeWalletClient('0xCD2A3d9F938E13CD947Ec05Abc7FE734DF8DD826')
    const prepared = await prepareViemSignTypedData({ walletClient, domain, types, value })
    expect(prepared.address).toBe(wallet)
  })

  it('throws when the WalletClient has no account configured', async () => {
    const walletClient = { request: vi.fn() } as unknown as WalletClient
    await expect(prepareViemSignTypedData({ walletClient, domain, types, value })).rejects.toThrow(
      'WalletClient has no account configured',
    )
  })

  it('substitutes ENS-shaped `address` field values with the resolver output', async () => {
    const { walletClient } = makeWalletClient()
    const ensName = 'cow.eth'
    const resolvedAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

    const prepared = await prepareViemSignTypedData({
      walletClient,
      domain,
      types,
      value: { ...value, from: { name: 'Cow', wallet: ensName } },
      resolveName: async () => resolvedAddress,
    })

    expect(JSON.parse(prepared.message).message.from.wallet).toBe(resolvedAddress)
    expect((prepared.populatedValue as typeof value).from.wallet).toBe(resolvedAddress)
  })

  it('resolves ENS-shaped entries inside `address[]` fields while passing 0x entries through', async () => {
    const { walletClient } = makeWalletClient()
    const ensName = 'cow.eth'
    const resolvedAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const literalAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

    const recipientTypes: Record<string, TypedDataField[]> = {
      Recipients: [{ name: 'to', type: 'address[]' }],
    }
    const resolveName = vi.fn(async (name: string) => {
      expect(name).toBe(ensName)
      return resolvedAddress
    })

    const prepared = await prepareViemSignTypedData({
      walletClient,
      domain,
      types: recipientTypes,
      value: { to: [ensName, literalAddress] },
      resolveName,
    })

    expect((prepared.populatedValue as { to: string[] }).to).toEqual([resolvedAddress, literalAddress])
    expect(JSON.parse(prepared.message).message.to).toEqual([resolvedAddress, literalAddress])
  })

  it('passes ENS-shaped values through unchanged when no resolveName is supplied', async () => {
    const { walletClient } = makeWalletClient()
    const ensName = 'cow.eth'

    const prepared = await prepareViemSignTypedData({
      walletClient,
      domain,
      types,
      value: { ...value, from: { name: 'Cow', wallet: ensName } },
    })

    expect((prepared.populatedValue as typeof value).from.wallet).toBe(ensName)
  })

  it('accepts the Liquidity API `{ fields: [...] }` types format', async () => {
    const { walletClient } = makeWalletClient()
    const liquidityTypes = {
      Person: { fields: types.Person },
      Mail: { fields: types.Mail },
    }
    const prepared = await prepareViemSignTypedData({ walletClient, domain, types: liquidityTypes, value })
    expect(JSON.parse(prepared.message)).toEqual(expect.objectContaining({ domain, message: value }))
  })

  it('returns the viem domain/types/primaryType/value needed for the fallback hash', async () => {
    const { walletClient } = makeWalletClient()
    const prepared = await prepareViemSignTypedData({ walletClient, domain, types, value })
    expect(prepared.viemDomain.chainId).toBe(1n)
    // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid
    expect(prepared.viemDomain.verifyingContract?.toLowerCase()).toBe(domain.verifyingContract)
    expect(prepared.normalizedTypes).toEqual(types)
    expect(prepared.primaryType).toBe('Mail')
    expect(prepared.populatedValue).toEqual(value)
  })
})

describe('sendViemSignTypedData', () => {
  // A real prepared bundle so the fallback path can compute the expected
  // EIP-712 hash from `viemDomain` / `normalizedTypes` / `populatedValue`.
  const prepared: PreparedViemSignTypedData = {
    address: wallet,
    message: JSON.stringify({
      domain,
      types: { EIP712Domain: [], ...types },
      primaryType: 'Mail',
      message: value,
    }),
    viemDomain: {
      name: 'Ether Mail',
      version: '1',
      chainId: 1n,
      verifyingContract: ensure0xHex('0xcccccccccccccccccccccccccccccccccccccccc'),
    },
    normalizedTypes: types,
    primaryType: 'Mail',
    populatedValue: value,
  }

  it('sends with the chosen method', async () => {
    const { walletClient, request } = makeWalletClient()
    request.mockResolvedValue('0xsig')

    await sendViemSignTypedData({ walletClient, prepared, method: 'eth_signTypedData_v4' })

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith({
      method: 'eth_signTypedData_v4',
      params: [prepared.address, prepared.message],
    })
  })

  it('honors the explicit eth_signTypedData method', async () => {
    const { walletClient, request } = makeWalletClient()
    request.mockResolvedValue('0xsig')

    await sendViemSignTypedData({ walletClient, prepared, method: 'eth_signTypedData' })

    expect(request).toHaveBeenCalledWith({
      method: 'eth_signTypedData',
      params: [prepared.address, prepared.message],
    })
  })

  it.each([
    'method not found',
    'method not implemented',
    'TrustWalletConnect.WCError error 1',
    'Missing or invalid params',
  ])('falls back to eth_sign with the EIP-712 hash on "%s"', async (errorMessage) => {
    const { walletClient, request } = makeWalletClient()
    request.mockRejectedValueOnce({ message: errorMessage }).mockResolvedValueOnce('0xsig')

    await sendViemSignTypedData({ walletClient, prepared, method: 'eth_signTypedData_v4' })

    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenLastCalledWith({
      method: 'eth_sign',
      params: [wallet, expectedEip712Hash],
    })
  })

  it('invokes onFallback with the original error before degrading to eth_sign', async () => {
    const { walletClient, request } = makeWalletClient()
    const fallbackError = { message: 'method not found' }
    const onFallback = vi.fn()
    request.mockRejectedValueOnce(fallbackError).mockResolvedValueOnce('0xsig')

    await sendViemSignTypedData({ walletClient, prepared, method: 'eth_signTypedData_v4', onFallback })

    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(onFallback).toHaveBeenCalledWith(fallbackError)
  })

  it('re-throws errors that do not match the fallback patterns', async () => {
    const { walletClient, request } = makeWalletClient()
    request.mockRejectedValue(new Error('User rejected'))

    await expect(sendViemSignTypedData({ walletClient, prepared, method: 'eth_signTypedData_v4' })).rejects.toThrow(
      'User rejected',
    )
  })

  it('does not invoke onFallback when the error is rethrown', async () => {
    const { walletClient, request } = makeWalletClient()
    const onFallback = vi.fn()
    request.mockRejectedValue(new Error('User rejected'))

    await expect(
      sendViemSignTypedData({ walletClient, prepared, method: 'eth_signTypedData_v4', onFallback }),
    ).rejects.toThrow()
    expect(onFallback).not.toHaveBeenCalled()
  })
})

describe('adaptEthersSignerToWalletClient', () => {
  // Same minimal-fake pattern as ethers.test.ts.
  function makeSigner(address: string = wallet) {
    const getAddress = vi.fn().mockResolvedValue(address)
    const send = vi.fn()
    const signer = {
      getAddress,
      provider: { send },
    } as unknown as JsonRpcSigner
    return { signer, getAddress, send }
  }

  it("uses the signer's lowercased address as the WalletClient account", async () => {
    const { signer } = makeSigner('0xCD2A3d9F938E13CD947Ec05Abc7FE734DF8DD826')
    const walletClient = await adaptEthersSignerToWalletClient(signer)
    expect(walletClient.account?.address).toBe(wallet)
  })

  it('proxies WalletClient.request through signer.provider.send', async () => {
    const { signer, send } = makeSigner()
    send.mockResolvedValue('0xresult')
    const walletClient = await adaptEthersSignerToWalletClient(signer)

    const result = await walletClient.request({
      method: 'eth_chainId',
      params: [],
    } as Parameters<WalletClient['request']>[0])

    expect(send).toHaveBeenCalledWith('eth_chainId', [])
    expect(result).toBe('0xresult')
  })

  it('forwards the original method and params verbatim', async () => {
    const { signer, send } = makeSigner()
    send.mockResolvedValue('0xsig')
    const walletClient = await adaptEthersSignerToWalletClient(signer)

    await walletClient.request({
      method: 'eth_signTypedData_v4',
      params: [wallet, '{"some":"payload"}'],
    } as Parameters<WalletClient['request']>[0])

    expect(send).toHaveBeenCalledWith('eth_signTypedData_v4', [wallet, '{"some":"payload"}'])
  })
})
