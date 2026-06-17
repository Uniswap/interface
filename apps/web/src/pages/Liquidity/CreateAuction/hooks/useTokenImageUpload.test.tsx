import { Code, ConnectError } from '@connectrpc/connect'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { VerifyTokenFactoryImageResponse_Status } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useTokenImageUpload,
  VERIFY_MAX_ATTEMPTS,
  VERIFY_RETRY_DELAY_MS,
} from '~/pages/Liquidity/CreateAuction/hooks/useTokenImageUpload'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import {
  type CreateAuctionStore,
  createCreateAuctionStore,
} from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'

const { mockSelect, mockPresign, mockUpload, mockVerify } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockPresign: vi.fn(),
  mockUpload: vi.fn(),
  mockVerify: vi.fn(),
}))

vi.mock('~/pages/Liquidity/CreateAuction/utils/selectTokenImageFile', () => ({
  selectTokenImageFile: () => mockSelect(),
}))
vi.mock('~/pages/Liquidity/CreateAuction/utils/uploadImageToPinata', () => ({
  uploadImageToPinata: (...args: unknown[]) => mockUpload(...args),
}))
vi.mock('uniswap/src/data/rest/tokenFactoryImage', () => ({
  createTokenFactoryPresignedUrl: (...args: unknown[]) => mockPresign(...args),
  verifyTokenFactoryImage: (...args: unknown[]) => mockVerify(...args),
}))

const file = new File(['x'], 'logo.png', { type: 'image/png' })
const approved = { status: VerifyTokenFactoryImageResponse_Status.APPROVED, blockedReason: '' }

function TestProviders({ children, store }: { children: ReactNode; store: CreateAuctionStore }): JSX.Element {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <CreateAuctionStoreContext.Provider value={store}>{children}</CreateAuctionStoreContext.Provider>
    </QueryClientProvider>
  )
}

