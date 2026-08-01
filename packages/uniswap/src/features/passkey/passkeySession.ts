import {
  Action,
  AuthenticationTypes,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { isWebApp } from '@universe/environment'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { loadNeckMetadata } from 'uniswap/src/features/passkey/deviceSession'
import { authenticatePasskey } from 'uniswap/src/features/passkey/passkey'
import { logger } from 'utilities/src/logger/logger'

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
    logger.debug('passkeySession.ts', 'authenticateWithPasskey', `Starting action=${Action[action]}`, {
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

    logger.debug('passkeySession.ts', 'authenticateWithPasskey', 'Challenge received', {
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
    logger.debug('passkeySession.ts', 'authenticateWithPasskey', 'Passkey ceremony completed', {
      hasCredential: Boolean(credential),
    })
    return credential
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('passkeySession.ts', 'authenticateWithPasskey', 'User aborted the registration process')
      return undefined
    } else {
      const errName = error instanceof Error ? error.name : 'unknown'
      const errMessage = error instanceof Error ? error.message : String(error)
      logger.error(new Error('Error during authentication', { cause: error }), {
        tags: {
          file: 'passkeySession.ts',
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
