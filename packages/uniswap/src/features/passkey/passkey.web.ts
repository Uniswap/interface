import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

export async function registerPasskey(_challenge: string): Promise<string> {
  return JSON.stringify(
    await startRegistration({
      optionsJSON: JSON.parse(_challenge),
    }),
  )
}

export async function authenticatePasskey(_challenge: string): Promise<string> {
  return JSON.stringify(
    await startAuthentication({
      optionsJSON: JSON.parse(_challenge),
    }),
  )
}
