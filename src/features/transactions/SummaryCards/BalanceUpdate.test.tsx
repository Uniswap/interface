import { MockedResponse } from '@apollo/client/testing'
import React from 'react'
import { ChainId } from 'src/constants/chains'
import { SpotPricesDocument, SpotPricesQuery } from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import BalanceUpdate from 'src/features/transactions/SummaryCards/BalanceUpdate'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { TokenProjects } from 'src/test/gqlFixtures'
import { render, screen } from 'src/test/test-utils'
import { currencyId } from 'src/utils/currencyId'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)
const _currencyId = currencyId(ETH)

const mock: MockedResponse<SpotPricesQuery> = {
  request: {
    query: SpotPricesDocument,
    variables: {
      contracts: [currencyIdToContractInput(_currencyId)],
    },
  },
  result: {
    data: {
      tokenProjects: TokenProjects,
    },
  },
}

describe(BalanceUpdate, () => {
  it('renders without error after fetching data', async () => {
    const tree = render(
      <BalanceUpdate
        amountRaw="10000.00"
        currency={ETH}
        transactionStatus={TransactionStatus.Success}
        transactionType={TransactionType.Receive}
      />,
      { mocks: [mock] }
    )

    // loading
    expect(tree.toJSON()).toBeNull()

    // success
    expect(await screen.findByText('+ETH')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('skips fetching data when passing in the USD value', async () => {
    const tree = render(
      <BalanceUpdate
        amountRaw="10000.00"
        currency={ETH}
        transactedUSDValue={100}
        transactionStatus={TransactionStatus.Success}
        transactionType={TransactionType.Receive}
      />,
      { mocks: [mock] }
    )

    // no loading because the call is skipped
    expect(screen.getByText('$100.00')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
