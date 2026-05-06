import {
  Action,
  AuthenticationTypes,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import type {
  Authenticator,
  RegistrationOptions_AuthenticatorAttachment as AuthenticatorAttachment,
  RecoveryMethod,
  RegistrationOptions,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { base64ToBase64url, base64urlToBase64 } from '@universe/encoding'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import {
  canonicalizeJSON,
  ensureNeckKeyPair,
  generateDeviceKeyPair,
  getDeviceSession,
  loadNeckMetadata,
  loadNeckSigningKey,
  setDeviceSession,
  signWithDeviceKey,
  storeNeckMetadata,
  storeNeckSigningKey,
} from 'uniswap/src/features/passkey/deviceSession'
import { authenticateWithPasskey, refreshNeckSession } from 'uniswap/src/features/passkey/embeddedWallet'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { logger } from 'utilities/src/logger/logger'

export async function listAuthenticators(
  walletId?: string,
): Promise<{ authenticators: Authenticator[]; recoveryMethods: RecoveryMethod[] }> {
  try {
    const neckMeta = loadNeckMetadata()
    const resolvedWalletId = walletId ?? neckMeta?.walletId

    if (!resolvedWalletId) {
      throw new Error('No walletId available for device auth')
    }

    // Ensure we have both metadata AND the in-memory private key. If either is
    // missing (e.g. window was closed since last session), this regenerates a fresh
    // pair; we then MUST refresh the server-side NECK registration to bind the new
    // pub key, since Challenge(sessionActive) doesn't verify pub-key match.
    const {
      privateKey: neckSigningKey,
      publicKeyBase64: devicePublicKey,
      isFresh,
    } = await ensureNeckKeyPair(resolvedWalletId)

    if (isFresh) {
      await refreshNeckSession(devicePublicKey, resolvedWalletId)
    }

    let challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action: Action.LIST_AUTHENTICATORS,
      walletId: resolvedWalletId,
      devicePublicKey,
    })

    if (!challenge.sessionActive) {
      await refreshNeckSession(devicePublicKey, resolvedWalletId)
      challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
        type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
        action: Action.LIST_AUTHENTICATORS,
        walletId: resolvedWalletId,
        devicePublicKey,
      })
    }

    if (!challenge.signingPayload) {
      throw new Error('Challenge did not return a signing payload for LIST_AUTHENTICATORS')
    }

    const deviceSignature = await signWithDeviceKey(neckSigningKey, challenge.signingPayload)
    const resp = await EmbeddedWalletApiClient.fetchListAuthenticatorsRequest({
      deviceAuth: { deviceSignature, walletId: resolvedWalletId, signingPayload: challenge.signingPayload },
    })
    return { authenticators: resp.authenticators, recoveryMethods: resp.recoveryMethods }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'authenticatorManagement.ts',
        function: 'listAuthenticators',
      },
    })
    throw error
  }
}

export async function startAddAuthenticatorSession(walletId?: string): Promise<string> {
  // Try to use existing NECK; generate a new one only if expired/missing
  const neckMeta = loadNeckMetadata()
  const resolvedWalletId = walletId ?? neckMeta?.walletId
  let privateKey: CryptoKey | null = null
  let devicePublicKey: string

  if (neckMeta && resolvedWalletId) {
    privateKey = loadNeckSigningKey(resolvedWalletId)
  }

  if (privateKey && neckMeta) {
    devicePublicKey = neckMeta.publicKeyBase64
  } else {
    const newKeyPair = await generateDeviceKeyPair()
    privateKey = newKeyPair.privateKey
    devicePublicKey = newKeyPair.publicKeyBase64
  }

  const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
    type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
    action: Action.REGISTER_NEW_AUTHENTICATION_TYPES,
    walletId,
    devicePublicKey,
  })
  if (!challenge.challengeOptions) {
    throw new Error('No challenge options returned — cannot start authenticated session')
  }

  const existingCredential = await authenticatePasskey(challenge.challengeOptions)

  const sessionResp = await EmbeddedWalletApiClient.fetchStartAuthenticatedSessionRequest({
    existingCredential,
    devicePublicKey,
  })

  if (!sessionResp.policyId || sessionResp.policyExpiresAt == null) {
    throw new Error('StartAuthenticatedSession did not return policy details')
  }

  // Persist NECK from session response
  if (resolvedWalletId) {
    storeNeckSigningKey(resolvedWalletId, privateKey)
    storeNeckMetadata({
      publicKeyBase64: devicePublicKey,
      walletId: resolvedWalletId,
      deviceKeyQuorumId: neckMeta?.deviceKeyQuorumId ?? '',
    })
  }

  // Keep legacy in-memory session for registerNewAuthenticator backward compat
  setDeviceSession({
    privateKey,
    policyId: sessionResp.policyId,
    policyExpiresAt: Number(sessionResp.policyExpiresAt),
    walletId: walletId ?? undefined,
  })

  return existingCredential
}

