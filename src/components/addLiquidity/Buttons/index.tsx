import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useArgentWalletContract } from 'hooks/useArgentWalletContract'
import { Text } from 'rebass'
import { Field } from 'state/burn/actions'
import { ThemedText } from 'theme'

export function Buttons({
  currencies,
  depositADisabled,
  depositBDisabled,
  addIsUnsupported,
  parsedAmounts,
  errorMessage,
  invalidRange,
  setShowConfirm,
}: {
  currencies: { [field in Field]?: Currency }
  depositADisabled: boolean
  depositBDisabled: boolean
  addIsUnsupported: boolean
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  errorMessage: React.ReactNode
  invalidRange: boolean
  setShowConfirm: (value: React.SetStateAction<boolean>) => void
}) {
  const { account, chainId } = useWeb3React()
  const toggleWalletDrawer = useToggleAccountDrawer() // toggle wallet when disconnected
  const isValid = !errorMessage && !invalidRange

  const argentWalletContract = useArgentWalletContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB =
    !argentWalletContract && approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  return addIsUnsupported ? (
    <ButtonPrimary disabled={true} $borderRadius="12px" padding="12px">
      <ThemedText.DeprecatedMain mb="4px">
        <Trans id="unsupported-asset">Unsupported Asset</Trans>
      </ThemedText.DeprecatedMain>
    </ButtonPrimary>
  ) : !account ? (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
      properties={{ received_swap_quote: false }}
      element={InterfaceElementName.CONNECT_WALLET_BUTTON}
    >
      <ButtonLight onClick={toggleWalletDrawer} $borderRadius="12px" padding="12px">
        <Trans id="connect-wallet">Connect Wallet</Trans>
      </ButtonLight>
    </TraceEvent>
  ) : (
    <AutoColumn gap="md">
      {isValid && (
        <RowBetween>
          {showApprovalA && (
            <ButtonPrimary
              onClick={approveACallback}
              disabled={approvalA === ApprovalState.PENDING}
              width={showApprovalB ? '48%' : '100%'}
            >
              {approvalA === ApprovalState.PENDING ? (
                <Dots>
                  <Trans id="approving">Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                </Dots>
              ) : (
                <Trans id="approve">Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
              )}
            </ButtonPrimary>
          )}
          {showApprovalB && (
            <ButtonPrimary
              onClick={approveBCallback}
              disabled={approvalB === ApprovalState.PENDING}
              width={showApprovalA ? '48%' : '100%'}
            >
              {approvalB === ApprovalState.PENDING ? (
                <Dots>
                  <Trans id="approving">Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                </Dots>
              ) : (
                <Trans id="approve">Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
              )}
            </ButtonPrimary>
          )}
        </RowBetween>
      )}
      <ButtonError
        onClick={() => {
          setShowConfirm(true)
        }}
        disabled={
          !isValid ||
          (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
          (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)
        }
        error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
      >
        <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
      </ButtonError>
    </AutoColumn>
  )
}
