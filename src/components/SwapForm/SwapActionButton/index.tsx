import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column/index'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import SwapOnlyButton from 'components/SwapForm/SwapActionButton/SwapOnlyButton'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { SwapCallbackError } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { WrapType } from 'hooks/useWrapCallback'
import { useWalletModalToggle } from 'state/application/hooks'
import { DetailedRouteSummary } from 'types/route'

import { Props as SwapOnlyButtonProps } from './SwapOnlyButton'

const CustomPrimaryButton = styled(ButtonPrimary).attrs({
  id: 'swap-button',
})`
  border: none;
  font-weight: 500;

  &:disabled {
    border: none;
  }
`

type Props = {
  isAdvancedMode: boolean
  isGettingRoute: boolean
  isProcessingSwap: boolean

  typedValue: string
  parsedAmountFromTypedValue: CurrencyAmount<Currency> | undefined
  routeSummary: DetailedRouteSummary | undefined

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  swapInputError: string | undefined
  wrapInputError: string | undefined
  wrapType: WrapType

  setProcessingSwap: React.Dispatch<React.SetStateAction<boolean>>
  onWrap: (() => Promise<string | undefined>) | undefined
  buildRoute: () => Promise<BuildRouteResult>
}

const SwapActionButton: React.FC<Props> = ({
  isAdvancedMode,
  isGettingRoute,
  isProcessingSwap,

  typedValue,
  parsedAmountFromTypedValue,
  routeSummary,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,

  swapInputError,
  wrapInputError,
  wrapType,

  setProcessingSwap,
  onWrap,
  buildRoute,
}) => {
  const { account } = useActiveWeb3React()

  const [errorWhileSwap, setErrorWhileSwap] = useState('')
  const noRouteFound = routeSummary && !routeSummary.route

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmountFromTypedValue && !parsedAmountFromTypedValue.equalTo(0),
  )

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallback(parsedAmountFromTypedValue, routeSummary?.routerAddress)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  useEffect(() => {
    // reset approval submitted when input token changes
    if (!isProcessingSwap) {
      setApprovalSubmitted(false)
    }
  }, [currencyIn, typedValue, isProcessingSwap])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const renderButton = () => {
    if (!account) {
      return (
        <ButtonLight onClick={toggleWalletModal}>
          <Trans>Connect Wallet</Trans>
        </ButtonLight>
      )
    }

    if (wrapInputError) {
      return <CustomPrimaryButton disabled>{wrapInputError}</CustomPrimaryButton>
    }

    if (showWrap) {
      return (
        <CustomPrimaryButton onClick={onWrap}>
          {wrapType === WrapType.WRAP ? <Trans>Wrap</Trans> : <Trans>Unwrap</Trans>}
        </CustomPrimaryButton>
      )
    }

    if (userHasSpecifiedInputOutput && noRouteFound) {
      return (
        <CustomPrimaryButton disabled>
          <Trans>Insufficient liquidity for this trade</Trans>
        </CustomPrimaryButton>
      )
    }

    if (swapInputError) {
      return <CustomPrimaryButton disabled>{swapInputError}</CustomPrimaryButton>
    }

    const swapOnlyButtonProps: SwapOnlyButtonProps = {
      isAdvancedMode,
      routeSummary,
      isGettingRoute,
      isProcessingSwap,

      currencyIn,
      currencyOut,
      balanceIn,
      balanceOut,
      parsedAmount: parsedAmountFromTypedValue,

      setProcessingSwap,
      setErrorWhileSwap,
      buildRoute,

      isDisabled: !routeSummary || approval !== ApprovalState.APPROVED,
    }

    if (showApproveFlow) {
      return (
        <>
          <RowBetween>
            <ButtonConfirmed
              onClick={approveCallback}
              disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
              width="48%"
              altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
              confirmed={approval === ApprovalState.APPROVED}
              style={{
                border: 'none',
              }}
            >
              {approval === ApprovalState.PENDING ? (
                <AutoRow gap="6px" justify="center">
                  <Trans>Approving</Trans> <Loader stroke="white" />
                </AutoRow>
              ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                <Trans>Approved</Trans>
              ) : (
                <Trans>Approve ${currencyIn?.symbol}</Trans>
              )}
            </ButtonConfirmed>

            <SwapOnlyButton minimal {...swapOnlyButtonProps} />
          </RowBetween>
          <Column style={{ marginTop: '1rem' }}>
            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
          </Column>
        </>
      )
    }

    return <SwapOnlyButton {...swapOnlyButtonProps} />
  }

  useEffect(() => {
    setErrorWhileSwap('')
  }, [typedValue])

  return (
    <>
      {renderButton()}
      {isAdvancedMode && errorWhileSwap ? (
        <SwapCallbackError style={{ margin: 0, zIndex: 'unset' }} error={errorWhileSwap} />
      ) : null}
    </>
  )
}

export default SwapActionButton