export async function registerNewAuthenticator({
  authenticatorAttachment,
  username,
  walletId,
}: {
  authenticatorAttachment: AuthenticatorAttachment
  username?: string
  walletId?: string
}): Promise<void> {
  const session = getDeviceSession()
  if (!session) {
    throw new Error('No active device session — call startAddAuthenticatorSession first')
  }

  try {
    // Challenge for registration — returns keyQuorumId + existingPublicKeys
    const options = { authenticatorAttachment, username } as unknown as RegistrationOptions
    const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_REGISTRATION,
      action: Action.REGISTER_NEW_AUTHENTICATION_TYPES,
      options,
      walletId,
    })

    if (!challenge.challengeOptions) {
      throw new Error('No challenge options returned for passkey registration')
    }

    // Register new passkey in browser
    const newCredential = await registerPasskey(challenge.challengeOptions)

    // Extract new public key from credential response (base64url → standard base64)
    // newCredential is JSON.stringify(RegistrationResponseJSON) from @simplewebauthn/browser
    const credentialJson = JSON.parse(newCredential)
    if (!credentialJson?.response?.publicKey) {
      throw new Error('Credential response missing publicKey')
    }
    const b64urlKey: string = credentialJson.response.publicKey
    const newPublicKey = base64urlToBase64(b64urlKey)

    // Construct Privy PATCH canonical payload and sign with device key
    const allKeys = [...challenge.existingPublicKeys, newPublicKey]
    const privyAppId = process.env['PRIVY_APP_ID']
    if (!privyAppId) {
      throw new Error('PRIVY_APP_ID is not set')
    }
    const payload = {
      body: { public_keys: allKeys },
      headers: { 'privy-app-id': privyAppId },
      method: 'PATCH',
      url: `https://api.privy.io/v1/key_quorums/${challenge.keyQuorumId}`,
      version: 1,
    }
    const canonicalJson = canonicalizeJSON(payload)
    const signingPayloadBase64url = base64ToBase64url(btoa(canonicalJson))
    const deviceSignature = await signWithDeviceKey(session.privateKey, signingPayloadBase64url)

    await EmbeddedWalletApiClient.fetchAddAuthenticatorRequest({ newCredential, deviceSignature })
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'authenticatorManagement.ts',
        function: 'registerNewAuthenticator',
      },
    })
    throw error
  }
}

export async function deleteRecoveryMethod(walletId: string): Promise<boolean> {
  try {
    const credential = await authenticateWithPasskey(Action.DELETE_RECOVERY, { walletId })
    if (!credential) {
      return false
    }
    // The server identifies which recovery method to delete from the authenticated credential
    // and wallet context — no explicit recovery method ID is needed in the request.
    const resp = await EmbeddedWalletApiClient.fetchDeleteRecovery({ credential })
    return resp.success
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'authenticatorManagement.ts',
        function: 'deleteRecoveryMethod',
      },
    })
    throw new Error('Failed to delete recovery method', { cause: error })
  }
}

export async function deleteAuthenticator({
  authenticator,
  credential,
}: {
  authenticator: Authenticator
  credential?: string
}): Promise<boolean | undefined> {
  try {
    if (credential) {
      await EmbeddedWalletApiClient.fetchDeleteAuthenticatorRequest({
        credential,
        authenticatorId: authenticator.credentialId,
      })
      return true
    }
    return false
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'authenticatorManagement.ts',
        function: 'deleteAuthenticator',
      },
    })
    throw error
  }
}
