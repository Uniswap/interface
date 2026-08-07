import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { type LPGeoRestrictionCopy, useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'

type MigrateGeoGate = {
  /**
   * True only once the pair is confirmed restricted. The gate fails open, matching swap: an
   * unresolved check reads as clean and leaves Continue live.
   */
  disableContinue: boolean
  /** Set on exactly the same condition, so the CTA and its banner can never disagree. */
  geoRestriction: LPGeoRestrictionCopy | undefined
}

/**
 * Geo gate for the migration flow, shaped as the two props `SelectPriceRangeStep` consumes.
 *
 * Migration is the one LP flow that never renders `DepositStep`, so the shared deposit-step gate
 * does not cover it and its price-range Continue is the final CTA before the review modal. That
 * makes this its own seam: it lives here, separate and directly tested, so a future refactor of the
 * create/add flows cannot quietly drop migration's form-level block.
 *
 * This is the form-level layer only. The signing surface is gated separately inside `ReviewModal`,
 * which re-reads `useLPGeoRestriction` itself to catch a restriction that resolves after Continue.
 */
export function useMigrateGeoGate({
  token0,
  token1,
}: {
  token0: Maybe<Currency>
  token1: Maybe<Currency>
}): MigrateGeoGate {
  const { isGeoRestricted, restrictedTokenSymbol, unavailableLabel } = useLPGeoRestriction({
    token0,
    token1,
  })

  // Memoized because `Migrate/index.tsx` feeds this straight into a `useMemo` for the price-range
  // props: a fresh literal each render would invalidate that memo on every render for restricted users.
  const geoRestriction = useMemo(
    () => (isGeoRestricted ? { tokenSymbol: restrictedTokenSymbol, unavailableLabel } : undefined),
    [isGeoRestricted, restrictedTokenSymbol, unavailableLabel],
  )

  return {
    disableContinue: isGeoRestricted,
    geoRestriction,
  }
}
