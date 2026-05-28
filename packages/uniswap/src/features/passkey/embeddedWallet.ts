import {
  Action,
  AuthenticationTypes,
  AuthenticatorNameType,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import type { RegistrationOptions } from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { HexString } from '@universe/encoding'
import { isWebApp } from '@universe/environment'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import {
  clearDeviceSession,
  clearNeckMetadata,
  deleteNeckSigningKey,
  generateDeviceKeyPair,
  hasActiveNeckKey,
  loadNeckMetadata,
  loadNeckSigningKey,
  signWithDeviceKey,
  storeNeckMetadata,
  storeNeckSigningKey,
} from 'uniswap/src/features/passkey/deviceSession'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'

export {
  Action,
  AuthenticationTypes,
  AuthenticatorNameType,
  RecoveryMethod,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export type { Authenticator } from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'

export async function registerNewPasskey({
  username,
  authenticatorAttachment,
  action,
  walletId,
}: {
  username?: string
  authenticatorAttachment?: AuthenticatorAttachment
  action?: Action
  walletId?: string
} = {}): Promise<{ credential: string }> {
  const options = { authenticatorAttachment, username } as unknown as RegistrationOptions
  try {
    const challengeJson = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_REGISTRATION,
      action: action ?? Action.CREATE_WALLET,
      options,
      walletId,
    })
    if (!challengeJson.challengeOptions) {
      throw new Error('No challenge options returned for passkey registration')
    }
    const passkeyCredential = await registerPasskey(challengeJson.challengeOptions)
    return { credential: passkeyCredential }
  } catch (registrationError: unknown) {
    if (registrationError instanceof Error && registrationError.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', 'User aborted registration')
    } else {
      logger.debug('embeddedWallet.ts', 'registerNewPasskey', `Error during registration: ${registrationError}`)
    }
    throw registrationError
  }
}

export async function createNewEmbeddedWallet(
  unitag: string,
): Promise<{ address: HexString; walletId: string } | undefined> {
  try {
    const { privateKey, publicKeyBase64: devicePublicKey } = await generateDeviceKeyPair()
    const { credential } = await registerNewPasskey({ username: unitag })

    const createWalletResp = await EmbeddedWalletApiClient.fetchCreateWalletRequest({
      credential,
      devicePublicKey,
    })

    if (createWalletResp.walletId) {
      // Persist NECK for 20-min reuse (server is source of truth via sessionActive)
      storeNeckSigningKey(createWalletResp.walletId, privateKey)
      storeNeckMetadata({
        publicKeyBase64: devicePublicKey,
        walletId: createWalletResp.walletId,
        deviceKeyQuorumId: createWalletResp.deviceKeyQuorumId ?? '',
      })
    }

    if (createWalletResp.walletAddress && createWalletResp.walletId) {
      logger.debug(
        'embeddedWallet.ts',
        'createNewEmbeddedWallet',
        `New wallet created: ${createWalletResp.walletAddress}`,
      )
      const address = getValidAddress({
        address: createWalletResp.walletAddress,
        platform: Platform.EVM,
        withEVMChecksum: true,
      })
      if (!address) {
        logger.error(new Error('Invalid address returned from create wallet response'), {
          tags: {
            file: 'embeddedWallet.ts',
            function: 'createNewEmbeddedWallet',
          },
        })
        return undefined
      }
      return { address: address as HexString, walletId: createWalletResp.walletId }
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'createNewEmbeddedWallet',
      },
    })
    throw error
  }
}

/**
 * Refreshes the NECK session via WALLET_SIGNIN passkey ceremony.
 * After this completes, the NECK is registered in Privy and future
 * Challenge calls will return sessionActive=true.
 *
 * @param devicePublicKey — the NECK public key to include in the WALLET_SIGNIN challenge
 * @param walletId — optional wallet ID hint
 */
export async function refreshNeckSession(devicePublicKey: string, walletId?: string): Promise<void> {
  // Challenge for WALLET_SIGNIN — server returns passkey ceremony options
  const signinChallenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action: Action.WALLET_SIGNIN,
    walletId,
    devicePublicKey,
  })
  if (!signinChallenge.challengeOptions) {
    throw new Error('No challenge options returned for WALLET_SIGNIN')
  }

  // Complete passkey WebAuthn ceremony
  const credential = await authenticatePasskey(signinChallenge.challengeOptions)
  if (!credential) {
    throw new Error('Passkey authentication aborted during NECK session refresh')
  }

  // WalletSignIn — server registers the NECK as a side effect
  await EmbeddedWalletApiClient.fetchWalletSigninRequest({ credential })
}

