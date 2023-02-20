import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'

import {
  ButtonApprove,
  ButtonError,
  ButtonLight,
  ButtonPrimary,
  ButtonWarning,
  ButtonWithInfoHelper,
} from 'components/Button'
import ProgressSteps from 'components/ProgressSteps'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useWalletModalToggle } from 'state/application/hooks'

export default function ActionButtonLimitOrder({
  showWrap,
  approval,
  currencyIn,
  isWrappingEth,
  wrapInputError,
  approveCallback,
  onWrapToken,
  checkingAllowance,
  showPreview,
  isNotFillAllInput,
  enoughAllowance,
  hasInputError,
  approvalSubmitted,
  showApproveFlow,
  showWarning,
}: {
  currencyIn: Currency | undefined
  approval: ApprovalState
  showWrap: boolean
  isWrappingEth: boolean
  isNotFillAllInput: boolean
  hasInputError: boolean
  approvalSubmitted: boolean
  enoughAllowance: boolean
  checkingAllowance: boolean
  showApproveFlow: boolean
  wrapInputError: any
  showWarning: boolean
  approveCallback: () => Promise<void>
  onWrapToken: () => Promise<void>
  showPreview: () => void
}) {
  const disableBtnApproved =
    approval === ApprovalState.PENDING ||
    ((approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!hasInputError) && enoughAllowance)

  const disableBtnReview =
    checkingAllowance ||
    isNotFillAllInput ||
    !!hasInputError ||
    approval !== ApprovalState.APPROVED ||
    isWrappingEth ||
    (showWrap && !isWrappingEth)

  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  if (!account)
    return (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    )

  if (showApproveFlow || showWrap)
    return (
      <>
        <RowBetween>
          {showWrap ? (
            <ButtonWithInfoHelper
              loading={isWrappingEth}
              tooltipMsg={t`You will need to wrap your ${currencyIn?.symbol} to ${currencyIn?.wrapped.symbol} before you can place a limit order. Your tokens will be exchanged 1 to 1.`}
              text={isWrappingEth ? t`Wrapping` : t`Wrap ${currencyIn?.symbol}`}
              onClick={onWrapToken}
              disabled={Boolean(wrapInputError) || isNotFillAllInput || isWrappingEth}
            />
          ) : (
            <ButtonApprove
              forceApprove={!enoughAllowance}
              tokenSymbol={currencyIn?.symbol}
              tooltipMsg={t`You need to first allow KyberSwap smart contracts to use your ${currencyIn?.symbol}. This has to be done only once for each token.`}
              approveCallback={approveCallback}
              disabled={!!disableBtnApproved}
              approval={approval}
            />
          )}
          <ButtonError width="48%" id="swap-button" disabled={disableBtnReview} onClick={showPreview}>
            <Text fontSize={16} fontWeight={500}>
              <Trans>Review Order</Trans>
            </Text>
          </ButtonError>
        </RowBetween>
        {showApproveFlow && <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />}
      </>
    )

  const contentButton = (
    <Text fontWeight={500}>
      {checkingAllowance ? <Trans>Checking Allowance...</Trans> : <Trans>Review Order</Trans>}
    </Text>
  )
  if (showWarning && !disableBtnReview) return <ButtonWarning onClick={showPreview}>{contentButton}</ButtonWarning>
  return (
    <ButtonPrimary onClick={showPreview} disabled={disableBtnReview}>
      {contentButton}
    </ButtonPrimary>
  )
}
