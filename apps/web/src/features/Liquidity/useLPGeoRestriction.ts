import type { Currency } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { useIsTokenGeoRestricted } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'

/**
 * The copy an LP surface needs to state a confirmed block: which token caused it (undefined when the
 * restricted side has no symbol) and the label its CTA shows. Recurs across the LP gates, so the
 * shape is named once here.
 */
export type LPGeoRestrictionCopy = {
  tokenSymbol: string | undefined
  unavailableLabel: string
}

type LPGeoRestriction = {
  isGeoRestricted: boolean
  restrictedTokenSymbol: string | undefined
  unavailableLabel: string
}

/**
 * Geo-restriction for an LP pair. Consumes swap's existing per-token decision
 * (`useIsTokenGeoRestricted`) verbatim rather than reimplementing it, so the rules cannot drift:
 * single-sided liquidity provision is an effective buy, so anything blocked for swap must be blocked
 * for LP too. All of it — the RWA region AND, the deny-list classification, and the fail-open
 * behaviour while a source is in flight or unreadable — lives in that shared hook and is inherited
 * here unchanged. This hook adds only the token0/token1 fan-out and the LP copy, so every LP CTA
 * gates on one call instead of restating the per-side check.
 *
 * Blocks ANY restriction with no bypass: `useIsTokenGeoRestricted` is true for both hard blocks and
 * acknowledgement-gated tokens, which is what LP wants — it is supply-side, matching CCA/auctions
 * rather than swap's attestation escape hatch, since there is nothing a user can attest to that makes
 * providing liquidity from a blocked region permissible.
 *
 * Fails open while the answer is in flight, exactly as swap does. LP gates in two layers, matching
 * swap: the form-level gate (`SelectTokensStep`, `DepositStep`, `IncreaseLiquidityForm`,
 * `useMigrateGeoGate`), plus an independent re-read on the surface that actually signs — `ReviewModal`
 * (shared by create and migrate) and `IncreaseLiquidityReview`. The second layer exists specifically
 * because the first fails open: a user can press Continue while the check is in flight, so the
 * signing surface re-reads this hook and kills its confirm if the restriction lands after that.
 *
 * Both layers are client-side UI. Neither is a transaction-time check — the calldata builders
 * (`CreatePositionTxContext`, `IncreaseLiquidityTxContext`, `MigrateLiquidityTxContext`) do not
 * consult compliance. Whether the backend independently rejects a restricted LP operation was not
 * verified as part of this change; do not assume it does.
 */
export function useLPGeoRestriction({
  token0,
  token1,
}: {
  token0: Maybe<Currency>
  token1: Maybe<Currency>
}): LPGeoRestriction {
  const { t } = useTranslation()

  const isToken0Restricted = useIsTokenGeoRestricted(token0 ?? undefined)
  const isToken1Restricted = useIsTokenGeoRestricted(token1 ?? undefined)

  const isGeoRestricted = isToken0Restricted || isToken1Restricted
  const restrictedTokenSymbol = isToken0Restricted ? token0?.symbol : isToken1Restricted ? token1?.symbol : undefined

  const unavailableLabel = restrictedTokenSymbol
    ? t('liquidity.geoRestriction.button', { tokenSymbol: restrictedTokenSymbol })
    : t('liquidity.geoRestriction.buttonGeneric')

  return {
    isGeoRestricted,
    restrictedTokenSymbol,
    unavailableLabel,
  }
}
