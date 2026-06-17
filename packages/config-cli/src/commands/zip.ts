import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { strToU8, zipSync } from 'fflate'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { ENV_FILENAME } from '../consts'
import { unwrap } from '../errors'
import { paramEntryToObject, serializeParams } from '../lib/format/format'
import { buildConfigClient, createConfigFetcherService } from '../services/configFetcher'
import { vars } from '../vars'

// Default subset until all apps are migrated to Config Service. Widen this list once
// dev-portal, mission-control, and cli have parameters in the service.
const DEFAULT_APPS: AppId[] = [AppId.Web, AppId.Mobile, AppId.Extension]

export const zip = Cli.create('zip', {
  description: "Bundle apps' configs into a single zip file for sharing or onboarding.",
  options: z.object({
    env: z.enum(Environment).default(Environment.Development).describe('Environment stage'),
    out: z.string().optional().describe('Output zip path (default: ./config-<env>-<timestamp>.zip)'),
    apps: z
      .array(z.enum(AppId))
      .optional()
      .describe(`Subset of apps to include. Defaults to ${DEFAULT_APPS.join(', ')}.`),
  }),
  async run(c) {
    const { auth } = vars(c)
    const apps = c.options.apps?.length ? c.options.apps : DEFAULT_APPS

    const client = await unwrap(buildConfigClient(auth))
    const fetcher = createConfigFetcherService({ client })

    const files: Record<string, Uint8Array> = {}
    const summary: { app: AppId; keysWritten: number }[] = []
    for (const app of apps) {
      const parameters = await unwrap(fetcher.getParameterValuesInScope(`/${app}/${c.options.env}`))
      const entries = paramEntryToObject(parameters)
      // Always use forward slashes inside zip paths regardless of host OS.
      files[`apps/${app}/${ENV_FILENAME}`] = strToU8(serializeParams(entries))
      summary.push({ app, keysWritten: Object.keys(entries).length })
    }

    const archive = zipSync(files)
    const outPath = c.options.out ?? join(process.cwd(), `app-configs-${c.options.env}-${timestamp()}.zip`)

    try {
      await writeFile(outPath, archive)
    } catch (cause) {
      return c.error({ code: 'WriteFailed', message: errorToString(cause) })
    }

    return { file: outPath, apps: summary }
  },
})

/** Compact ISO-8601 timestamp, e.g. `20260514T103000Z`, suitable for filenames. */
function timestamp(): string {
  return `${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`
}
