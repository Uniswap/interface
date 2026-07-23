import type { RpcUserOperation } from 'viem/account-abstraction'
import { bundlerFetchClient, sendUserOperationToBundler } from '~/connection/bundlerClient'

const SIGNED_USER_OP = { sender: '0x1111111111111111111111111111111111111111' } as unknown as RpcUserOperation<'0.8'>

function parseBody(call: unknown): { jsonrpc: string; id: unknown; method: string; params: unknown[] } {
  const [, opts] = call as [string, { body: string }]
  return JSON.parse(opts.body)
}

describe('sendUserOperationToBundler', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('posts eth_sendUserOperation to /rpc/<chainId> and returns the userOpHash', async () => {
    const post = vi.spyOn(bundlerFetchClient, 'post').mockResolvedValue({ result: '0xUserOpHash' } as never)

    const result = await sendUserOperationToBundler(SIGNED_USER_OP, 1)

    expect(result).toBe('0xUserOpHash')
    expect(post).toHaveBeenCalledTimes(1)
    const [path] = post.mock.calls[0] as [string, unknown]
    expect(path).toBe('/rpc/1')
    const body = parseBody(post.mock.calls[0])
    expect(body.jsonrpc).toBe('2.0')
    expect(body.method).toBe('eth_sendUserOperation')
    expect(typeof body.id).toBe('number')
  })

  it('throws with the bundler error code + message on an RPC error', async () => {
    vi.spyOn(bundlerFetchClient, 'post').mockResolvedValue({ error: { code: -32000, message: 'bad userop' } } as never)

    await expect(sendUserOperationToBundler(SIGNED_USER_OP, 1)).rejects.toThrow('Bundler RPC error -32000: bad userop')
  })

  it('throws when the bundler returns an empty result', async () => {
    vi.spyOn(bundlerFetchClient, 'post').mockResolvedValue({} as never)

    await expect(sendUserOperationToBundler(SIGNED_USER_OP, 1)).rejects.toThrow('Bundler returned empty result')
  })

  it('uses a distinct request id per call so concurrent requests cannot collide', async () => {
    const post = vi.spyOn(bundlerFetchClient, 'post').mockResolvedValue({ result: '0xhash' } as never)

    await sendUserOperationToBundler(SIGNED_USER_OP, 1)
    await sendUserOperationToBundler(SIGNED_USER_OP, 1)

    expect(parseBody(post.mock.calls[0]).id).not.toBe(parseBody(post.mock.calls[1]).id)
  })
})
