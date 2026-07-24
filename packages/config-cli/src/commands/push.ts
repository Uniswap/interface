import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { sleep } from 'utilities/src/time/timing'
import { unwrap } from '../errors'
import { paramName } from '../lib/format/format'
import { promptForConfirmation } from '../lib/prompt'
import { readDotenvFile } from '../lib/storage/dotenv'
import { buildConfigClient } from '../services/configFetcher'
import { vars } from '../vars'

export const push = Cli.create('push', {
  description: 'Push values from a local .env file into the Config Service (migration tool).',
  options: z.object({
    file: z.string().describe('Path to the .env file to push'),
    app: z.enum(AppId).describe('App name — becomes the service segment of the parameter key'),
    env: z.enum(Environment).describe('Environment stage'),
    scope: z.string().describe('Scope name under the service'),
  }),
  async run(c) {
    // Step 1: read + parse the local .env file. readDotenvFile treats a missing file
    // as an empty record, so an unknown path falls through the empty-file guard below
    // (good enough — the user gets a clear "no entries" error either way).
    const entries = await unwrap(readDotenvFile(c.options.file))
    const envKeys = Object.keys(entries)
    if (envKeys.length === 0) {
      return c.error({ code: 'EmptyFile', message: `No env entries found in "${c.options.file}"` })
    }

    // Step 2: build the config client (handles auth + dev overrides).
    const { auth } = vars(c)
    const client = await unwrap(buildConfigClient(auth))

    // Step 3: warn the user about migration-only intent and confirm.
    console.warn('⚠️  WARNING: `push` is a migration tool, not a normal workflow.')
    console.warn('   Use it only while moving values out of .env files / 1Password /')
    console.warn('   GitHub Secrets into the Config Service. For day-to-day parameter')
    console.warn('   changes use Mission Control, which routes through the approval flow.')
    console.warn('')
    console.warn(
      `📋 This push will add ${envKeys.length} entries to scope "${c.options.scope}" in service "${c.options.app}" in environment "${c.options.env}".`,
    )
    console.warn('')

    await promptForConfirmation('Continue')

    // Step 4: push each entry. Each call is independent on the backend (no transaction)
    // so we attempt all entries and report failures at the end instead of bailing early.
    // Keys are translated to Config Service shape: `/<app>/<scope>/<param-name>` with the
    // param name kebab-cased (paramName is the inverse of envName).
    const pushed: { key: string; needsApproval: boolean }[] = []
    const failed: { key: string; reason: string }[] = []

    for (const envKey of envKeys) {
      const key = `/${c.options.app}/${c.options.scope}/${paramName(envKey)}`
      const value = entries[envKey] ?? ''
      try {
        // Values may be secrets — never log them verbatim.
        console.log(`Setting ${key} = *****`)
        await sleep(1000)
        const reply = await client.setParameter(key, value)
        // success=true → applied immediately. success=false + minimumSignatureRequired>0 →
        // queued for approval. Anything else (success=false with no signature requirement,
        // success=undefined) is an unexpected response shape — treat as failure rather than
        // silently reporting a successful push.
        const needsApproval = reply.success === false && (reply.minimumSignatureRequired ?? 0) > 0
        if (reply.success === true || needsApproval) {
          pushed.push({ key, needsApproval })
        } else {
          failed.push({ key, reason: `Unexpected reply: ${JSON.stringify(reply)}` })
        }
      } catch (cause) {
        failed.push({ key, reason: errorToString(cause) })
      }
    }

    if (failed.length > 0) {
      return c.error({
        code: 'PushFailed',
        message: `${failed.length} of ${envKeys.length} parameter(s) failed to push: ${failed
          .map((f) => f.key)
          .join(', ')}`,
      })
    }

    return {
      app: c.options.app,
      env: c.options.env,
      scope: c.options.scope,
      pushed: pushed.length,
      keys: pushed.map((p) => p.key),
      ...(pushed.some((p) => p.needsApproval) && {
        awaitingApproval: pushed.filter((p) => p.needsApproval).map((p) => p.key),
      }),
    }
  },
})
