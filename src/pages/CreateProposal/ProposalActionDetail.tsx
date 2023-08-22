import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import AddressInputPanel from 'components/AddressInputPanel'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import React from 'react'
import styled from 'styled-components'

import { ProposalAction } from './ProposalActionSelector'

enum ProposalActionDetailField {
  ADDRESS,
  CURRENCY,
}

const ProposalActionDetailContainer = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 10px;
`

export const ProposalActionDetail = ({
  className,
  proposalAction,
  currency,
  amount,
  toAddress,
  onCurrencySelect,
  onAmountInput,
  onToAddressInput,
}: {
  className?: string
  proposalAction: ProposalAction
  currency?: Currency
  amount: string
  toAddress: string
  onCurrencySelect: (currency: Currency) => void
  onAmountInput: (amount: string) => void
  onToAddressInput: (address: string) => void
}) => {
  const proposalActionsData = {
    [ProposalAction.TRANSFER_TOKEN]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>To</Trans>,
      },
      {
        type: ProposalActionDetailField.CURRENCY,
      },
    ],
    [ProposalAction.APPROVE_TOKEN]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>To</Trans>,
      },
      {
        type: ProposalActionDetailField.CURRENCY,
      },
    ],
    [ProposalAction.UPGRADE_IMPLEMENTATION]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>New Pool Implementation</Trans>,
      },
    ],
    [ProposalAction.UPGRADE_GOVERNANCE]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>New Governance Implementation</Trans>,
      },
    ],
    [ProposalAction.UPGRADE_STAKING]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>New Staking Implementation</Trans>,
      },
    ],
    [ProposalAction.ADD_ADAPTER]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>New Application Adapter</Trans>,
      },
    ],
    [ProposalAction.REMOVE_ADAPTER]: [
      {
        type: ProposalActionDetailField.ADDRESS,
        label: <Trans>Existing Application Adapter</Trans>,
      },
    ],
  }

  return (
    <ProposalActionDetailContainer className={className}>
      {proposalActionsData[proposalAction].map((field, i) =>
        field.type === ProposalActionDetailField.ADDRESS ? (
          <AddressInputPanel key={i} label={field.label} value={toAddress} onChange={onToAddressInput} />
        ) : field.type === ProposalActionDetailField.CURRENCY ? (
          <CurrencyInputPanel
            key={i}
            value={amount}
            currency={currency}
            onUserInput={(amount: string) => onAmountInput(amount)}
            onCurrencySelect={(currency: Currency) => onCurrencySelect(currency)}
            showMaxButton={false}
            showCommonBases={false}
            showCurrencyAmount={false}
            disableNonToken={true}
            hideBalance={true}
            id="currency-input"
          />
        ) : null
      )}
    </ProposalActionDetailContainer>
  )
}
