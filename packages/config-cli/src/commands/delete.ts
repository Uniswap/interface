import { AppId } from '@universe/config'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { sleep } from 'utilities/src/time/timing'
import { unwrap } from '../errors'
import { promptForConfirmation } from '../lib/prompt'
import { buildConfigClient } from '../services/configFetcher'
import { vars } from '../vars'

// Named `del` because `delete` is a reserved word and can't be a binding identifier.
export const del = Cli.create('delete', {
  description: "Delete every parameter in an app's scope (migration tool).",
  options: z.object({
    app: z.enum(AppId).describe('App name — the service segment of the parameter key'),
    scope: z.string().describe('Scope name under the service'),
  }),
  async run(c) {
    const { auth } = vars(c)
    const client = await unwrap(buildConfigClient(auth))

    const scope = `/${c.options.app}/${c.options.scope}`

    let keys: string[]
    try {
      const response = await client.listParameterNames(scope)
      keys = response.parameterKeys ?? []
    } catch (cause) {
      return c.error({ code: 'FetchFailed', message: errorToString(cause) })
    }

    if (keys.length === 0) {
      return {
        app: c.options.app,
        scope,
        deleted: 0,
        message: 'No parameters found.',
      }
    }

    console.warn('⚠️  WARNING: `delete` is a migration tool, not a normal workflow.')
    console.warn('   It permanently removes every parameter in the scope. Use it only to')
    console.warn('   clean up values migrated into the Config Service. For day-to-day')
    console.warn('   parameter changes use Mission Control.')
    console.warn('')
    console.warn(`📋 ${keys.length} parameter(s) in scope "${scope}":`)
    console.warn(`Keys: ${keys.join(', ')}`)
    console.warn('')

    await promptForConfirmation('Delete all')

    const deleted: { key: string; minimumSignatureRequired: number }[] = []
    const failed: { key: string; reason: string }[] = []

    for (const key of keys) {
      try {
        console.log(`Deleting key: ${key}`)
        await sleep(1000)
        const reply = await client.deleteParameter(key)
        console.log(`Reply: ${JSON.stringify(reply)}`)
        console.log(`Delete request submitted`)
        deleted.push({
          key,
          minimumSignatureRequired: reply.minimumSignatureRequired ?? 0,
        })
      } catch (cause) {
        const reason = errorToString(cause)
        console.log(`Delete failed: ${reason}`)
        failed.push({ key, reason })
      }
    }

    if (failed.length > 0) {
      return c.error({
        code: 'DeleteFailed',
        message: `${failed.length} of ${keys.length} parameter(s) failed to delete: ${failed
          .map((f) => f.key)
          .join(', ')}`,
      })
    }

    return {
      app: c.options.app,
      scope,
      deleted: deleted.length,
      keys: deleted.map((d) => d.key),
      ...(deleted.some((d) => d.minimumSignatureRequired > 0) && {
        awaitingApproval: deleted
          .filter((d) => d.minimumSignatureRequired > 0)
          .map((d) => ({ key: d.key, minimumSignatureRequired: d.minimumSignatureRequired })),
      }),
    }
  },
})