export async function authenticateWithPasskey(
  action: Action,
  options?: {
    walletId?: string
    message?: string
    transaction?: string
    typedData?: string
    encryptionKey?: string
    authenticatorId?: string
    authorizationContractAddress?: string
    authorizationChainId?: string
    authorizationNonce?: string
    devicePublicKey?: string
  },
): Promise<string | undefined> {
  try {
    logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', `Starting action=${Action[action]}`, {
      walletId: options?.walletId,
      hasDevicePublicKey: Boolean(options?.devicePublicKey),
      hasAuthenticatorId: Boolean(options?.authenticatorId),
    })

    // Include devicePublicKey if provided or available from NECK metadata.
    // Do NOT generate a new key pair here — callers that need NECK persistence
    // (signInWithPasskey, signWithDeviceSessionOrPasskey) generate and persist
    // their own key pair before calling this function.
    //
    // NECK is a web-app-only concept (browser-session device key backed by
    // localStorage + non-extractable CryptoKey). Skip the lookup on mobile and
    // extension — they don't generate, register, or persist a NECK key.
    const neckMeta = isWebApp ? loadNeckMetadata() : null
    const devicePublicKey = options?.devicePublicKey ?? neckMeta?.publicKeyBase64

    const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action,
      walletId: options?.walletId,
      message: options?.message,
      transaction: options?.transaction,
      typedData: options?.typedData,
      encryptionKey: options?.encryptionKey,
      authenticatorId: options?.authenticatorId,
      authorizationContractAddress: options?.authorizationContractAddress,
      authorizationChainId: options?.authorizationChainId,
      authorizationNonce: options?.authorizationNonce,
      devicePublicKey,
    })

    logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'Challenge received', {
      hasChallengeOptions: Boolean(challenge.challengeOptions),
      challengeOptionsPreview: challenge.challengeOptions?.slice(0, 120),
    })

    // TODO[INFRA-1212]: if challengeOptions is defined but the action is a session action, it means the session has expired and we need to reauthenticate
    // if (challenge.challengeOptions && SESSION_ACTIONS.includes(action)) {
    //   challenge = await reauthenticateSessionWithPasskey(action, walletId)
    // }
    if (!challenge.challengeOptions) {
      return undefined
    }
    const credential = await authenticatePasskey(challenge.challengeOptions)
    logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'Passkey ceremony completed', {
      hasCredential: Boolean(credential),
    })
    return credential
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('embeddedWallet.ts', 'authenticateWithPasskey', 'User aborted the registration process')
      return undefined
    } else {
      const errName = error instanceof Error ? error.name : 'unknown'
      const errMessage = error instanceof Error ? error.message : String(error)
      logger.error(new Error('Error during authentication', { cause: error }), {
        tags: {
          file: 'embeddedWallet.ts',
          function: 'authenticateWithPasskey',
        },
        extra: {
          action: Action[action],
          errName,
          errMessage,
          walletId: options?.walletId,
        },
      })
      throw error
    }
  }
}

export async function authenticateWithPasskeyForSeedPhraseExport(walletId?: string): Promise<string | undefined> {
  return await authenticateWithPasskey(Action.EXPORT_SEED_PHRASE, { walletId })
}

export async function authenticateWithPasskeyForWalletSignin(): Promise<string | undefined> {
  return await authenticateWithPasskey(Action.WALLET_SIGNIN)
}

export async function signInWithPasskey(
  walletId?: string,
  options?: { onWalletSignInFailureWithWalletId?: () => void },
): Promise<{ walletAddress: string; walletId: string; exported?: boolean } | undefined> {
  try {
    // Generate NECK key pair before sign-in so we can persist it after.
    // authenticateWithPasskey would generate one too, but discards the private key.
    //
    // Regenerate in two cases:
    //   1. No metadata — brand-new device.
    //   2. Metadata present but no live in-memory key (page refresh cleared it).
    // Reusing stale metadata alone would persist only the pub key after sign-in,
    // leaving the next signing flow to hit ensureNeckKeyPair.isFresh and trigger
    // a second passkey prompt back-to-back with this one.
    const neckMeta = loadNeckMetadata()
    const hasLiveKey = neckMeta ? hasActiveNeckKey(neckMeta.walletId) : false
    let devicePublicKey = neckMeta?.publicKeyBase64
    let freshKeyPair: { privateKey: CryptoKey; publicKeyBase64: string } | undefined
    if ((!devicePublicKey || !hasLiveKey) && !!walletId) {
      freshKeyPair = await generateDeviceKeyPair()
      devicePublicKey = freshKeyPair.publicKeyBase64
    }

    let credential: string | undefined
    try {
      credential = await authenticateWithPasskey(Action.WALLET_SIGNIN, { walletId, devicePublicKey })
    } catch (challengeError) {
      // Don't retry in place: it would trigger a second passkey prompt back-to-back.
      if (walletId) {
        options?.onWalletSignInFailureWithWalletId?.()
      }
      throw challengeError
    }
    if (!credential) {
      return undefined
    }
    let signInRespJson: Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchWalletSigninRequest>>
    try {
      signInRespJson = await EmbeddedWalletApiClient.fetchWalletSigninRequest({ credential })
    } catch (signInError) {
      // The credential is already consumed; signal callers so they can clear stale walletId hints.
      if (walletId) {
        options?.onWalletSignInFailureWithWalletId?.()
      }
      throw signInError
    }
    if (signInRespJson.walletAddress && signInRespJson.walletId) {
      // Persist NECK so subsequent signing flows find it in memory
      if (freshKeyPair && !!walletId) {
        storeNeckSigningKey(signInRespJson.walletId, freshKeyPair.privateKey)
        storeNeckMetadata({
          publicKeyBase64: freshKeyPair.publicKeyBase64,
          walletId: signInRespJson.walletId,
          deviceKeyQuorumId: '',
        })
      }
      return signInRespJson
    }
    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'signInWithPasskey',
      },
    })
    throw error
  }
}

