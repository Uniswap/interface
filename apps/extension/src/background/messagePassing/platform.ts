/* biome-ignore-all lint/suspicious/noExplicitAny: Chrome extension message passing requires flexible typing for arbitrary message payloads */
import { MessageParsers } from 'uniswap/src/extension/messagePassing/platform'
import { logger } from 'utilities/src/logger/logger'

const EXTENSION_CONTEXT_INVALIDATED_CHROMIUM_ERROR = 'Extension context invalidated.'

type MessageListener<T> = (message: T, sender?: chrome.runtime.MessageSender) => void
class ChromeMessageChannel {
  protected readonly channelName: string
  readonly port?: chrome.runtime.Port

  protected listeners: MessageListener<any>[] = []

  constructor({
    channelName,
    port,
    canReceiveFromWebPage = false,
  }: {
    channelName: string
    canReceiveFromWebPage?: boolean
    port?: chrome.runtime.Port
  }) {
    this.channelName = channelName
    this.port = port

    const mainListener: MessageListener<any> = (message, sender) => {
      const targetMessage = message[this.channelName]

      if (targetMessage !== undefined) {
        if (sender?.tab !== undefined && !canReceiveFromWebPage) {
          return
        }

        if (sender?.id !== chrome.runtime.id && !this.port) {
          return
        }

        this.listeners.forEach((listener) => {
          listener(targetMessage, sender)
        })
      }
    }

    if (this.port) {
      this.port.onMessage.addListener((message, senderPort) => mainListener(message, senderPort.sender))
    } else {
      // eslint-disable-next-line no-restricted-syntax
      chrome.runtime.onMessage.addListener(mainListener)
    }

    this.sendMessage = this.sendMessage.bind(this)
    this.sendMessageToTab = this.sendMessageToTab.bind(this)
    this.sendMessageToTabUrl = this.sendMessageToTabUrl.bind(this)
    this.addMessageListener = this.addMessageListener.bind(this)
    this.removeMessageListener = this.removeMessageListener.bind(this)
  }

  async sendMessage(message: any): Promise<void> {
    if (this.port) {
      this.port.postMessage({ [this.channelName]: message })
    } else {
      // eslint-disable-next-line no-restricted-syntax
      chrome.runtime.sendMessage({ [this.channelName]: message }).catch(() => {})
    }
  }

  async sendMessageToTab(tabId: number, message: any): Promise<void> {
    // eslint-disable-next-line no-restricted-syntax
    await chrome.tabs.sendMessage(tabId, { [this.channelName]: message })
  }

  async sendMessageToTabUrl(tabUrl: string, message: any): Promise<void[]> {
    const urlMatcher = `${tabUrl}/*`
    const promises: Promise<void>[] = []
    chrome.tabs.query({ url: urlMatcher }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          promises.push(
            // eslint-disable-next-line no-restricted-syntax
            chrome.tabs
              .sendMessage(tab.id, { [this.channelName]: message })
              .catch(() => {
                // Not logging error here because it is expected that inactive tabs will not be able to receive the message
              }),
          )
        }
      })
    })
    return Promise.all(promises)
  }

  addMessageListener(listener: MessageListener<any>): () => void {
    this.listeners.push(listener)

    return () => this.removeMessageListener(listener)
  }

  removeMessageListener(listener: MessageListener<any>): void {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }
}

abstract class TypedMessageChannel<
  T extends string,
  R extends { [key in T]: { type: key } },
  L extends { [key in T]: MessageListener<R[key]> } = { [key in T]: MessageListener<R[key]> },
