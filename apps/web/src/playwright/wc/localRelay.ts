/**
 * Minimal in-process WalletConnect (IRN) relay for hermetic e2e tests.
 *
 * The real relay (wss://relay.walletconnect.com) is replaced by a local `ws` server that
 * implements just enough of the relay JSON-RPC protocol for two SignClients (the web
 * interface connector + the {@link ./walletCounterparty} wallet) to pair, settle a
 * session, and round-trip requests. This lets INC-316 (the shared-relay-identity bug where
 * a second SignClient's orphaned-subscription cleanup unsubscribed the active session's
 * topic, dropping the swap's `eth_sendTransaction` response) reproduce faithfully against a
 * REAL connector over a REAL transport — a fully mocked connector would not catch it.
 *
 * Protocol (see `@walletconnect/relay-api` RELAY_JSONRPC + `@walletconnect/core` relayer):
 *  - `irn_subscribe` {topic} -> result: subscriptionId (string). Registers topic->socket and
 *    flushes any already-stored messages for that topic to the new subscriber.
 *  - `irn_publish` {topic, message, ttl, tag} -> result: true. Stores the message and fans it
 *    out to every OTHER socket subscribed to the topic as an `irn_subscription` push.
 *  - `irn_unsubscribe` {id, topic} -> result: true. Removes the subscription; the socket then
 *    stops receiving that topic — this is the exact behavior the pre-#34871 bug abused.
 *  - `wc_proposeSession` {pairingTopic, sessionProposal} — WC 2.23's optimized proposal relay
 *    method: the proposer never explicitly subscribes, so the relay implicitly subscribes it
 *    to the pairing topic (to receive the approval) and stores the proposal for the wallet.
 *  - `wc_approveSession` {pairingTopic, sessionTopic, sessionProposalResponse,
 *    sessionSettlementRequest} — delivers the approval on the pairing topic and the settle
 *    request on the session topic (stored + flushed, since the dapp subscribes to the session
 *    topic only after processing the approval).
 *
 * A published message is never echoed back to the socket that published it (mirroring the
 * real relay), and messages are de-duplicated client-side, so liberal implicit subscribes and
 * store/flush are safe.
 */
import type { IncomingMessage } from 'node:http'
import type { WebSocket } from 'ws'
import { WebSocketServer } from 'ws'

interface StoredMessage {
  topic: string
  message: string
  publishedAt: number
  tag?: number
  from: WebSocket
}

interface Subscription {
  socket: WebSocket
  subId: string
}

export interface LocalRelay {
  url: string
  close: () => Promise<void>
}

interface RelayJsonRpc {
  id?: number | string
  method?: string
  params?: Record<string, unknown>
}

function isPublishShape(
  params: Record<string, unknown> | undefined,
): params is { topic: string; message: string; tag?: number; ttl?: number; prompt?: boolean } {
  return !!params && typeof params.topic === 'string' && typeof params.message === 'string'
}

/**
 * Starts the local relay. Pass a fixed `port` (the e2e harness uses the one baked into
 * `WC_RELAY_URL_OVERRIDE`); `0` picks an ephemeral port (used by the derisk/unit path).
 */
