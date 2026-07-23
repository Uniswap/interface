import {
  type ComplianceTokenInput,
  isAckGated,
  requiresAcknowledgement,
  useSetTokenAcknowledgement,
  useTokenComplianceStatus,
} from '@universe/compliance'
import {
  toComplianceTokenRef,
  useGeoRestrictionMode,
} from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

type GeoRestrictionAcknowledgment = {
  hasAcknowledged: boolean
  setAcknowledged: () => Promise<void>
  isPending: boolean
}

/**
 * Tracks geo-restriction acknowledgement for the current swap, backed per-token by the
 * compliance v2 API. `hasAcknowledged` is true once every ack-gated token reports
 * `ACKNOWLEDGED`; `setAcknowledged` records the attestation for each token still reporting
 * `REQUIRES_ACKNOWLEDGEMENT` (the single checkbox covers both swap sides).
 */
export function useGeoRestrictionAcknowledgment(): GeoRestrictionAcknowledgment {
  const inputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const outputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)
  const inputToken = toComplianceTokenRef(inputCurrency)
  const outputToken = toComplianceTokenRef(outputCurrency)

  const { reasons: inputReasons } = useTokenComplianceStatus(inputToken)
  const { reasons: outputReasons } = useTokenComplianceStatus(outputToken)
  const { acknowledgeToken, isPending } = useSetTokenAcknowledgement()

  const pendingTokens: ComplianceTokenInput[] = [
    inputToken && requiresAcknowledgement(inputReasons) ? inputToken : undefined,
    outputToken && requiresAcknowledgement(outputReasons) ? outputToken : undefined,
  ].filter((token): token is ComplianceTokenInput => Boolean(token))

  const anyAckGated = isAckGated(inputReasons) || isAckGated(outputReasons)
  const hasAcknowledged = anyAckGated && pendingTokens.length === 0

  const setAcknowledged = useEvent(async (): Promise<void> => {
    await Promise.all(pendingTokens.map((token) => acknowledgeToken(token)))
  })

  return { hasAcknowledged, setAcknowledged, isPending }
}

/**
 * True when the swap is acknowledgement-gated (`unrestricted`) and the user has not yet
 * attested. Drives the swap-button override: the CTA shows `Review`, stays enabled, and
 * opens the attestation modal instead of the generic blocked-token CTA.
 */
export function useNeedsGeoAcknowledgment(): boolean {
  const mode = useGeoRestrictionMode()
  const { hasAcknowledged } = useGeoRestrictionAcknowledgment()
  return mode === 'unrestricted' && !hasAcknowledged
}
