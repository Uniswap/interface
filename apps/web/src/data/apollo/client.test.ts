import { describe, expect, it } from 'vitest'
import { apolloClient } from '~/data/apollo/client'

const TDP_CONTEXT_FILE = 'apps/web/src/pages/TokenDetails/context/useCreateTDPContext.ts'

// The TDP warm-cache fix reads Apollo's `loading` as "revalidating" rather than "nothing to render"
// whenever cached data is present. That reading is only valid while watchQuery stays on a bare
// `cache-and-network` — the config these assertions pin. Nothing in the TDP tests can catch a change
// here, because they hand-construct the Apollo response shape they expect.
//
// Each assertion compares a descriptive string rather than the raw value so the reason travels with
// the failure output; `expect` takes no message argument under our lint rules.
describe('apolloClient watchQuery defaults', () => {
  const watchQuery = apolloClient.defaultOptions.watchQuery

  it('stays on cache-and-network, which is what makes a warm remount report loading at all', () => {
    const fetchPolicy = watchQuery?.fetchPolicy
    const actual =
      fetchPolicy === 'cache-and-network'
        ? 'cache-and-network'
        : `'${String(fetchPolicy)}' — ${TDP_CONTEXT_FILE} derives its page loading flags from ` +
          '`loading && !data`, which assumes watchQuery is `cache-and-network`. Changing this policy ' +
          'changes what `loading` means on a remount; re-check that derivation before changing it.'

    expect(actual).toBe('cache-and-network')
  })

  it('declares no nextFetchPolicy, which would downgrade warm cache hits out of the loading state', () => {
    const nextFetchPolicy = watchQuery?.nextFetchPolicy
    const violation = nextFetchPolicy
      ? `nextFetchPolicy '${String(nextFetchPolicy)}' makes Apollo stop reporting \`loading: true\` on ` +
        `warm cache hits. ${TDP_CONTEXT_FILE} exists to handle exactly that shape — \`loading: true\` ` +
        'WITH cached data on remount, the skeleton bounce it fixes. With a nextFetchPolicy set that fix ' +
        'becomes dead weight and its tests keep passing against a response shape Apollo no longer ' +
        'produces. Remove the data-gating there deliberately rather than leaving both.'
      : undefined

    expect(violation).toBeUndefined()
  })

  it('leaves returnPartialData off, which is what keeps `!data` meaning "nothing to render"', () => {
    const violation = watchQuery?.returnPartialData
      ? 'returnPartialData is enabled, so Apollo can return a partial cache result as `data`. ' +
        `${TDP_CONTEXT_FILE} derives its page loading flags from \`loading && !data\`, which reads a ` +
        'truthy `data` as "there is enough cached content to render". A partial result satisfies that ' +
        'guard while the fields the page renders are still missing, so a warm remount drops the ' +
        'skeleton for an incomplete page — the opposite of the bounce that fix exists to prevent. ' +
        'Re-check that derivation before enabling this.'
      : undefined

    expect(violation).toBeUndefined()
  })
})
