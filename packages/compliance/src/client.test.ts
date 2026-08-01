import { GatedFeature } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import {
  type ComplianceV2Client,
  fetchFeatureGatedToken,
  fetchGatedFeatures,
  screenAddress,
  setTokenAcknowledgement,
} from '@universe/compliance/src/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// With the client injected rather than built at module load, tests pass a fake
// `ComplianceV2Client` directly — no transport or singleton to stub. The real
// `TokenRef` constructor still runs, so we verify the wrappers build the correct
// request shape.
const featureGatedTokensMethod = vi.fn()
const setTokenAcknowledgementMethod = vi.fn()
const gatedFeaturesMethod = vi.fn()
const screenAddressMethod = vi.fn()

const client = {
  featureGatedTokens: featureGatedTokensMethod,
  setTokenAcknowledgement: setTokenAcknowledgementMethod,
  gatedFeatures: gatedFeaturesMethod,
  screenAddress: screenAddressMethod,
} as unknown as ComplianceV2Client

describe(fetchFeatureGatedToken, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests a TokenRef for the token and returns the first response token', async () => {
    const responseToken = { chainId: 1, address: '0xabc', reasons: [] }
    featureGatedTokensMethod.mockResolvedValue({ tokens: [responseToken] })

    const result = await fetchFeatureGatedToken(client, { chainId: 1, address: '0xabc' })

    expect(featureGatedTokensMethod).toHaveBeenCalledTimes(1)
    const request = featureGatedTokensMethod.mock.calls[0]?.[0]
    expect(request.tokens[0].chainId).toBe(1)
    expect(request.tokens[0].address).toBe('0xabc')
    expect(result).toBe(responseToken)
  })

  it('opts into non-blocking reasons so acknowledged tokens report ACKNOWLEDGED instead of being omitted', async () => {
    featureGatedTokensMethod.mockResolvedValue({ tokens: [] })

    await fetchFeatureGatedToken(client, { chainId: 1, address: '0xabc' })

    const request = featureGatedTokensMethod.mock.calls[0]?.[0]
    expect(request.includeNonBlockingReasons).toBe(true)
  })

  it('returns undefined when the response omits the token (clean token)', async () => {
    featureGatedTokensMethod.mockResolvedValue({ tokens: [] })

    expect(await fetchFeatureGatedToken(client, { chainId: 1, address: '0xabc' })).toBeUndefined()
  })
})

describe(setTokenAcknowledgement, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends a TokenRef for the given token', async () => {
    setTokenAcknowledgementMethod.mockResolvedValue({})

    await setTokenAcknowledgement(client, { chainId: 8453, address: '0xdef' })

    expect(setTokenAcknowledgementMethod).toHaveBeenCalledTimes(1)
    const request = setTokenAcknowledgementMethod.mock.calls[0]?.[0]
    expect(request.token.chainId).toBe(8453)
    expect(request.token.address).toBe('0xdef')
  })
})

describe(fetchGatedFeatures, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests with an empty filter so the response covers every blocked feature', async () => {
    gatedFeaturesMethod.mockResolvedValue({ features: [] })

    await fetchGatedFeatures(client)

    expect(gatedFeaturesMethod).toHaveBeenCalledTimes(1)
    expect(gatedFeaturesMethod).toHaveBeenCalledWith({})
  })

  it('returns the blocked features from the response', async () => {
    gatedFeaturesMethod.mockResolvedValue({
      features: [GatedFeature.TOKEN_LAUNCHER, GatedFeature.ISSUER_SPECIFIC_RWA],
    })

    const result = await fetchGatedFeatures(client)

    expect(result).toEqual([GatedFeature.TOKEN_LAUNCHER, GatedFeature.ISSUER_SPECIFIC_RWA])
  })

  it('returns an empty list when nothing is gated (fail-open for unauthenticated callers)', async () => {
    gatedFeaturesMethod.mockResolvedValue({ features: [] })

    expect(await fetchGatedFeatures(client)).toEqual([])
  })
})

describe(screenAddress, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the address and chain id and returns the block flag', async () => {
    screenAddressMethod.mockResolvedValue({ block: true })

    const result = await screenAddress(client, { address: '0xabc', chainId: 8453 })

    expect(screenAddressMethod).toHaveBeenCalledTimes(1)
    const request = screenAddressMethod.mock.calls[0]?.[0]
    expect(request.address).toBe('0xabc')
    expect(request.chainId).toBe(8453)
    expect(result).toBe(true)
  })

  it('omits chain id when not provided (routes to the default provider)', async () => {
    screenAddressMethod.mockResolvedValue({ block: false })

    await screenAddress(client, { address: '0xabc' })

    const request = screenAddressMethod.mock.calls[0]?.[0]
    expect(request.chainId).toBeUndefined()
  })

  it('returns false for a clean address', async () => {
    screenAddressMethod.mockResolvedValue({ block: false })

    expect(await screenAddress(client, { address: '0xabc' })).toBe(false)
  })
})
