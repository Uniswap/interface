import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { authenticatePasskey, registerPasskey } from '@universe/embedded-wallet/src/features/passkey/passkey.web'
import { WebAuthnUnsupportedError } from '@universe/embedded-wallet/src/features/passkey/passkeyRejection'

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))

const challenge = JSON.stringify({ challenge: 'abc' })

describe('passkey.web', () => {
  beforeEach(() => {
    vi.mocked(browserSupportsWebAuthn).mockReset()
    vi.mocked(startAuthentication).mockReset()
    vi.mocked(startRegistration).mockReset()
  })

  it('rejects before prompting when the browser has no WebAuthn', async () => {
    vi.mocked(browserSupportsWebAuthn).mockReturnValue(false)

    await expect(authenticatePasskey(challenge)).rejects.toBeInstanceOf(WebAuthnUnsupportedError)
    await expect(registerPasskey(challenge)).rejects.toBeInstanceOf(WebAuthnUnsupportedError)
    expect(startAuthentication).not.toHaveBeenCalled()
    expect(startRegistration).not.toHaveBeenCalled()
  })

  it('skips the support check for an empty (already sessioned) challenge', async () => {
    vi.mocked(browserSupportsWebAuthn).mockReturnValue(false)

    await expect(authenticatePasskey('')).resolves.toBe('')
  })

  it('prompts when WebAuthn is supported', async () => {
    vi.mocked(browserSupportsWebAuthn).mockReturnValue(true)
    vi.mocked(startAuthentication).mockResolvedValue({ id: 'credential' } as Awaited<
      ReturnType<typeof startAuthentication>
    >)

    await expect(authenticatePasskey(challenge)).resolves.toBe(JSON.stringify({ id: 'credential' }))
  })
})
