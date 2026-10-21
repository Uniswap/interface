import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'

describe('TypedMessageChannel.sendMessageToFrame', () => {
  it('delivers a response only to the frame that made the request', async () => {
    const sendMessage = vi.spyOn(chrome.tabs, 'sendMessage').mockResolvedValue(undefined as never)
    const response = { type: DappResponseType.RevokePermissionsResponse, requestId: 'req-1' } as const

    const sent = await dappResponseMessageChannel.sendMessageToFrame({ tabId: 12, frameId: 7 }, response)

    expect(sent).toBe(true)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const [tabId, wrapped, options] = sendMessage.mock.calls[0] as unknown as [number, Record<string, unknown>, unknown]
    expect(tabId).toBe(12)
    expect(Object.values(wrapped)).toContainEqual(response)
    expect(options).toEqual({ frameId: 7 })
  })
})
