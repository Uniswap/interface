import { Percent } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import {
  TOKEN_PROTECTION_FOT_FEE_BREAKPOINT,
  TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT,
  TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT,
  TokenProtectionWarning,
} from 'uniswap/src/features/tokens/safetyUtils'
import { FeeOnTransferWarning } from 'uniswap/src/features/transactions/swap/modals/FeeOnTransferWarning'

export type FeeOnTransferFeeGroupProps = {
  inputTokenInfo: TokenFeeInfo
  outputTokenInfo: TokenFeeInfo
}

export type TokenFeeInfo = {
  tokenSymbol: string
  fee: Percent
  formattedUsdAmount: string
}

export function getFeeSeverity(fee: Percent): {
  severity: WarningSeverity
  tokenProtectionWarning: TokenProtectionWarning
} {
  // WarningSeverity for styling. Same logic as getTokenWarningSeverity but without non-fee-related cases.
  // If fee >= 5% then HIGH, else 0% < fee < 5% then MEDIUM, else NONE
  const feeInt = parseFloat(fee.toFixed())
  if (feeInt >= TOKEN_PROTECTION_FOT_HONEYPOT_BREAKPOINT) {
    return {
      severity: WarningSeverity.High,
      tokenProtectionWarning: TokenProtectionWarning.MaliciousHoneypot,
    }
  } else if (feeInt >= TOKEN_PROTECTION_FOT_HIGH_FEE_BREAKPOINT) {
    return {
      severity: WarningSeverity.High,
      tokenProtectionWarning: TokenProtectionWarning.FotVeryHigh,
    }
  } else if (feeInt >= TOKEN_PROTECTION_FOT_FEE_BREAKPOINT) {
    return {
      severity: WarningSeverity.High,
      tokenProtectionWarning: TokenProtectionWarning.FotHigh,
    }
  } else if (feeInt >= 0) {
    return {
      severity: WarningSeverity.Medium,
      tokenProtectionWarning: TokenProtectionWarning.FotLow,
    }
  } else {
    return {
      severity: WarningSeverity.None,
      tokenProtectionWarning: TokenProtectionWarning.None,
    }
  }
}

export function FeeOnTransferFeeGroup({
  inputTokenInfo,
  outputTokenInfo,
}: FeeOnTransferFeeGroupProps): JSX.Element | null {
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      {inputTokenInfo.fee.greaterThan(0) && <FeeOnTransferFeeRow feeInfo={inputTokenInfo} />}
      {outputTokenInfo.fee.greaterThan(0) && <FeeOnTransferFeeRow feeInfo={outputTokenInfo} />}
    </Flex>
  )
}

function FeeOnTransferFeeRow({ feeInfo }: { feeInfo: TokenFeeInfo }): JSX.Element {
  const { t } = useTranslation()
  const { severity } = getFeeSeverity(feeInfo.fee)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <FeeOnTransferWarning feeInfo={feeInfo}>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.feeOnTransfer', { tokenSymbol: feeInfo.tokenSymbol })}
        </Text>
      </FeeOnTransferWarning>
      <Flex row alignItems="center" gap="$spacing4">
        <WarningIcon severity={severity} size="$icon.16" />
        <Text flex={0} variant="body3">
          {feeInfo.formattedUsdAmount}
        </Text>
      </Flex>
    </Flex>
  )
}
