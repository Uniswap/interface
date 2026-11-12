import { QueryClient } from '@tanstack/react-query'
import {
  GetTokenMultiChainRequest,
  GetTokenMultiChainResponse,
  GetTokensMultiChainRequest,
  GetTokensMultiChainResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { AppId, BaseConfigSchema, Environment, getConfig } from '@universe/config'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import {
  getGetTokenMultiChainQueryOptions,
  getGetTokensMultiChainQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenMultiChain: vi.fn(), getTokensMultiChain: vi.fn() },
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  getFeatureFlag: vi.fn(),
}))

vi.mock('@universe/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/config')>()
  return {
    ...actual,
    getConfig: vi.fn(() =>
      actual.BaseConfigSchema.parse({ appId: actual.AppId.Web, environment: actual.Environment.Development }),
    ),
  }
})

const token = { chainId: UniverseChainId.Mainnet, address: '0xabc' }
const singleParams = { identifier: { case: 'token' as const, value: token } }
const batchParams = { identifier: { case: 'tokens' as const, value: { tokens: [token] } } }
const mockClient = vi.mocked(dataApiServiceClientV2)

describe.each([AppId.Web, AppId.Mobile, AppId.Extension])('multichain metadata scope on %s', (appId) => {
  const queryClient = new QueryClient()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getConfig).mockReturnValue(BaseConfigSchema.parse({ appId, environment: Environment.Development }))
    vi.mocked(getFeatureFlag).mockReturnValue(false)
    mockClient.getTokenMultiChain.mockResolvedValue(new GetTokenMultiChainResponse())
    mockClient.getTokensMultiChain.mockResolvedValue(new GetTokensMultiChainResponse())
  })

  afterEach(() => queryClient.clear())

  it.each([false, true])('scopes a singular request with Elysium enabled=%s', async (elysiumEnabled) => {
    vi.mocked(getFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.Elysium && elysiumEnabled)
    const options = getGetTokenMultiChainQueryOptions({ params: singleParams })

    await queryClient.fetchQuery(options)

    const params = options.queryKey[2]
    expect(params?.chainIds).toEqual(expect.arrayContaining([UniverseChainId.Mainnet, UniverseChainId.Sepolia]))
    expect(params?.chainIds?.includes(UniverseChainId.Elysium)).toBe(elysiumEnabled)
    expect(params?.chainIds?.includes(UniverseChainId.Solana)).toBe(appId === AppId.Web)
    expect(mockClient.getTokenMultiChain).toHaveBeenCalledWith(params)
    expect(params?.identifier).toEqual(singleParams.identifier)
    const message = new GetTokenMultiChainRequest(params)
    expect(message.toJson()).toMatchObject({ chainIds: params?.chainIds })
    expect(GetTokenMultiChainRequest.fromBinary(message.toBinary()).chainIds).toEqual(params?.chainIds)
  })

  it.each([false, true])('scopes a batch request with Elysium enabled=%s', async (elysiumEnabled) => {
    vi.mocked(getFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.Elysium && elysiumEnabled)
    const options = getGetTokensMultiChainQueryOptions({ params: batchParams })

    await queryClient.fetchQuery(options)

    const params = options.queryKey[2]
    expect(params?.chainIds).toEqual(expect.arrayContaining([UniverseChainId.Mainnet, UniverseChainId.Sepolia]))
    expect(params?.chainIds?.includes(UniverseChainId.Elysium)).toBe(elysiumEnabled)
    expect(params?.chainIds?.includes(UniverseChainId.Solana)).toBe(appId === AppId.Web)
    expect(mockClient.getTokensMultiChain).toHaveBeenCalledWith(params)
    expect(params?.identifier).toEqual(batchParams.identifier)
    const message = new GetTokensMultiChainRequest(params)
    expect(message.toJson()).toMatchObject({ chainIds: params?.chainIds })
    expect(GetTokensMultiChainRequest.fromBinary(message.toBinary()).chainIds).toEqual(params?.chainIds)
  })

  it('changes both query keys when the rollout flag changes', () => {
    const singleKey = getGetTokenMultiChainQueryOptions({ params: singleParams }).queryKey
    const batchKey = getGetTokensMultiChainQueryOptions({ params: batchParams }).queryKey

    vi.mocked(getFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.Elysium)

    expect(getGetTokenMultiChainQueryOptions({ params: singleParams }).queryKey).not.toEqual(singleKey)
    expect(getGetTokensMultiChainQueryOptions({ params: batchParams }).queryKey).not.toEqual(batchKey)
  })

  it('keeps requests without params disabled', () => {
    for (const options of [getGetTokenMultiChainQueryOptions({}), getGetTokensMultiChainQueryOptions({})]) {
      expect(options.enabled).toBe(false)
      expect(options.queryKey[2]).toBeUndefined()
    }
  })
})
