import './fetch'

import { errorOn5xx, wrap } from '..'

jest.mock('..')

describe('fetch', () => {
  it('wraps calls to window.fetch', async () => {
    const url = 'https://example.com'
    const spy = wrap as unknown as jest.SpiedFunction<(...args: any[]) => Promise<Response>>
    const response = new Response()
    spy.mockResolvedValueOnce(response)
    await expect(fetch(url)).resolves.toBe(response)
    expect(wrap).toHaveBeenCalledWith(url, expect.any(Function), {
      squelch: true,
      data: { url },
      onResult: errorOn5xx,
    })
  })
})