> {
  private readonly chromeMessageChannel: ChromeMessageChannel
  private readonly messageParsers: MessageParsers<T, R>
  private listeners = new Map<T, L[T][]>()

  constructor({
    channelName,
    port,
    messageParsers,
    canReceiveFromWebPage,
  }: {
    channelName: string
    port?: chrome.runtime.Port
    messageParsers: MessageParsers<T, R>
    canReceiveFromWebPage?: boolean
  }) {
    this.messageParsers = messageParsers
    this.chromeMessageChannel = new ChromeMessageChannel({
      channelName,
      port,
      canReceiveFromWebPage,
    })

    this.chromeMessageChannel.addMessageListener((message, sender) => {
      let type: T | undefined
      try {
        const processed = this.processMessage(message)
        const messageParser = processed.messageParser
        type = processed.type

        const parsed = messageParser(message)
        this.listeners.get(type)?.forEach((listener) => {
          listener(parsed, sender)
        })
      } catch (error) {
        logger.error(
          new Error(`Error validating message. Possible type is ${type}`, {
            cause: error,
          }),
          {
            tags: {
              file: 'platform.ts',
              function: 'TypedMessageChannel.constructor',
            },
          },
        )
      }
    })

    this.sendMessage = this.sendMessage.bind(this)
    this.sendMessageToTab = this.sendMessageToTab.bind(this)
    this.sendMessageToTabUrl = this.sendMessageToTabUrl.bind(this)
    this.addMessageListener = this.addMessageListener.bind(this)
    this.removeMessageListener = this.removeMessageListener.bind(this)
  }

  private processMessage(message: any): { type: T; messageParser: (message: unknown) => R[T] } {
    const type = message.type as Maybe<T>
    if (!type) {
      throw new Error('No type provided on message')
    }

    const messageParser = this.messageParsers[type]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!messageParser) {
      throw new Error(`No message parser found for type ${type}`)
    }
    return { type, messageParser }
  }

  async sendMessage<T1 extends T>(message: R[T1]): Promise<boolean> {
    const { type } = message

    try {
      await this.chromeMessageChannel.sendMessage(message)
      return true
    } catch (error) {
      const isExtensionInvalidatedError =
        error instanceof Error && error.message === EXTENSION_CONTEXT_INVALIDATED_CHROMIUM_ERROR
      logger.error(
        new Error(
          `${isExtensionInvalidatedError ? 'Please refresh the page. ' : ''}Error sending message for type ${type}`,
          { cause: error },
        ),
        {
          tags: {
            file: 'platform.ts',
            function: 'TypedMessageChannel.sendMessage',
          },
        },
      )
      return false
    }
  }

  async sendMessageToTab<T1 extends T>(tabId: number, message: R[T1]): Promise<boolean> {
    const { type } = message

    try {
      await this.chromeMessageChannel.sendMessageToTab(tabId, message)
      return true
    } catch (error) {
      logger.error(new Error(`Error sending message to tab for type ${type}`, { cause: error }), {
        tags: {
          file: 'platform.ts',
          function: 'TypedMessageChannel.sendMessageToTab',
        },
      })
      return false
    }
  }

  async sendMessageToTabUrl<T1 extends T>(tabUrl: string, message: R[T1]): Promise<boolean> {
    const { type } = message

    try {
      await this.chromeMessageChannel.sendMessageToTabUrl(tabUrl, message)
      return true
    } catch (error) {
      logger.error(new Error(`Error sending message to tab for type ${type}`, { cause: error }), {
        tags: {
          file: 'platform.ts',
          function: 'TypedMessageChannel.sendMessageToTabUrl',
        },
      })
      return false
    }
  }

  addMessageListener<T1 extends T>(type: T1, listener: L[T1]): () => void {
    this.listeners.set(type, this.listeners.get(type) ?? [])
    this.listeners.get(type)?.push(listener)

    return () => this.removeMessageListener(type, listener)
  }

  addAllMessageListener(listener: MessageListener<R[keyof R]>): () => void {
    const removeListeners = Object.keys(this.messageParsers).map((type) =>
      this.addMessageListener(type as T, listener as L[T]),
    )

    return () => removeListeners.forEach((remove) => remove())
  }

  removeMessageListener(type: T, listener: L[T]): void {
    this.listeners.set(type, this.listeners.get(type)?.filter((l) => l !== listener) ?? [])
  }
}

/**
 * Type-safe message channel class used for communication. Intended for general global use, backed by chrome.runtime
 */
export class TypedRuntimeMessageChannel<
  T extends string,
  R extends { [key in T]: { type: key } },
  L extends { [key in T]: MessageListener<R[key]> } = { [key in T]: MessageListener<R[key]> },
> extends TypedMessageChannel<T, R, L> {
  constructor({
    channelName,
    messageParsers,
    canReceiveFromWebPage,
  }: {
    channelName: string
    messageParsers: MessageParsers<T, R>
    canReceiveFromWebPage?: boolean
  }) {
    super({ channelName, messageParsers, canReceiveFromWebPage })
  }
}

/**
 * Adaptation of TypedRuntimeMessageChannel used as a wrapper around chrome.runtime.Port
 */
export class TypedPortMessageChannel<
  T extends string,
  R extends { [key in T]: { type: key } },
  L extends { [key in T]: MessageListener<R[key]> } = { [key in T]: MessageListener<R[key]> },
> extends TypedMessageChannel<T, R, L> {
  readonly port: chrome.runtime.Port

  constructor({
    channelName,
    messageParsers,
    port,
    canReceiveFromContentScript,
  }: {
    channelName: string
    messageParsers: MessageParsers<T, R>
    port: chrome.runtime.Port
    canReceiveFromContentScript?: boolean
  }) {
    super({ channelName, messageParsers, port, canReceiveFromWebPage: canReceiveFromContentScript })
    this.port = port
  }
}
