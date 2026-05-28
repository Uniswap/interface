import { type ConfigServerClient, type ParameterEntry, createConfigServerClient } from '@universe/api'
import type { Environment } from '@universe/environment'
import { Result } from 'better-result'
import { errorToString } from 'utilities/src/errors'
import { ConfigServiceError, type CliError } from '../errors'
import type { AuthService } from './auth'

export type ConfigFetcherDeps = {
  client: ConfigServerClient
}

export type ConfigFetcherService = ReturnType<typeof createConfigFetcherService>

export function createConfigFetcherService({ client }: ConfigFetcherDeps) {
  return {
    async getParameterValuesInScope(scopePath: string): Promise<Result<ParameterEntry[], ConfigServiceError>> {
      try {
        const response = await client.getParameterValuesInScope(scopePath)
        return Result.ok(response.parameters ?? [])
      } catch (cause) {
        // The api-package client collapses transport + protocol errors into a single thrown
        // Error with a method-tagged message. We can't reliably tell network failures from
        // server-side failures here, so everything maps to ConfigServiceError.
        return Result.err(new ConfigServiceError({ message: errorToString(cause) }))
      }
    },
  }
}

export type BuildConfigClientDeps = {
  auth: AuthService
  environment: Environment
}

/**
 * Build a ConfigServerClient honoring dev overrides:
 *   - CONFIG_SERVICE_URL  — skip the env-based hostname (e.g. http://localhost:3000)
 *   - CONFIG_SERVICE_TOKEN — skip Okta and use this bearer token directly
 * When neither is set, the access token is fetched from auth (via Okta + Keychain) and the
 * request hits the real env-based config service.
 */
export async function buildConfigClient({
  auth,
  environment,
}: BuildConfigClientDeps): Promise<Result<ConfigServerClient, CliError>> {
  const tokenOverride = process.env['CONFIG_SERVICE_TOKEN']
  const urlOverride = process.env['CONFIG_SERVICE_URL']

  let apiToken: string
  if (tokenOverride) {
    apiToken = tokenOverride
  } else {
    const tokenResult = await auth.getValidAccessToken()
    if (tokenResult.isErr()) {
      return Result.err(tokenResult.error)
    }
    apiToken = tokenResult.value
  }

  const client = createConfigServerClient({ environment, apiToken, baseUrl: urlOverride })
  return Result.ok(client)
}
