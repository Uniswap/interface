import { startGatewayFixtureServer } from './gatewayFixtureServer'

/**
 * Vitest global setup for the cloud-function tests.
 *
 * When CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE points at localhost (as the
 * cloud-tests CI job sets it, for both the dev server and this test run),
 * starts the gateway fixture server on that URL's port so the dev-server
 * worker gets deterministic GraphQL responses. Without the override the
 * tests run against the live gateway, matching local `bun run dev` usage.
 */
export default async function setup(): Promise<(() => Promise<void>) | undefined> {
  const override = process.env.CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE
  if (!override) {
    console.warn(
      '[gateway-fixtures] CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE is not set — ' +
        'cloud tests will exercise the live GraphQL gateway and may flake on gateway latency.',
    )
    return undefined
  }

  const url = new URL(override)
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return undefined
  }

  const server = await startGatewayFixtureServer(Number(url.port))
  console.log(`[gateway-fixtures] serving canned gateway responses on ${override}`)
  return () => server.close()
}
