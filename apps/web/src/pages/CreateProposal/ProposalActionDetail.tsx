import { Currency } from '@uniswap/sdk-core'
import AddressInputPanel from 'components/AddressInputPanel'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Trans } from 'i18n'
import styled from 'styled-components'

import { CurrencySearchFilters } from 'components/SearchModal/CurrencySearch'
import { ProposalAction } from './ProposalActionSelector'

enum ProposalActionDetailField {
  ADDRESS,
  CURRENCY,
}

const ProposalActionDetailContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  > * {
    width: 100%;
  }
  > :not(:last-child) {
    margin-bottom: 10px;
  }
`

const CREATE_PROPOSAL_CURRENCY_SEARCH_FILTERS: CurrencySearchFilters = {
  disableNonToken: true,
  showCommonBases: false,
}

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
            showCurrencyAmount={false}
            hideBalance
            id="currency-input"
            currencySearchFilters={CREATE_PROPOSAL_CURRENCY_SEARCH_FILTERS}
          />
        ) : null
      )}
    </ProposalActionDetailContainer>
  )
}
