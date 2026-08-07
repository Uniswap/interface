import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

type IncreaseLiquidityCtaProps = {
  isGeoRestricted: boolean
  geoUnavailableLabel: string
  showVerifyIdentity: boolean
  onVerifyIdentity: () => void
  onReview: () => void
  disabled: boolean
  requestLoading: boolean
  error: ReactNode
}

// KYC-rejection parity with the swap flow and the create-flow deposit step (ECO-578): a
// non-allowlisted wallet gets the Verify Identity CTA instead of a Review button that can
// only surface the backend's raw calldata rejection. Mirrors DepositCta in Deposit.tsx.
export function IncreaseLiquidityCta({
  isGeoRestricted,
  geoUnavailableLabel,
  showVerifyIdentity,
  onVerifyIdentity,
  onReview,
  disabled,
  requestLoading,
  error,
}: IncreaseLiquidityCtaProps): JSX.Element {
  const { t } = useTranslation()

  // Outranks Verify Identity: a region block has no remedy, so never offer a verification path.
  if (isGeoRestricted) {
    return (
      <Button size="large" disabled key="IncreaseLiquidity-GeoRestrictedButton">
        {geoUnavailableLabel}
      </Button>
    )
  }

  if (showVerifyIdentity) {
    return (
      <Button
        size="large"
        variant="default"
        emphasis="primary"
        onPress={onVerifyIdentity}
        icon={<ExternalLink size="$icon.20" />}
        iconPosition="after"
        key="IncreaseLiquidity-VerifyIdentityButton"
      >
        {t('permissionedPool.verifyIdentity.cta')}
      </Button>
    )
  }

  return (
    <Button
      disabled={disabled}
      onPress={onReview}
      loading={requestLoading}
      variant="branded"
      key="LoaderButton-animation-IncreaseLiquidity-continue"
      size="large"
    >
      {error || t('swap.button.review')}
    </Button>
  )
}