export async function startLocalRelay(options: { port: number; host?: string } = { port: 0 }): Promise<LocalRelay> {
  const host = options.host ?? '127.0.0.1'
  const wss = new WebSocketServer({ host, port: options.port })
  await new Promise<void>((resolve, reject) => {
    wss.once('listening', resolve)
    wss.once('error', reject)
  })

  const messagesByTopic = new Map<string, StoredMessage[]>()
  const subsBySocket = new Map<WebSocket, Map<string, string>>()
  const subsByTopic = new Map<string, Set<Subscription>>()

  let subCounter = 0
  const genSubId = (): string => `sub-${++subCounter}-${Math.random().toString(16).slice(2)}`

  const send = (socket: WebSocket, payload: unknown): void => socket.send(JSON.stringify(payload))
  const ack = (socket: WebSocket, response: { id: number | string; result: unknown }): void =>
    send(socket, { id: response.id, jsonrpc: '2.0', result: response.result })

  const pushSubscription = (socket: WebSocket, args: { subId: string; entry: StoredMessage }): void =>
    send(socket, {
      id: Date.now() + Math.floor(Math.random() * 1e6),
      jsonrpc: '2.0',
      method: 'irn_subscription',
      params: {
        id: args.subId,
        data: { topic: args.entry.topic, message: args.entry.message, publishedAt: args.entry.publishedAt },
      },
    })

  const removeSubscription = (topic: string, subId: string): void => {
    const subs = subsByTopic.get(topic)
    if (!subs) {
      return
    }
    for (const sub of subs) {
      if (sub.subId === subId) {
        subs.delete(sub)
      }
    }
  }

  const registerSub = (socket: WebSocket, topic: string): string => {
    const subId = genSubId()
    let bySocket = subsBySocket.get(socket)
    if (!bySocket) {
      bySocket = new Map()
      subsBySocket.set(socket, bySocket)
    }
    bySocket.set(subId, topic)
    let subs = subsByTopic.get(topic)
    if (!subs) {
      subs = new Set()
      subsByTopic.set(topic, subs)
    }
    subs.add({ socket, subId })
    // Flush stored messages the subscriber has not seen (never its own publishes).
    for (const entry of messagesByTopic.get(topic) ?? []) {
      if (entry.from !== socket) {
        pushSubscription(socket, { subId, entry })
      }
    }
    return subId
  }

  const publish = (socket: WebSocket, args: { topic: string; message: string; tag?: number }): void => {
    const entry: StoredMessage = {
      topic: args.topic,
      message: args.message,
      publishedAt: Date.now(),
      tag: args.tag,
      from: socket,
    }
    const stored = messagesByTopic.get(args.topic)
    if (stored) {
      stored.push(entry)
    } else {
      messagesByTopic.set(args.topic, [entry])
    }
    for (const sub of subsByTopic.get(args.topic) ?? []) {
      if (sub.socket !== socket) {
        pushSubscription(sub.socket, { subId: sub.subId, entry })
      }
    }
  }

  const handleMessage = (socket: WebSocket, raw: string): void => {
    let msg: RelayJsonRpc
    try {
      msg = JSON.parse(raw) as RelayJsonRpc
    } catch {
      return
    }
    const { id, method, params } = msg
    if (typeof method !== 'string' || id === undefined) {
      return
    }

    if (method === 'wc_proposeSession') {
      const pairingTopic = params?.pairingTopic as string
      registerSub(socket, pairingTopic)
      publish(socket, { topic: pairingTopic, message: params?.sessionProposal as string, tag: params?.tag as number })
      ack(socket, { id, result: true })
    } else if (method === 'wc_approveSession') {
      const pairingTopic = params?.pairingTopic as string
      const sessionTopic = params?.sessionTopic as string
      registerSub(socket, sessionTopic)
      publish(socket, {
        topic: pairingTopic,
        message: params?.sessionProposalResponse as string,
        tag: params?.tag as number,
      })
      publish(socket, {
        topic: sessionTopic,
        message: params?.sessionSettlementRequest as string,
        tag: params?.tag as number,
      })
      ack(socket, { id, result: true })
    } else if (isPublishShape(params)) {
      publish(socket, { topic: params.topic, message: params.message, tag: params.tag })
      ack(socket, { id, result: true })
    } else if (method.endsWith('_batchSubscribe')) {
      const topics = (params?.topics as string[] | undefined) ?? []
      ack(socket, { id, result: topics.map((topic) => registerSub(socket, topic)) })
    } else if (method.endsWith('_subscribe')) {
      ack(socket, { id, result: registerSub(socket, params?.topic as string) })
    } else if (method.endsWith('_unsubscribe')) {
      subsBySocket.get(socket)?.delete(params?.id as string)
      removeSubscription(params?.topic as string, params?.id as string)
      ack(socket, { id, result: true })
    } else if (method.endsWith('_batchFetchMessages')) {
      ack(socket, { id, result: { messages: [] } })
    } else {
      ack(socket, { id, result: true })
    }
  }

  const cleanupSocket = (socket: WebSocket): void => {
    const bySocket = subsBySocket.get(socket)
    if (bySocket) {
      for (const [subId, topic] of bySocket) {
        removeSubscription(topic, subId)
      }
    }
    subsBySocket.delete(socket)
  }

  wss.on('connection', (socket: WebSocket, _req: IncomingMessage) => {
    socket.on('message', (data) => handleMessage(socket, data.toString()))
    socket.on('close', () => cleanupSocket(socket))
  })

  const address = wss.address()
  const port = typeof address === 'object' && address ? address.port : options.port

  return {
    url: `ws://${host}:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        for (const socket of wss.clients) {
          socket.terminate()
        }
        wss.close(() => resolve())
      }),
  }
}
