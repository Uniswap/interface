import { getChromeRuntime, getChromeRuntimeWithThrow } from '@universe/environment'
import { useEffect, useRef, useState } from 'react'
import { parseMessage } from 'uniswap/src/extension/messagePassing/platform'
import {
  InterfaceToExtensionRequestType,
  type RecoveryExportError,
  type RecoveryExportResult,
  type RecoveryFlowOpened,
  RecoveryHpkeKeySchema,
} from 'uniswap/src/extension/messagePassing/types/requests'
import { executeRecoveryExport } from 'uniswap/src/features/passkey/recoveryExecute'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export enum HpkeHandshakeStatus {
  Idle = 'Idle',
  Verifying = 'Verifying',
  Ready = 'Ready',
  Denied = 'Denied',
}

interface UseExtensionRecoveryBridgeArgs {
  extensionId: string
  requestId: string | null
  /**
   * When true, start the HPKE-key handshake with the extension. The standalone recovery
   * popup sets this to true on mount; the merged passkey popup flips it to true only
   * after the user fails the passkey ceremony and transitions to recovery.
   */
  enabled: boolean
  /** Privy's authorization signature generator — forwarded into `executeRecoveryExport`. */
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
  /**
   * Merged popup already gets the HPKE public key via the `PasskeyRequest` handshake,
   * so pass it here to skip the dedicated `RecoveryFlowOpened` round-trip. Standalone
   * recovery entry omits this and falls back to the handshake.
   */
  preProvidedEncryptionKey?: string
}

interface UseExtensionRecoveryBridgeResult {
  status: HpkeHandshakeStatus
  /**
   * Drop-in `onPinDecryptSuccess` for `useRecoveryFlow`. Encrypts the exported seed phrase
   * with the extension-provided HPKE key, ships the ciphertext back via messaging, and
   * closes the popup window.
   */
  onPinDecryptSuccess: (args: {
    authPrivateKey: Uint8Array
    authMethodId: string
    email: string
    accessToken: string
  }) => Promise<void>
  /** Notify the extension of a popup-side failure so it can exit its loading state. */
  sendErrorToExtension: (error: string) => void
}

/**
 * Shared bridge between the web popup and the extension for recovery-based export.
 *
 * Owns: HPKE public-key handshake (extension holds the private key), result/error message
 * dispatch, and the `onPinDecryptSuccess` glue that consumes the ciphertext pipeline.
 *
 * Both `ExtensionRecoveryAuthPopUp` (standalone entry) and the merged
 * `ExtensionPasskeyAuthPopUp` (passkey-failure → recovery inline) use this hook so the
 * message protocol stays in one place.
 */
export function useExtensionRecoveryBridge({
  extensionId,
  requestId,
  enabled,
  generateAuthorizationSignature,
  preProvidedEncryptionKey,
}: UseExtensionRecoveryBridgeArgs): UseExtensionRecoveryBridgeResult {
  const [status, setStatus] = useState<HpkeHandshakeStatus>(HpkeHandshakeStatus.Idle)
  const encryptionKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!preProvidedEncryptionKey || status === HpkeHandshakeStatus.Ready) {
      return
    }
    encryptionKeyRef.current = preProvidedEncryptionKey
    setStatus(HpkeHandshakeStatus.Ready)
  }, [preProvidedEncryptionKey, status])

  const sendResultToExtension = useEvent(async (result: { ciphertext: string; encapsulatedKey: string }) => {
    const chromeRuntime = getChromeRuntimeWithThrow()
    if (!requestId) {
      throw new Error('Missing request_id for RecoveryExportResult')
    }
    await chromeRuntime.sendMessage(extensionId, {
      type: InterfaceToExtensionRequestType.RecoveryExportResult,
      requestId,
      ciphertext: result.ciphertext,
      encapsulatedKey: result.encapsulatedKey,
    } satisfies RecoveryExportResult)
  })

  const sendErrorToExtension = useEvent((error: string) => {
    const chromeRuntime = getChromeRuntime()
    if (!chromeRuntime?.sendMessage || !requestId) {
      return
    }
    chromeRuntime.sendMessage(extensionId, {
      type: InterfaceToExtensionRequestType.RecoveryExportError,
      requestId,
      error,
    } satisfies RecoveryExportError)
  })

  useEffect(() => {
    if (!enabled || status !== HpkeHandshakeStatus.Idle || preProvidedEncryptionKey) {
      return
    }

    const chromeRuntime = getChromeRuntime()
    if (!chromeRuntime?.sendMessage || !requestId) {
      setStatus(HpkeHandshakeStatus.Denied)
      return
    }

    setStatus(HpkeHandshakeStatus.Verifying)

    ;(async () => {
      try {
        const response = await chromeRuntime.sendMessage(extensionId, {
          type: InterfaceToExtensionRequestType.RecoveryFlowOpened,
          requestId,
        } satisfies RecoveryFlowOpened)
        const parsed = parseMessage(response, RecoveryHpkeKeySchema)
        if (!parsed) {
          setStatus(HpkeHandshakeStatus.Denied)
          return
        }
        encryptionKeyRef.current = parsed.encryptionKey
        setStatus(HpkeHandshakeStatus.Ready)
      } catch (e) {
        logger.error(e, { tags: { file: 'useExtensionRecoveryBridge.ts', function: 'handshake' } })
        setStatus(HpkeHandshakeStatus.Denied)
      }
    })()
  }, [enabled, extensionId, preProvidedEncryptionKey, requestId, status])

  const onPinDecryptSuccess = useEvent(
    async ({
      authPrivateKey,
      authMethodId,
      accessToken,
    }: {
      authPrivateKey: Uint8Array
      authMethodId: string
      email: string
      accessToken: string
    }) => {
      const encryptionKey = encryptionKeyRef.current
      if (!encryptionKey) {
        throw new Error('Missing HPKE encryption key from extension')
      }
      const exportResult = await executeRecoveryExport({
        authPrivateKey,
        authMethodId,
        encryptionKey,
        accessToken,
        generateAuthorizationSignature,
      })
      await sendResultToExtension(exportResult)
      window.close()
    },
  )

  return { status, onPinDecryptSuccess, sendErrorToExtension }
}
