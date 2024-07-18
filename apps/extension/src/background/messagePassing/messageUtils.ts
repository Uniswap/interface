import { Message } from 'src/background/messagePassing/messageTypes'

type MessageValidator<T extends Message> = (message: unknown) => message is T

type WindowMessageHandler<T extends Message> = (message: T, source: MessageEventSource | null) => void
type InvalidWindowMessageHandler = (message: unknown, source?: MessageEventSource | null) => void

// Message listener for chrome.window with validation logic. Used only to receive external messages from dapps.
export function addWindowMessageListener<T extends Message>(
  validator: MessageValidator<T>,
  handler: WindowMessageHandler<T>,
  invalidMessageHandler?: InvalidWindowMessageHandler,
): (event: MessageEvent) => void {
  const listener = (event: MessageEvent): void => {
    if (event.source !== window || !validator(event.data)) {
      invalidMessageHandler?.(event.data, event.source)
      return
    }

    handler(event.data, event.source)
  }
  window.addEventListener('message', listener)
  return listener
}

export function removeWindowMessageListener(listener: (event: MessageEvent) => void): void {
  window.removeEventListener('message', listener)
}
