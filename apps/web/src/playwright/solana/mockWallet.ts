// oxlint-disable-next-line no-restricted-imports -- Playwright mock helpers need Playwright's Page type
import type { Page } from '@playwright/test'

/**
 * Mock Solana wallet for e2e tests.
 *
 * There is no SVM analogue of the wagmi mock connector (`wagmiAutoConnect.ts` is EVM-only), so this
 * registers a minimal Wallet Standard wallet (https://github.com/wallet-standard/wallet-standard)
 * via a page init script. `@solana/wallet-adapter-react`'s `WalletProvider` discovers Wallet
 * Standard wallets automatically, and because the init script also pre-seeds the adapter's
 * `walletName` localStorage key, the provider's `autoConnect` connects it on page load — mirroring
 * the auto-connected EVM test wallet.
 *
 * Signing writes a marker signature (`MOCK_SVM_SIGNATURE_BYTE` repeated across the 64-byte
 * signature slot) into the transaction, so tests can verify that whatever reaches the (mocked)
 * `/ultra/v1/execute` endpoint actually passed through the wallet — an identity signer could not
 * distinguish a signed submission from the unsigned order transaction being forwarded as-is.
 * The mocked endpoint never verifies signatures and the transaction is never broadcast.
 */

export const MOCK_SVM_WALLET_NAME = 'Mock Solana Wallet'

/** Base58 address of `Keypair.fromSeed(new Uint8Array(32).fill(42))` — a valid ed25519 key. */
export const MOCK_SVM_WALLET_ADDRESS = '2iXtA8oeZqUU5pofxK971TCEvFGfems2AcDRaZHKD2pQ'

/** Byte written across a v0 transaction's 64-byte signature slot by the mock signer. */
export const MOCK_SVM_SIGNATURE_BYTE = 0x2a

const MOCK_SVM_WALLET_PUBLIC_KEY_BYTES = [
  25, 127, 107, 35, 225, 108, 133, 50, 198, 171, 200, 56, 250, 205, 94, 167, 137, 190, 12, 118, 178, 146, 3, 52, 3, 155,
  250, 139, 61, 54, 141, 97,
]

// 1x1 transparent gif — wallet-standard requires a data-URI icon.
const MOCK_SVM_WALLET_ICON = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

declare global {
  interface Window {
    __mockSvmWalletSignCount?: number
    __mockSvmWalletRejectSignatures?: boolean
  }
}

/**
 * Makes the mock wallet's next signTransaction calls throw a user-rejection error
 * (message matching the app's `didUserReject` heuristics). Call before `page.goto`.
 */
export async function makeMockSolanaWalletRejectSignatures(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__mockSvmWalletRejectSignatures = true
  })
}

/** Number of times the mock wallet's signTransaction feature has been invoked on the current page. */
export async function getMockSolanaWalletSignCount(page: Page): Promise<number> {
  return await page.evaluate(() => window.__mockSvmWalletSignCount ?? 0)
}

export async function installMockSolanaWallet(page: Page): Promise<void> {
  await page.addInitScript(
    (args: { name: string; icon: string; address: string; publicKeyBytes: number[]; signatureByte: number }) => {
      const SOLANA_MAINNET_CHAIN = 'solana:mainnet'
      const publicKey = new Uint8Array(args.publicKeyBytes)

      const account = {
        address: args.address,
        publicKey,
        chains: [SOLANA_MAINNET_CHAIN] as const,
        // Wallet Standard requires account features to be a subset of the wallet's features.
        features: ['solana:signTransaction'] as const,
        label: args.name,
        icon: args.icon,
      }

      const listeners: Record<string, ((...eventArgs: unknown[]) => void)[]> = {}
      const emit = (event: string, ...eventArgs: unknown[]): void => {
        for (const listener of listeners[event] ?? []) {
          listener(...eventArgs)
        }
      }

      const wallet = {
        version: '1.0.0' as const,
        name: args.name,
        icon: args.icon,
        chains: [SOLANA_MAINNET_CHAIN] as const,
        accounts: [] as (typeof account)[],
        features: {
          'standard:connect': {
            version: '1.0.0' as const,
            connect: async (): Promise<{ accounts: (typeof account)[] }> => {
              wallet.accounts = [account]
              emit('change', { accounts: wallet.accounts })
              return { accounts: wallet.accounts }
            },
          },
          'standard:disconnect': {
            version: '1.0.0' as const,
            disconnect: async (): Promise<void> => {
              wallet.accounts = []
              emit('change', { accounts: wallet.accounts })
            },
          },
          'standard:events': {
            version: '1.0.0' as const,
            on: (event: string, listener: (...eventArgs: unknown[]) => void): (() => void) => {
              listeners[event] = [...(listeners[event] ?? []), listener]
              return () => {
                listeners[event] = (listeners[event] ?? []).filter((existing) => existing !== listener)
              }
            },
          },
          'solana:signTransaction': {
            version: '1.0.0' as const,
            supportedTransactionVersions: ['legacy', 0] as const,
            // Marker signer: writes args.signatureByte across the 64-byte signature slot
            // (bytes 1..65 of a single-signer serialized tx; byte 0 is the compact-u16
            // signature count). The mocked /execute endpoint never verifies signatures.
            signTransaction: async (
              ...inputs: { transaction: Uint8Array }[]
            ): Promise<{ signedTransaction: Uint8Array }[]> => {
              window.__mockSvmWalletSignCount = (window.__mockSvmWalletSignCount ?? 0) + 1
              if (window.__mockSvmWalletRejectSignatures) {
                throw new Error('User rejected the request.')
              }
              return inputs.map((input) => {
                const signedTransaction = new Uint8Array(input.transaction)
                signedTransaction.fill(args.signatureByte, 1, 65)
                return { signedTransaction }
              })
            },
          },
        },
      }

      const registerCallback = ({ register }: { register: (registeredWallet: typeof wallet) => void }): void => {
        register(wallet)
      }

      // Wallet Standard handshake: register with apps that loaded before or after this script.
      window.addEventListener('wallet-standard:app-ready', (event) => {
        registerCallback((event as CustomEvent<Parameters<typeof registerCallback>[0]>).detail)
      })
      window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: registerCallback }))

      // Pre-select the wallet so `WalletProvider`'s autoConnect connects it on load.
      window.localStorage.setItem('walletName', JSON.stringify(args.name))
    },
    {
      name: MOCK_SVM_WALLET_NAME,
      icon: MOCK_SVM_WALLET_ICON,
      address: MOCK_SVM_WALLET_ADDRESS,
      publicKeyBytes: MOCK_SVM_WALLET_PUBLIC_KEY_BYTES,
      signatureByte: MOCK_SVM_SIGNATURE_BYTE,
    },
  )
}
