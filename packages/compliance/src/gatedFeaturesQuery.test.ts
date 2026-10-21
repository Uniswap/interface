import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { GatedFeature } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import type { ComplianceV2Client } from '@universe/compliance/src/client'
import {
  fetchIsFeatureGated,
  gatedFeaturesQueryOptions,
  refetchGatedFeatures,
} from '@universe/compliance/src/gatedFeaturesQuery'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const gatedFeatures = vi.fn()
const client = { gatedFeatures } as unknown as ComplianceV2Client

describe(gatedFeaturesQueryOptions, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not refetch a fresh cached region result by default', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const options = gatedFeaturesQueryOptions(client)
    queryClient.setQueryData(options.queryKey, [])
    const observer = new QueryObserver(queryClient, options)

    const unsubscribe = observer.subscribe(() => undefined)
    await Promise.resolve()

    expect(gatedFeatures).not.toHaveBeenCalled()
    unsubscribe()
  })
})

describe(refetchGatedFeatures, () => {
  it('refetches only active observers for the gated-features query', async () => {
    const queryClient = new QueryClient()
    const refetchQueries = vi.spyOn(queryClient, 'refetchQueries').mockResolvedValue(undefined)

    await refetchGatedFeatures(queryClient)

    expect(refetchQueries).toHaveBeenCalledWith({
      queryKey: gatedFeaturesQueryOptions(client).queryKey,
      type: 'active',
    })
  })
})

describe(fetchIsFeatureGated, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers from a fresh cache entry without a request', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(gatedFeaturesQueryOptions(client).queryKey, [GatedFeature.FIAT_ONRAMP])

    await expect(fetchIsFeatureGated(GatedFeature.FIAT_ONRAMP, { queryClient, client })).resolves.toBe(true)
    await expect(fetchIsFeatureGated(GatedFeature.FIAT_OFFRAMP, { queryClient, client })).resolves.toBe(false)
    expect(gatedFeatures).not.toHaveBeenCalled()
  })

  it('answers from a stale cache entry and refetches in the background', async () => {
    gatedFeatures.mockResolvedValue({ features: [] })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(gatedFeaturesQueryOptions(client).queryKey, [GatedFeature.FIAT_ONRAMP], {
      updatedAt: Date.now() - 10 * ONE_MINUTE_MS,
    })

    await expect(fetchIsFeatureGated(GatedFeature.FIAT_ONRAMP, { queryClient, client })).resolves.toBe(true)
    expect(gatedFeatures).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(queryClient.getQueryData(gatedFeaturesQueryOptions(client).queryKey)).toEqual([]))
  })

  it('fetches on a cache miss', async () => {
    gatedFeatures.mockResolvedValue({ features: [GatedFeature.FIAT_OFFRAMP] })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    await expect(fetchIsFeatureGated(GatedFeature.FIAT_OFFRAMP, { queryClient, client })).resolves.toBe(true)
    expect(gatedFeatures).toHaveBeenCalledTimes(1)
  })

  it('fails open when the request rejects', async () => {
    gatedFeatures.mockRejectedValue(new Error('unavailable'))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    await expect(fetchIsFeatureGated(GatedFeature.FIAT_ONRAMP, { queryClient, client })).resolves.toBe(false)
  })
})
