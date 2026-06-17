import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { sleep } from 'utilities/src/time/timing'
import { unwrap } from '../errors'
import { promptForConfirmation } from '../lib/prompt'
import { buildConfigClient } from '../services/configFetcher'
import { vars } from '../vars'

export const approve = Cli.create('approve', {
  description: "Approve every pending proposal in an app's scope (migration tool).",
  options: z.object({
    app: z.enum(AppId).describe('App name — the service segment to search for pending proposals'),
    env: z.enum(Environment).describe('Environment stage'),
    scope: z.string().describe('Scope name under the service'),
  }),
  async run(c) {
    const { auth } = vars(c)
    const client = await unwrap(buildConfigClient(auth))

    const scope = `/${c.options.app}/${c.options.scope}`

    let pendingKeys: string[]
    try {
      const response = await client.getProposedParamsInScope(scope)
      pendingKeys = response.parameters ?? []
    } catch (cause) {
      return c.error({ code: 'FetchFailed', message: errorToString(cause) })
    }

    if (pendingKeys.length === 0) {
      return {
        app: c.options.app,
        env: c.options.env,
        scope,
        approved: 0,
        message: 'No pending proposals found.',
      }
    }

    console.warn('⚠️  WARNING: `approve` is a migration tool, not a normal workflow.')
    console.warn('   Use it only to bulk-approve proposals queued during the migration')
    console.warn('   from .env files / 1Password / GitHub Secrets into the Config Service.')
    console.warn('   For day-to-day proposal review, use Mission Control where the')
    console.warn('   approval flow surfaces the author, history, and previous value.')
    console.warn('')
    console.warn(`📋 ${pendingKeys.length} pending proposal(s) in scope "${scope}" for environment "${c.options.env}":`)
    console.warn(`Keys: ${pendingKeys.join(', ')}`)
    console.warn('')

    await promptForConfirmation('Approve all')

    // Each approval is an independent backend call (no transaction), matching push's behavior:
    // attempt every key, collect failures, report at the end rather than bailing on first error.
    const approved: { key: string; remainingSignatureRequired: number }[] = []
    const failed: { key: string; reason: string }[] = []

    for (const key of pendingKeys) {
      try {
        console.log(`Approving key: ${key}`)
        await sleep(1000)
        const reply = await client.approveProposedParam(key)
        console.log(`Reply: ${JSON.stringify(reply)}`)
        if (!reply.success) {
          throw new Error(`Reply status not success`)
        }
        console.log(`Approval succeeded`)
        approved.push({
          key,
          remainingSignatureRequired: reply.remainingSignatureRequired ?? 0,
        })
      } catch (cause) {
        const reason = errorToString(cause)
        console.log(`Approval failed: ${reason}`)
        failed.push({ key, reason })
      }
    }

    if (failed.length > 0) {
      return c.error({
        code: 'ApproveFailed',
        message: `${failed.length} of ${pendingKeys.length} proposal(s) failed to approve: ${failed
          .map((f) => f.key)
          .join(', ')}`,
      })
    }

    return {
      app: c.options.app,
      env: c.options.env,
      scope,
      approved: approved.length,
      keys: approved.map((a) => a.key),
      ...(approved.some((a) => a.remainingSignatureRequired > 0) && {
        stillNeedingApproval: approved
          .filter((a) => a.remainingSignatureRequired > 0)
          .map((a) => ({ key: a.key, remainingSignatureRequired: a.remainingSignatureRequired })),
      }),
    }
  },
})
