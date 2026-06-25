import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { UnsupportedPasskeyRegistrationError } from 'uniswap/src/features/passkey/unsupportedPasskeyError'

export async function registerPasskey(_challenge: string): Promise<string> {
  const registration = await startRegistration({
    optionsJSON: JSON.parse(_challenge),
  })
  // Some browsers (e.g. macOS Catalina Safari) finish the ceremony without exporting a public key,
  // which the backend requires, so treat it as an unsupported browser.
  if (!registration.response.publicKey) {
    throw new UnsupportedPasskeyRegistrationError()
  }
  return JSON.stringify(registration)
}

export async function authenticatePasskey(_challenge: string): Promise<string> {
  // an empty challenge signifies the user is sessioned and no authentication is needed
  return _challenge.length
    ? JSON.stringify(
        await startAuthentication({
          optionsJSON: JSON.parse(_challenge),
        }),
      )
    : ''
}
