import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { promiseTimeout } from 'utilities/src/time/timing'
import { ENV_FILENAME } from '../consts'
import { TimeoutError, unwrap } from '../errors'
import { paramEntryToObject, serializeParams } from '../lib/format/format'
import { readDotenvFile } from '../lib/storage/dotenv'
import { findWorkspaceRoot } from '../lib/workspace'
import { buildConfigClient, createConfigFetcherService } from '../services/configFetcher'
import { vars } from '../vars'

// Hard cap on the whole pull (incl. the interactive Okta auth) in --soft mode, so a stuck
// browser login or unreachable endpoint can't block app startup. See run() below.
const SOFT_PULL_TIMEOUT_MS = 90_000 // 90 seconds

export const pull = Cli.create('pull', {
  description: "Fetch an app's configs and write them to its local env file.",
  args: z.object({
    app: z.enum(AppId).describe('App name'),
  }),
  options: z.object({
    env: z.enum(Environment).default(Environment.Development).describe('Environment stage'),
    overwrite: z
      .boolean()
      .default(true)
      .describe('Replace the env file. When false, merge with existing values (fetched keys win).'),
    soft: z
      .boolean()
      .default(false)
      .describe(
        'Dev-only: on auth timeout or any failure, warn and exit 0 without writing the env file so the app ' +
          'falls back to the checked-in .env.dev defaults. Ignored (hard-fails) unless --env is development.',
      ),
  }),
  // oxlint-disable-next-line typescript/consistent-return
  async run(c) {
    const performPull = async () => {
      console.info('Pulling config for app', c.args.app, 'in environment', c.options.env)
      const { auth } = vars(c)
      const client = await unwrap(buildConfigClient(auth))
      const fetcher = createConfigFetcherService({ client })

      const parameters = await unwrap(fetcher.getParameterValuesInScope(`/${c.args.app}/${c.options.env}`))

      if (parameters.length === 0) {
        return c.error({
          code: 'NotFound',
          message: `No parameters found for app "${c.args.app}" in ${c.options.env}`,
        })
      }
      const fetchedParams = paramEntryToObject(parameters)

      const filePath = join(findWorkspaceRoot(), 'apps', c.args.app, ENV_FILENAME)

      let mergedParams: Record<string, string>
      if (c.options.overwrite) {
        mergedParams = fetchedParams
      } else {
        const existing = await unwrap(readDotenvFile(filePath))

        const overlappingKeys = Object.keys(existing).filter(
          (k) => k in fetchedParams && existing[k] !== fetchedParams[k],
        )
        if (overlappingKeys.length > 0) {
          console.info('New values fetched for the following keys:', overlappingKeys)
        }

        // Fetched values win on conflict; existing-only keys are preserved.
        mergedParams = { ...existing, ...fetchedParams }
      }

      try {
        await writeFile(filePath, serializeParams(mergedParams), 'utf8')
      } catch (cause) {
        return c.error({ code: 'WriteFailed', message: errorToString(cause) })
      }

      return {
        file: filePath,
        keysWritten: Object.keys(mergedParams).length,
      }
    }

    // Only development may soft-fall-back; staging/production always fail hard so a bad or missing
    // config surfaces as a build failure and is never silently replaced by dev defaults.
    const softFallback = c.options.soft && c.options.env === Environment.Development

    if (!softFallback) {
      return performPull()
    } else {
      // Soft (development) path: cap the whole pull so a stuck browser login can't block startup.
      try {
        const result = await promiseTimeout(performPull(), SOFT_PULL_TIMEOUT_MS)
        if (!result) {
          throw new TimeoutError({ message: `config:pull timed out after ${SOFT_PULL_TIMEOUT_MS / 1000}s` })
        }
        return result
      } catch {
        console.warn(`config:pull failed or timed out; the app will fall back to checked in dev env defaults`)
        process.exit(0)
      }
    }
  },
})