export async function disconnectWallet(walletId?: string | null): Promise<void> {
  const neckMeta = loadNeckMetadata()
  const resolvedWalletId = walletId ?? neckMeta?.walletId

  try {
    // Unauthenticated disconnect: no wallet id, no NECK key, or server returned no signing payload.
    // Fall through to a best-effort request without deviceAuth.
    if (!resolvedWalletId) {
      await EmbeddedWalletApiClient.fetchDisconnectRequest()
      return
    }

    const neckPrivateKey = loadNeckSigningKey(resolvedWalletId)
    if (!neckPrivateKey) {
      await EmbeddedWalletApiClient.fetchDisconnectRequest()
      return
    }

    const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action: Action.DISCONNECT,
      walletId: resolvedWalletId,
      devicePublicKey: neckMeta?.publicKeyBase64,
    })
    if (!challenge.signingPayload) {
      await EmbeddedWalletApiClient.fetchDisconnectRequest()
      return
    }

    const deviceSignature = await signWithDeviceKey(neckPrivateKey, challenge.signingPayload)
    await EmbeddedWalletApiClient.fetchDisconnectRequest({
      deviceAuth: { deviceSignature, walletId: resolvedWalletId, signingPayload: challenge.signingPayload },
    })
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'embeddedWallet.ts',
        function: 'disconnectWallet',
      },
    })
    throw error
  } finally {
    // Always clear local state
    clearDeviceSession()
    clearNeckMetadata()
    if (resolvedWalletId) {
      deleteNeckSigningKey(resolvedWalletId)
    }
  }
}

export {
  deleteAuthenticator,
  deleteAuthenticatorWithPasskey,
  deleteRecoveryMethod,
  listAuthenticators,
  registerNewAuthenticator,
  startAddAuthenticatorSession,
} from 'uniswap/src/features/passkey/authenticatorManagement'
export type { SetupProgress } from 'uniswap/src/features/passkey/recoverySetup'
export { encryptAndStoreRecovery } from 'uniswap/src/features/passkey/recoverySetup'
// Re-exports from sub-modules — consumers continue to import from this file
export {
  exportEncryptedSeedPhrase,
  signMessageWithPasskey,
  signTransactionWithPasskey,
  signTypedDataWithPasskey,
} from 'uniswap/src/features/passkey/signing'
export type { GetExportCredentialFn } from 'uniswap/src/features/passkey/signing'

/** Result of the crypto phase — feed this into {@link authorizeAndCompleteRecovery}. */
export interface EncryptedRecoveryState {
  publicKey: string
  authMethodId: string
  encryptedKeyId: string
}

/**
 * Phase 2: Challenge → passkey authentication → SetupRecovery.
 *
 * Must be called directly from a user gesture (button click) so the WebAuthn
 * transient activation window is still open when `authenticatePasskey` fires.
 */
export type RecoveryAuthMethodType = 'EMAIL' | 'GOOGLE' | 'APPLE'

export async function authorizeAndCompleteRecovery({
  encrypted,
  email,
  walletId,
  privyUserId,
  authMethodType,
  onProgress,
}: {
  encrypted: EncryptedRecoveryState
  email: string
  walletId: string
  privyUserId: string
  authMethodType: RecoveryAuthMethodType
  onProgress?: (step: import('uniswap/src/features/passkey/recoverySetup').SetupProgress) => void
}): Promise<{ recoveryQuorumId: string }> {
  // Challenge — server creates recovery quorum, returns PATCH payload as WebAuthn challenge
  onProgress?.('challenging')
  const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action: Action.SETUP_RECOVERY,
    walletId,
    authPublicKey: encrypted.publicKey,
    privyUserId,
  })
  if (!challenge.challengeOptions) {
    throw new Error('No challenge options for SETUP_RECOVERY')
  }

  // Passkey signs the PATCH payload (existing passkey authorizes quorum link)
  onProgress?.('authenticating')
  const credential = await authenticatePasskey(challenge.challengeOptions)

  // Complete setup with passkey credential
  onProgress?.('registering')
  const result = await EmbeddedWalletApiClient.fetchSetupRecovery({
    credential,
    authMethodId: encrypted.authMethodId,
    authMethodType,
    authMethodIdentifier: email,
    encryptedKeyId: encrypted.encryptedKeyId,
  })
  if (!result.success || !result.recoveryQuorumId) {
    throw new Error('Backend failed to register recovery quorum')
  }
  return { recoveryQuorumId: result.recoveryQuorumId }
}
