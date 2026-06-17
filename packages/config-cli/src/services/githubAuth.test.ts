import * as core from '@actions/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGithubOidcAuthService } from './githubAuth'

vi.mock('@actions/core', () => ({ getIDToken: vi.fn() }))

const getIDTokenMock = vi.mocked(core.getIDToken)

const REQ_URL = 'ACTIONS_ID_TOKEN_REQUEST_URL'
const REQ_TOKEN = 'ACTIONS_ID_TOKEN_REQUEST_TOKEN'

beforeEach(() => {
  vi.clearAllMocks()
  process.env[REQ_URL] = 'https://token.actions.githubusercontent.com/abc?api-version=2.0'
  process.env[REQ_TOKEN] = 'request-bearer-token'
})

afterEach(() => {
  delete process.env[REQ_URL]
  delete process.env[REQ_TOKEN]
})

describe('githubAuth.getAccessToken', () => {
  it('mints an OIDC token for the uniswap audience', async () => {
    getIDTokenMock.mockResolvedValue('oidc-jwt')

    const result = await createGithubOidcAuthService().getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('oidc-jwt')
    }
    expect(getIDTokenMock).toHaveBeenCalledWith('https://uniswap.org')
  })

  it('returns AuthError without calling getIDToken when the OIDC env vars are missing', async () => {
    delete process.env[REQ_URL]

    const result = await createGithubOidcAuthService().getAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('id-token: write')
    }
    expect(getIDTokenMock).not.toHaveBeenCalled()
  })

  it('returns NetworkError when getIDToken throws', async () => {
    getIDTokenMock.mockRejectedValue(new Error('runner unreachable'))

    const result = await createGithubOidcAuthService().getAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('NetworkError')
      expect(result.error.message).toContain('runner unreachable')
    }
  })
})

describe('githubAuth.login', () => {
  // login() only exists to satisfy the AuthService interface; it is never reached for config
  // commands in CI (those mint tokens via getAccessToken), so it just reports as inapplicable.
  it('returns AuthError without minting a token (login is inapplicable in CI)', async () => {
    const result = await createGithubOidcAuthService().login()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('not applicable in CI')
    }
    expect(getIDTokenMock).not.toHaveBeenCalled()
  })
})
