import type { WebSocketLike } from '@universe/websocket/src/types'

type EventHandler = (event: unknown) => void

/**
 * Mock WebSocket implementation for testing.
 * Simulates WebSocket behavior without actual network connections.
 */
export class MockWebSocket implements WebSocketLike {
  readyState: number = WebSocket.CONNECTING

  private listeners = new Map<string, Set<EventHandler>>()

  addEventListener(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(handler)
  }

  close(): void {
    this.readyState = WebSocket.CLOSED
    this.emit('close', { code: 1000, reason: 'Normal closure' })
  }

  // Test helpers - simulate server behavior

  simulateOpen(): void {
    this.readyState = WebSocket.OPEN
    this.emit('open', {})
  }

  simulateClose(code = 1000, reason = 'Connection closed'): void {
    this.readyState = WebSocket.CLOSED
    this.emit('close', { code, reason })
  }

  simulateError(message = 'WebSocket error'): void {
    this.emit('error', { message })
  }

  simulateMessage(data: unknown): void {
    this.emit('message', { data: JSON.stringify(data) })
  }

  private emit(event: string, payload: unknown): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(payload)
      }
    }
  }
}