function renderUploadHook(store: CreateAuctionStore) {
  return renderHook(() => useTokenImageUpload(), {
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <TestProviders store={store}>{children}</TestProviders>
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) {
        queueMicrotask(() => {
          this.onload?.()
        })
      }
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useTokenImageUpload', () => {
  it('stores ipfs://<cid> and clears the blob preview after the gateway image loads', async () => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    mockUpload.mockResolvedValue('bafkreicid')
    mockVerify.mockResolvedValue(approved)

    const { result } = renderUploadHook(store)
    act(() => result.current.start())

    await waitFor(() => expect(result.current.status).toBe('success'))
    const tf = store.getState().tokenForm
    expect(tf.mode).toBe(TokenMode.CREATE_NEW)
    if (tf.mode === TokenMode.CREATE_NEW) {
      expect(tf.imageUrl).toBe('ipfs://bafkreicid')
    }
    await waitFor(() => expect(result.current.previewUri).toBeUndefined())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(mockPresign).toHaveBeenCalledWith('logo.png')
  })

  it('surfaces a generic rejection and stores nothing when blocked', async () => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    mockUpload.mockResolvedValue('bafkreicid')
    mockVerify.mockResolvedValue({ status: VerifyTokenFactoryImageResponse_Status.BLOCKED, blockedReason: 'violence' })

    const { result } = renderUploadHook(store)
    act(() => result.current.start())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorReason).toBe('rejected')
    const tf = store.getState().tokenForm
    expect(tf.mode).toBe(TokenMode.CREATE_NEW)
    if (tf.mode === TokenMode.CREATE_NEW) {
      expect(tf.imageUrl).toBe('')
    }
  })

  it.each([
    ['invalid-type', 'invalid-type'],
    ['too-large', 'too-large'],
  ] as const)('reports %s without any network call', async (kind, expectedReason) => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind })

    const { result } = renderUploadHook(store)
    act(() => result.current.start())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorReason).toBe(expectedReason)
    expect(mockPresign).not.toHaveBeenCalled()
  })

  it('clears the prior preview when a later pick fails validation', async () => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValueOnce({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    mockUpload.mockResolvedValue('bafkreicid')
    mockVerify.mockResolvedValueOnce({
      status: VerifyTokenFactoryImageResponse_Status.BLOCKED,
      blockedReason: 'violence',
    })

    const { result } = renderUploadHook(store)
    act(() => result.current.start())
    await waitFor(() => expect(result.current.errorReason).toBe('rejected'))
    expect(result.current.previewUri).toBeUndefined()

    mockSelect.mockResolvedValueOnce({ kind: 'invalid-type' })
    act(() => result.current.start())

    await waitFor(() => expect(result.current.errorReason).toBe('invalid-type'))
    expect(result.current.previewUri).toBeUndefined()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('stays idle when the picker is cancelled', async () => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'cancelled' })

    const { result } = renderUploadHook(store)
    await act(async () => {
      result.current.start()
      await Promise.resolve()
    })

    expect(result.current.status).toBe('idle')
    expect(mockPresign).not.toHaveBeenCalled()
  })

  it('retries verify on the transient scan error, then succeeds', async () => {
    vi.useFakeTimers()
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    mockUpload.mockResolvedValue('bafkreicid')
    mockVerify
      .mockRejectedValueOnce(new ConnectError('Image scan temporarily unavailable', Code.Unavailable))
      .mockResolvedValueOnce(approved)

    const { result } = renderUploadHook(store)
    await act(async () => {
      result.current.start()
      await vi.advanceTimersByTimeAsync(VERIFY_RETRY_DELAY_MS + 100)
    })

    expect(mockVerify).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('success')
    const tf = store.getState().tokenForm
    expect(tf.mode).toBe(TokenMode.CREATE_NEW)
    if (tf.mode === TokenMode.CREATE_NEW) {
      expect(tf.imageUrl).toBe('ipfs://bafkreicid')
    }
  })

  it('attaches the image without an error when verification stays unavailable', async () => {
    vi.useFakeTimers()
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    mockUpload.mockResolvedValue('bafkreicid')
    mockVerify.mockRejectedValue(new ConnectError('Image scan temporarily unavailable', Code.Unavailable))

    const { result } = renderUploadHook(store)
    await act(async () => {
      result.current.start()
      await vi.advanceTimersByTimeAsync(VERIFY_RETRY_DELAY_MS * VERIFY_MAX_ATTEMPTS)
    })

    expect(mockVerify).toHaveBeenCalledTimes(VERIFY_MAX_ATTEMPTS)
    expect(result.current.status).toBe('success')
    expect(result.current.errorReason).toBeUndefined()
    const tf = store.getState().tokenForm
    expect(tf.mode).toBe(TokenMode.CREATE_NEW)
    if (tf.mode === TokenMode.CREATE_NEW) {
      expect(tf.imageUrl).toBe('ipfs://bafkreicid')
    }
  })

  it('surfaces an upload failure so the user can retry, storing nothing', async () => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    mockUpload.mockRejectedValue(new Error('network down'))

    const { result } = renderUploadHook(store)
    act(() => result.current.start())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorReason).toBe('upload-failed')
    expect(mockVerify).not.toHaveBeenCalled()
    const tf = store.getState().tokenForm
    expect(tf.mode).toBe(TokenMode.CREATE_NEW)
    if (tf.mode === TokenMode.CREATE_NEW) {
      expect(tf.imageUrl).toBe('')
    }
  })

  it('still attaches the image when the form unmounts mid-upload', async () => {
    const store = createCreateAuctionStore()
    mockSelect.mockResolvedValue({ kind: 'selected', file })
    mockPresign.mockResolvedValue('https://signed')
    let resolveUpload!: (cid: string) => void
    mockUpload.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveUpload = resolve
      }),
    )
    mockVerify.mockResolvedValue(approved)

    const { result, unmount } = renderUploadHook(store)
    act(() => result.current.start())
    await waitFor(() => expect(mockUpload).toHaveBeenCalled())

    unmount()
    resolveUpload('bafkreicid')

    await waitFor(() => {
      const tf = store.getState().tokenForm
      return tf.mode === TokenMode.CREATE_NEW && tf.imageUrl === 'ipfs://bafkreicid'
    })
  })
})
