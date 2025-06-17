import { Message } from 'uniswap/src/extension/messagePassing/messageTypes'

type MessageValidator<T extends Message> = (message: unknown) => message is T

type WindowMessageHandler<T extends Message> = (message: T, source: MessageEventSource | null) => void
type InvalidWindowMessageHandler = (message: unknown, source?: MessageEventSource | null) => void

// Message listener for chrome.window with validation logic.
// Used to pass messages between the site – and content scripts – and the extension (eg receive external messages from dapps).
export function addWindowMessageListener<T extends Message>({
  validator,
  handler,
  invalidMessageHandler,
  options,
}: {
  validator: MessageValidator<T>
  handler: WindowMessageHandler<T>
  invalidMessageHandler?: InvalidWindowMessageHandler
  options?: { removeAfterHandled?: boolean }
}): (event: MessageEvent) => void {
  const listener = (event: MessageEvent): void => {
    if (event.source !== window || !validator(event.data)) {
      invalidMessageHandler?.(event.data, event.source)
      return
    }

    handler(event.data, event.source)
    if (options?.removeAfterHandled) {
      removeWindowMessageListener(listener)
    }
  }
  window.addEventListener('message', listener)
  return listener
}

export function removeWindowMessageListener(listener: (event: MessageEvent) => void): void {
  window.removeEventListener('message', listener)
}
