import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { describe, expect, it, vi } from 'vitest'
import { prepareEthersSignTypedData, sendEthersSignTypedData } from './ethers'

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

// A minimal fake matching the slice of `JsonRpcSigner` our impl actually
// touches: `getAddress`, `provider.resolveName`, `provider.send`. Tests
// pass the address the signer reports and the address the resolver returns
// for any ENS-shaped value; the no-ENS paths never invoke the resolver, so
// the default value doesn't matter for them.
function makeSigner(address: string = wallet, resolvedName: string | null = null) {
  const getAddress = vi.fn().mockResolvedValue(address)
  const resolveName = vi.fn().mockResolvedValue(resolvedName)
  const send = vi.fn()
  const signer = {
    getAddress,
    provider: { resolveName, send },
  } as unknown as JsonRpcSigner
  return { signer, getAddress, send }
}

describe('prepareEthersSignTypedData', () => {
  it('produces the canonical EIP-712 payload', async () => {
    const { signer } = makeSigner()
    const prepared = await prepareEthersSignTypedData({ signer, domain, types, value })
    expect(JSON.parse(prepared.message)).toEqual(expect.objectContaining({ domain, message: value }))
  })

  it('lowercases the signer address', async () => {
    const { signer } = makeSigner('0xCD2A3d9F938E13CD947Ec05Abc7FE734DF8DD826')
    const prepared = await prepareEthersSignTypedData({ signer, domain, types, value })
    expect(prepared.address).toBe(wallet)
  })

  it('substitutes ENS-shaped `address` field values with their resolved addresses in the output', async () => {
    const ensName = 'cow.eth'
    const resolvedAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const { signer } = makeSigner(wallet, resolvedAddress)

    const prepared = await prepareEthersSignTypedData({
      signer,
      domain,
      types,
      value: { ...value, from: { name: 'Cow', wallet: ensName } },
    })

    expect(JSON.parse(prepared.message).message.from.wallet).toBe(resolvedAddress)
    expect((prepared.populatedValue as typeof value).from.wallet).toBe(resolvedAddress)
  })

  it('accepts the Liquidity API `{ fields: [...] }` types format', async () => {
    const { signer } = makeSigner()
    const liquidityTypes = {
      Person: { fields: types.Person },
      Mail: { fields: types.Mail },
    }
    const prepared = await prepareEthersSignTypedData({ signer, domain, types: liquidityTypes, value })
    expect(JSON.parse(prepared.message)).toEqual(expect.objectContaining({ domain, message: value }))
  })

  it('returns the populated domain/types/value needed for the fallback hash', async () => {
    const { signer } = makeSigner()
    const prepared = await prepareEthersSignTypedData({ signer, domain, types, value })
    expect(prepared.populatedDomain).toEqual(domain)
    expect(prepared.populatedValue).toEqual(value)
    expect(prepared.normalizedTypes).toEqual(types)
  })
})

describe('sendEthersSignTypedData', () => {
  // A real prepared bundle so the fallback path can compute the expected
  // EIP-712 hash from `populatedDomain` / `normalizedTypes` / `populatedValue`.
  const prepared = {
    address: wallet,
    message: JSON.stringify({
      domain,
      types: { EIP712Domain: [], ...types },
      primaryType: 'Mail',
      message: value,
    }),
    populatedDomain: domain,
    normalizedTypes: types,
    populatedValue: value,
  }

  it('sends with the chosen method', async () => {
    const { signer, send } = makeSigner()
    send.mockResolvedValue('0xsig')

    await sendEthersSignTypedData({ signer, prepared, method: 'eth_signTypedData_v4' })

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('eth_signTypedData_v4', [prepared.address, prepared.message])
  })

  it('honors the explicit eth_signTypedData method', async () => {
    const { signer, send } = makeSigner()
    send.mockResolvedValue('0xsig')

    await sendEthersSignTypedData({ signer, prepared, method: 'eth_signTypedData' })

    expect(send).toHaveBeenCalledWith('eth_signTypedData', [prepared.address, prepared.message])
  })

  it.each([
    'method not found',
    'method not implemented',
    'TrustWalletConnect.WCError error 1',
    'Missing or invalid params',
  ])('falls back to eth_sign with the EIP-712 hash on "%s"', async (errorMessage) => {
    const { signer, send } = makeSigner()
    send.mockRejectedValueOnce({ message: errorMessage }).mockResolvedValueOnce('0xsig')

    await sendEthersSignTypedData({ signer, prepared, method: 'eth_signTypedData_v4' })

    expect(send).toHaveBeenCalledTimes(2)
    expect(send).toHaveBeenLastCalledWith('eth_sign', [wallet, expectedEip712Hash])
  })

  it('invokes onFallback with the original error before degrading to eth_sign', async () => {
    const { signer, send } = makeSigner()
    const fallbackError = { message: 'method not found' }
    const onFallback = vi.fn()
    send.mockRejectedValueOnce(fallbackError).mockResolvedValueOnce('0xsig')

    await sendEthersSignTypedData({ signer, prepared, method: 'eth_signTypedData_v4', onFallback })

    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(onFallback).toHaveBeenCalledWith(fallbackError)
  })

  it('re-throws errors that do not match the fallback patterns', async () => {
    const { signer, send } = makeSigner()
    send.mockRejectedValue(new Error('User rejected'))

    await expect(sendEthersSignTypedData({ signer, prepared, method: 'eth_signTypedData_v4' })).rejects.toThrow(
      'User rejected',
    )
  })

  it('does not invoke onFallback when the error is rethrown', async () => {
    const { signer, send } = makeSigner()
    const onFallback = vi.fn()
    send.mockRejectedValue(new Error('User rejected'))

    await expect(
      sendEthersSignTypedData({ signer, prepared, method: 'eth_signTypedData_v4', onFallback }),
    ).rejects.toThrow()
    expect(onFallback).not.toHaveBeenCalled()
  })
})
