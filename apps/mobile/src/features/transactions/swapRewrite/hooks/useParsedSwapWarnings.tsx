import { FunctionComponent, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SvgProps } from 'react-native-svg'
import {
  Warning,
  WarningAction,
  WarningColor,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { useSwapWarnings } from 'src/features/transactions/swap/useSwapWarnings'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { useSwapTxContext } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { useTransactionGasWarning } from 'src/features/transactions/useTransactionGasWarning'
import { Icons } from 'ui/src'

export type ParsedWarnings = {
  blockingWarning?: Warning
  insufficientBalanceWarning?: Warning
  mainWarning?: {
    warning: Warning
    color: WarningColor
    Icon: FunctionComponent<SvgProps> | typeof Icons.AlertTriangle | null
  }
  warnings: Warning[]
}

export function useParsedSwapWarnings(): ParsedWarnings {
  const { t } = useTranslation()
  const { derivedSwapInfo } = useSwapFormContext()
  const { gasFee } = useSwapTxContext()

  const swapWarnings = useSwapWarnings(t, derivedSwapInfo)

  const gasWarning = useTransactionGasWarning({
    derivedInfo: derivedSwapInfo,
    gasFee: gasFee.value,
  })

  return useMemo(() => {
    const warnings = !gasWarning ? swapWarnings : [...swapWarnings, gasWarning]

    const blockingWarning = warnings.find(
      (warning) => warning.action === WarningAction.DisableReview
    )

    const insufficientBalanceWarning = warnings.find(
      (warning) => warning.type === WarningLabel.InsufficientFunds
    )

    return {
      blockingWarning,
      insufficientBalanceWarning,
      mainWarning: getMainWarning(warnings),
      warnings,
    }
  }, [gasWarning, swapWarnings])
}

// This function decides which warning to show when there is more than one.
function getMainWarning(warnings: Warning[]): ParsedWarnings['mainWarning'] | undefined {
  const insufficientBalanceWarning = warnings.find(
    (warning) => warning.type === WarningLabel.InsufficientFunds
  )

  if (insufficientBalanceWarning) {
    return {
      warning: insufficientBalanceWarning,
      color: getAlertColor(WarningSeverity.Medium),
      Icon: null,
    }
  }

  const mainWarning = warnings.find(
    (warning) =>
      warning.type === WarningLabel.InsufficientFunds || warning.severity >= WarningSeverity.Low
  )

  if (!mainWarning) {
    return undefined
  }

  const mainWarningColor = getAlertColor(mainWarning?.severity)
  const mainWarningIcon = mainWarning?.icon ?? Icons.AlertTriangle

  return {
    warning: mainWarning,
    color: mainWarningColor,
    Icon: mainWarningIcon,
  }
}

function getAlertColor(severity?: WarningSeverity): WarningColor {
  switch (severity) {
    case WarningSeverity.None:
      return {
        text: '$neutral2',
        background: '$neutral2',
        buttonTheme: 'secondary',
      }
    case WarningSeverity.Low:
      return {
        text: '$neutral2',
        background: '$surface2',
        buttonTheme: 'tertiary',
      }
    case WarningSeverity.High:
      return {
        text: '$statusCritical',
        background: '$DEP_accentCriticalSoft',
        buttonTheme: 'detrimental',
      }
    case WarningSeverity.Medium:
      return {
        text: '$statusCritical',
        background: '$DEP_accentWarningSoft',
        buttonTheme: 'warning',
      }
    default:
      return {
        text: '$neutral2',
        background: '$transparent',
        buttonTheme: 'tertiary',
      }
  }
}
