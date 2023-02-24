import './send'

import { JsonRpcProvider } from '@ethersproject/providers'

import { wrap } from '..'

jest.mock('..')

describe('send', () => {
  it('wraps calls to JsonRpcProvider.send', async () => {
    const method = 'test'
    const params = ['a', 'b']
    const spy = wrap as unknown as jest.SpiedFunction<(...args: any[]) => Promise<any>>
    const response = 'response'
    spy.mockResolvedValueOnce(response)
    await expect(new JsonRpcProvider().send(method, params)).resolves.toBe(response)
    expect(wrap).toHaveBeenCalledWith(method, expect.any(Function), {
      squelch: true,
      data: { method, params },
    })
  })
})
