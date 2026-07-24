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
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import {
  ensureNeckKeyPair,
  generateDeviceKeyPair,
  getDeviceSession,
  loadNeckMetadata,
  setDeviceSession,
  signWithDeviceKey,
} from 'uniswap/src/features/passkey/deviceSession'
import { authenticatePasskey, registerPasskey } from 'uniswap/src/features/passkey/passkey'
import { authenticateWithPasskey, refreshNeckSession } from 'uniswap/src/features/passkey/passkeySession'
import { logger } from 'utilities/src/logger/logger'

export async function listAuthenticators(walletId?: string): Promise<{
  authenticators: Authenticator[]
  recoveryMethods: RecoveryMethod[]
  lastExportedMs?: number
}> {
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

    const challengeParams = {
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action: Action.LIST_AUTHENTICATORS,
      walletId: resolvedWalletId,
      devicePublicKey,
    }

    let challenge = await EmbeddedWalletApiClient.fetchChallengeRequest(challengeParams)
    if (!challenge.sessionActive) {
      await refreshNeckSession(devicePublicKey, resolvedWalletId)
      challenge = await EmbeddedWalletApiClient.fetchChallengeRequest(challengeParams)
    }

    if (!challenge.signingPayload) {
      throw new Error('Challenge did not return a signing payload for LIST_AUTHENTICATORS')
    }

    const deviceSignature = await signWithDeviceKey(neckSigningKey, challenge.signingPayload)
    const resp = await EmbeddedWalletApiClient.fetchListAuthenticatorsRequest({
      deviceAuth: { deviceSignature, walletId: resolvedWalletId, signingPayload: challenge.signingPayload },
    })
    const lastExportedMs = resp.lastExported !== undefined ? Number(resp.lastExported) : undefined
    return { authenticators: resp.authenticators, recoveryMethods: resp.recoveryMethods, lastExportedMs }
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
  // NECK_NEW is intentionally ephemeral: the server doesn't persist it in DDB
  // for this flow, so the wallet's prior NECK remains the device key validated
  // by deviceAuth endpoints. Persisting NECK_NEW would shadow it and break
  // subsequent signed calls — keep it in the in-memory deviceSession only.
  const { privateKey, publicKeyBase64: devicePublicKey } = await generateDeviceKeyPair()

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

    // Server builds the canonical update-key-quorum PATCH payload (with privy-request-expiry
    // baked in) and returns it for the device key to sign as-is.
    const prepareResponse = await EmbeddedWalletApiClient.fetchPrepareAddAuthenticatorRequest({
      newCredential,
    })
    if (!prepareResponse.signingPayload) {
      throw new Error('PrepareAddAuthenticator returned no signing payload')
    }
    const deviceSignature = await signWithDeviceKey(session.privateKey, prepareResponse.signingPayload)

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

export async function deleteAuthenticatorWithPasskey({
  authenticator,
  walletId,
}: {
  authenticator: Authenticator
  walletId?: string
}): Promise<boolean> {
  const credential = await authenticateWithPasskey(Action.DELETE_AUTHENTICATOR, {
    walletId,
    authenticatorId: authenticator.credentialId,
  })
  // `authenticateWithPasskey` returns falsy when the user cancels the WebAuthn prompt;
  // surfacing that as a no-op is the intended UX. Genuine failures throw.
  if (!credential) {
    return false
  }
  const result = await deleteAuthenticator({ authenticator, credential })
  return result === true
}
