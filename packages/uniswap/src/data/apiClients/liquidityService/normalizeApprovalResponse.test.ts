import { _TypedDataEncoder } from '@ethersproject/hash'
import { ChainId, Domain, PermitBatchData } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { backfillPermitDomainChainId } from 'uniswap/src/data/apiClients/liquidityService/normalizeApprovalResponse'
import { describe, expect, it } from 'vitest'

const ELYSIUM = 99901 as ChainId

function permitWithDomainChainId(chainId: ChainId | undefined): PermitBatchData {
  return new PermitBatchData({ domain: new Domain({ name: 'Permit2', chainId }) })
}

describe('backfillPermitDomainChainId', () => {
  it('fills a missing permit domain chainId from the request without mutating the response', () => {
    const permit = permitWithDomainChainId(undefined)

    expect(backfillPermitDomainChainId(permit, ELYSIUM)?.domain?.chainId).toBe(ELYSIUM)
    expect(permit.domain?.chainId).toBeUndefined()
  })

  it('builds a permit domain the ethers typed-data encoder can hash', () => {
    const domain = backfillPermitDomainChainId(permitWithDomainChainId(undefined), ELYSIUM)?.domain

    expect(() => _TypedDataEncoder.hashDomain(domain ?? {})).not.toThrow()
  })

  it('keeps the permit domain chainId the backend sent', () => {
    const permit = permitWithDomainChainId(ChainId.MAINNET)

    expect(backfillPermitDomainChainId(permit, ELYSIUM)).toBe(permit)
  })

  it('leaves the permit untouched without a request chainId or domain', () => {
    const permit = permitWithDomainChainId(undefined)

    expect(backfillPermitDomainChainId(permit, undefined)).toBe(permit)
    expect(backfillPermitDomainChainId(undefined, ELYSIUM)).toBeUndefined()
  })
})
