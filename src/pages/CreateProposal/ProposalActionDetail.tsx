import React from 'react'
import AddressInputPanel from 'components/AddressInputPanel'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import styled from 'styled-components/macro'
import { ProposalAction } from './ProposalActionSelector'
import { Currency } from '@uniswap/sdk-core'
import { Trans } from '@lingui/macro'

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
  currency: Currency | undefined
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
  }

  return (
    <ProposalActionDetailContainer className={className}>
      <p>Input as much detail as possible below about why you believe this is the direction Kiba Inu should be heading.</p>
    </ProposalActionDetailContainer>
  )
}
