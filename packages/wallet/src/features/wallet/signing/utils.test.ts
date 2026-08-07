import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { prepareTypedDataForSigning } from 'wallet/src/features/wallet/signing/utils'

function typedData(domainChainId: unknown): string {
  return JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      PermitSingle: [{ name: 'spender', type: 'address' }],
    },
    domain: {
      name: 'Permit2',
      ...(domainChainId === undefined ? {} : { chainId: domainChainId }),
      verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    },
    primaryType: 'PermitSingle',
    message: { spender: '0x1111111111111111111111111111111111111111' },
  })
}

describe(prepareTypedDataForSigning, () => {
  it('returns parsed data when the domain chain matches the authorized chain', () => {
    const result = prepareTypedDataForSigning({
      message: typedData(UniverseChainId.Mainnet),
      expectedChainId: UniverseChainId.Mainnet,
    })

    expect(result.domain.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.message).toEqual({ spender: '0x1111111111111111111111111111111111111111' })
  })

  it('strips EIP712Domain so ethers can infer the primary type', () => {
    const result = prepareTypedDataForSigning({
      message: typedData(UniverseChainId.Mainnet),
      expectedChainId: UniverseChainId.Mainnet,
    })

    expect(result.types['EIP712Domain']).toBeUndefined()
    expect(result.types['PermitSingle']).toBeDefined()
  })

  // Finding 746: a Mainnet-authorized session must not produce an Optimism-valid signature.
  it('throws when the domain chain differs from the authorized chain', () => {
    expect(() =>
      prepareTypedDataForSigning({
        message: typedData(UniverseChainId.Optimism),
        expectedChainId: UniverseChainId.Mainnet,
      }),
    ).toThrow(/does not match the authorized chain/)
  })

  it('accepts hex string chain ids that match', () => {
    const result = prepareTypedDataForSigning({
      message: typedData('0x1'),
      expectedChainId: UniverseChainId.Mainnet,
    })

    expect(result.domain.chainId).toBe('0x1')
  })

  it('throws on hex string chain ids that do not match', () => {
    expect(() =>
      prepareTypedDataForSigning({
        message: typedData('0xa'),
        expectedChainId: UniverseChainId.Mainnet,
      }),
    ).toThrow(/does not match the authorized chain/)
  })

  it('accepts decimal string chain ids that match', () => {
    expect(
      prepareTypedDataForSigning({
        message: typedData('1'),
        expectedChainId: UniverseChainId.Mainnet,
      }).domain.chainId,
    ).toBe('1')
  })

  it('throws when the domain has no chainId at all', () => {
    expect(() =>
      prepareTypedDataForSigning({
        message: typedData(undefined),
        expectedChainId: UniverseChainId.Mainnet,
      }),
    ).toThrow(/does not match the authorized chain/)
  })

  it('throws when the domain chain is not a supported chain', () => {
    expect(() =>
      prepareTypedDataForSigning({
        message: typedData(999999999),
        expectedChainId: UniverseChainId.Mainnet,
      }),
    ).toThrow(/does not match the authorized chain/)
  })

  it('throws when the domain chain is unparseable', () => {
    expect(() =>
      prepareTypedDataForSigning({
        message: typedData('not-a-chain'),
        expectedChainId: UniverseChainId.Mainnet,
      }),
    ).toThrow(/does not match the authorized chain/)
  })
})
