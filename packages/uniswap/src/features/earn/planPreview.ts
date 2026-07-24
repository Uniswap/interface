import { TradingApi } from '@universe/api'

export function getEarnPreviewFromPlanResponse(
  planResponse: TradingApi.PlanResponse,
): TradingApi.EarnPreview | undefined {
  if (planResponse.earnIntent?.preview) {
    return planResponse.earnIntent.preview
  }

  if (!planResponse.earnIntent) {
    return undefined
  }

  const vaultDepositStep = planResponse.steps.find((step) => step.stepType === TradingApi.PlanStepType.VAULT_DEPOSIT)
  if (planResponse.earnIntent.action === TradingApi.EarnAction.DEPOSIT) {
    if (!vaultDepositStep?.tokenIn || !vaultDepositStep.tokenInChainId || !vaultDepositStep.tokenInAmount) {
      return undefined
    }

    return {
      type: TradingApi.EarnDepositPreview.type.DEPOSIT,
      depositAssets: [
        {
          token: vaultDepositStep.tokenIn,
          chainId: vaultDepositStep.tokenInChainId,
          amount: vaultDepositStep.tokenInAmount,
        },
      ],
      estimatedSharesOut: planResponse.expectedOutput,
    }
  }

  const vaultWithdrawStep = planResponse.steps.find((step) => step.stepType === TradingApi.PlanStepType.VAULT_WITHDRAW)
  if (!vaultWithdrawStep?.tokenInAmount || !vaultWithdrawStep.tokenOutAmount) {
    return undefined
  }

  if (planResponse.earnIntent.withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES) {
    return {
      type: TradingApi.EarnMaxSharesWithdrawPreview.type.MAX_SHARES_WITHDRAW,
      maxRedeemableSharesIn: vaultWithdrawStep.tokenInAmount,
      previewAssetsOut: vaultWithdrawStep.tokenOutAmount,
    }
  }

  return {
    type: TradingApi.EarnExactAssetsWithdrawPreview.type.EXACT_ASSETS_WITHDRAW,
    requestedAssetsOut: vaultWithdrawStep.tokenOutAmount,
    estimatedSharesIn: vaultWithdrawStep.tokenInAmount,
  }
}
