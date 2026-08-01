import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { DEV_ENV_FILENAME } from '../consts'
import { unwrap } from '../errors'
import { reconcileDevEnv } from '../lib/devEnv'
import { paramEntryToObject } from '../lib/format/format'
import { findWorkspaceRoot } from '../lib/workspace'
import { buildConfigClient, createConfigFetcherService } from '../services/configFetcher'
import { vars } from '../vars'

// Apps with checked-in .env.dev defaults.
const DEFAULT_APPS: AppId[] = [AppId.Web, AppId.Mobile, AppId.Extension]

export const syncDev = Cli.create('sync-dev', {
  description:
    "Sync each app's checked-in .env.dev defaults with the latest development configs (updates existing keys only).",
  options: z.object({
    apps: z
      .array(z.enum(AppId))
      .optional()
      .describe(`Subset of apps to sync. Defaults to ${DEFAULT_APPS.join(', ')}.`),
  }),
  async run(c) {
    const { auth } = vars(c)
    const apps = c.options.apps?.length ? c.options.apps : DEFAULT_APPS

    const client = await unwrap(buildConfigClient(auth))
    const fetcher = createConfigFetcherService({ client })

    const summary: { app: AppId; updatedKeys: string[] }[] = []
    for (const app of apps) {
      const parameters = await unwrap(fetcher.getParameterValuesInScope(`/${app}/${Environment.Development}`))
      const fetched = paramEntryToObject(parameters)

      const filePath = join(findWorkspaceRoot(), 'apps', app, DEV_ENV_FILENAME)

      let existingContent: string
      try {
        existingContent = await readFile(filePath, 'utf8')
      } catch (cause) {
        return c.error({ code: 'ReadFailed', message: `Could not read ${filePath}: ${errorToString(cause)}` })
      }

      const { content, updatedKeys } = reconcileDevEnv(existingContent, fetched)

      // Only touch the file when something actually changed.
      if (updatedKeys.length > 0) {
        try {
          await writeFile(filePath, content, 'utf8')
        } catch (cause) {
          return c.error({ code: 'WriteFailed', message: errorToString(cause) })
        }
      }

      console.info(
        updatedKeys.length > 0
          ? `${app}: updated ${updatedKeys.length} key(s): ${updatedKeys.join(', ')}`
          : `${app}: already up to date`,
      )
      summary.push({ app, updatedKeys })
    }

    return { apps: summary }
  },
})
