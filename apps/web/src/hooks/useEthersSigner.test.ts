import { renderHook } from '@testing-library/react'
import { getConnectorClient } from '@wagmi/core'
import type { Connector } from 'wagmi'
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { useEthersSigner } from '~/hooks/useEthersSigner'

const mockUseConnectorClient = vi.fn()

vi.mock('wagmi', async () => ({
  ...(await vi.importActual('wagmi')),
  useConnectorClient: () => mockUseConnectorClient(),
}))

describe('useEthersSigner', () => {
  it('returns undefined when no client', () => {
    mockUseConnectorClient.mockReturnValue({ data: undefined })
    const { result } = renderHook(() => useEthersSigner())
    expect(result.current).toBeUndefined()
  })

  it('returns undefined for a mid-disconnect client with no account', async () => {
    const config = createConfig({ chains: [mainnet], transports: { [mainnet.id]: http() } })
    const disconnectingConnector = {
      uid: 'test-disconnecting',
      getAccounts: async () => [],
      getChainId: async () => mainnet.id,
      getProvider: async () => ({ request: async () => null }),
    } as unknown as Connector

    const client = await getConnectorClient(config, { connector: disconnectingConnector })
    expect(client.account).toBeUndefined()

    mockUseConnectorClient.mockReturnValue({ data: client })
    const { result } = renderHook(() => useEthersSigner())
    expect(result.current).toBeUndefined()
  })

  it('returns undefined for a client on an unsupported chain', async () => {
    const config = createConfig({ chains: [mainnet], transports: { [mainnet.id]: http() } })
    const unsupportedChainId = 999999
    const unsupportedChainConnector = {
      uid: 'test-unsupported-chain',
      getAccounts: async () => ['0x0000000000000000000000000000000000000001'],
      getChainId: async () => unsupportedChainId,
      getProvider: async () => ({ request: async () => null }),
    } as unknown as Connector

    const client = await getConnectorClient(config, {
      chainId: unsupportedChainId as never,
      connector: unsupportedChainConnector,
    })
    expect(client.chain).toBeUndefined()

    mockUseConnectorClient.mockReturnValue({ data: client })
    const { result } = renderHook(() => useEthersSigner())
    expect(result.current).toBeUndefined()
  })
})
