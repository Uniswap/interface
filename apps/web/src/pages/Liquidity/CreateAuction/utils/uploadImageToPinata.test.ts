import { afterEach, describe, expect, it, vi } from 'vitest'
import { uploadImageToPinata } from '~/pages/Liquidity/CreateAuction/utils/uploadImageToPinata'

function mockFetch(response: { ok: boolean; status?: number; json?: () => Promise<unknown> }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: response.json ?? (() => Promise.resolve({})),
    }),
  )
}

const file = new File(['x'], 'logo.png', { type: 'image/png' })

describe('uploadImageToPinata', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs the file under the `file` field and returns the cid', async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ data: { cid: 'bafkreitest' } }) })

    const cid = await uploadImageToPinata('https://uploads.pinata.cloud/signed', file)

    expect(cid).toBe('bafkreitest')
    const [url, init] = vi.mocked(fetch).mock.calls[0]!
    expect(url).toBe('https://uploads.pinata.cloud/signed')
    expect(init?.method).toBe('POST')
    expect((init?.body as FormData).get('file')).toBe(file)
  })

  it('throws with the status when the upload is rejected', async () => {
    mockFetch({ ok: false, status: 413 })
    await expect(uploadImageToPinata('https://signed', file)).rejects.toThrow('status 413')
  })

  it('throws when the response is missing a cid', async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ data: {} }) })
    await expect(uploadImageToPinata('https://signed', file)).rejects.toThrow('did not include a CID')
  })
})
