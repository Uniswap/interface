import { type ConfigServerClient } from '@universe/api'
import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { sleep } from 'utilities/src/time/timing'
import { unwrap } from '../errors'
import { promptForConfirmation } from '../lib/prompt'
import { buildConfigClient } from '../services/configFetcher'
import { vars } from '../vars'

// Sentinel scope value that fans the approval out across every environment scope
// (development, staging, production) rather than a single named scope.
const ALL_SCOPES = 'ALL_SCOPES'

type ScopeApproval = {
  scope: string
  approved: { key: string; scope: string; remainingSignatureRequired: number }[]
  failed: { key: string; scope: string; reason: string }[]
}

// Approve every pending proposal in a single scope
async function approveScope(
  client: ConfigServerClient,
  { scope, pendingKeys }: { scope: string; pendingKeys: string[] },
): Promise<ScopeApproval> {
  const approved: ScopeApproval['approved'] = []
  const failed: ScopeApproval['failed'] = []

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
        scope,
        remainingSignatureRequired: reply.remainingSignatureRequired ?? 0,
      })
    } catch (cause) {
      const reason = errorToString(cause)
      console.log(`Approval failed: ${reason}`)
      failed.push({ key, scope, reason })
    }
  }

  return { scope, approved, failed }
}

export const approve = Cli.create('approve', {
  description: "Approve every pending proposal in an app's scope (migration tool).",
  options: z.object({
    app: z.enum(AppId).describe('App name — the service segment to search for pending proposals'),
    scope: z.string().describe(`Scope name under the service, or "${ALL_SCOPES}" to approve every environment scope`),
  }),
  async run(c) {
    const { auth } = vars(c)
    const client = await unwrap(buildConfigClient(auth))

    // "ALL_SCOPES" fans out across the three environment scopes (development, staging, production);
    // any other value targets that single named scope.
    const scopeNames = c.options.scope === ALL_SCOPES ? [...Object.values(Environment), 'default'] : [c.options.scope]
    const scopes = scopeNames.map((name) => `/${c.options.app}/${name}`)

    // Fetch pending proposals for every targeted scope up front so the confirmation prompt shows
    // the full blast radius before anything is approved.
    const pendingByScope: { scope: string; pendingKeys: string[] }[] = []
    for (const scope of scopes) {
      try {
        const response = await client.getProposedParamsInScope(scope)
        pendingByScope.push({ scope, pendingKeys: response.parameters ?? [] })
      } catch (cause) {
        return c.error({ code: 'FetchFailed', message: errorToString(cause) })
      }
    }

    const totalPending = pendingByScope.reduce((sum, s) => sum + s.pendingKeys.length, 0)

    if (totalPending === 0) {
      return {
        app: c.options.app,
        scopes,
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
    for (const { scope, pendingKeys } of pendingByScope) {
      console.warn(`📋 ${pendingKeys.length} pending proposal(s) in scope "${scope}":`)
      if (pendingKeys.length > 0) {
        console.warn(`Keys: ${pendingKeys.join(', ')}`)
      }
    }
    console.warn('')

    await promptForConfirmation('Approve all')

    const results: ScopeApproval[] = []
    for (const entry of pendingByScope) {
      results.push(await approveScope(client, entry))
    }

    const approved = results.flatMap((r) => r.approved)
    const failed = results.flatMap((r) => r.failed)

    if (failed.length > 0) {
      return c.error({
        code: 'ApproveFailed',
        message: `${failed.length} of ${totalPending} proposal(s) failed to approve: ${failed
          .map((f) => `${f.scope}:${f.key}`)
          .join(', ')}`,
      })
    }

    return {
      app: c.options.app,
      scopes,
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
