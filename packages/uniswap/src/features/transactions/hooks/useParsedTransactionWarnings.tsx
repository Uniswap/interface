import { useMemo } from 'react'
import { Wifi } from 'ui/src/components/icons/Wifi'
import { AppTFunction } from 'ui/src/i18n/types'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import {
  ParsedWarnings,
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
  WarningWithStyle,
} from 'uniswap/src/components/modals/WarningModal/types'

export function isPriceImpactWarning(warning: Warning): boolean {
  return warning.type === WarningLabel.PriceImpactMedium || warning.type === WarningLabel.PriceImpactHigh
}

export const getNetworkWarning = (t: AppTFunction): Warning => ({
  type: WarningLabel.NetworkError,
  severity: WarningSeverity.Low,
  action: WarningAction.DisableReview,
  title: t('swap.warning.offline.title'),
  icon: Wifi,
  message: t('swap.warning.offline.message'),
})

// Format an array of warnings into the ParsedWarnings type
export function useFormattedWarnings(warnings: Warning[]): ParsedWarnings {
  return useMemo(() => {
    const blockingWarning = warnings.find(
      (warning) => warning.action === WarningAction.DisableReview || warning.action === WarningAction.DisableSubmit,
    )

    const insufficientBalanceWarning = warnings.find((warning) => warning.type === WarningLabel.InsufficientFunds)
    const insufficientGasFundsWarning = warnings.find((warning) => warning.type === WarningLabel.InsufficientGasFunds)
    const priceImpactWarning = warnings.find((warning) => isPriceImpactWarning(warning))

    return {
      blockingWarning,
      formScreenWarning: getFormScreenWarning(warnings),
      insufficientBalanceWarning,
      insufficientGasFundsWarning,
      priceImpactWarning,
      reviewScreenWarning: getReviewScreenWarning(warnings),
      warnings,
    }
  }, [warnings])
}

// RWA geo-blocking has its own dedicated banner (RWAGeoBlockedCard), so it must not also render as
// an inline form/review warning (which would show a title-less alert icon).
function isInlineDisplayableWarning(warning: Warning): boolean {
  return warning.type !== WarningLabel.RWAGeoBlocked
}

function getReviewScreenWarning(warnings: Warning[]): ParsedWarnings['reviewScreenWarning'] | undefined {
  const reviewWarning = warnings.find(
    (warning) => warning.severity >= WarningSeverity.Medium && isInlineDisplayableWarning(warning),
  )

  if (!reviewWarning) {
    return undefined
  }

  return getWarningWithStyle({ warning: reviewWarning, displayedInline: true })
}

// This function decides which warning to show when there is more than one.
function getFormScreenWarning(warnings: Warning[]): ParsedWarnings['reviewScreenWarning'] | undefined {
  const insufficientBalanceWarning = warnings.find((warning) => warning.type === WarningLabel.InsufficientFunds)

  if (insufficientBalanceWarning) {
    return {
      warning: insufficientBalanceWarning,
      color: getAlertColor(WarningSeverity.Medium),
      Icon: null,
      displayedInline: false,
    }
  }

  const formWarning = warnings.find(
    (warning) => warning.severity >= WarningSeverity.Low && isInlineDisplayableWarning(warning),
  )

  if (!formWarning) {
    return undefined
  }

  // InsufficientGasFunds is displayed in a separate banner, rather than inline.
  const displayedInline = formWarning.type !== WarningLabel.InsufficientGasFunds

  return getWarningWithStyle({ warning: formWarning, displayedInline })
}

function getWarningWithStyle({
  warning,
  displayedInline,
}: {
  warning: Warning
  displayedInline: boolean
}): WarningWithStyle {
  return {
    warning,
    displayedInline,
    color: getAlertColor(warning.severity),
    Icon: warning.icon ?? null,
  }
}
