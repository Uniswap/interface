import { ApolloLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { ON_RAMP_AUTH_MAX_LIMIT, createOnRampTransactionsAuth } from 'wallet/src/data/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export function getOnRampAuthLink(accounts: Record<string, Account>, signerManager: SignerManager): ApolloLink {
  return setContext((operation, prevContext) => {
    const account = accounts[operation.variables?.address]
    if (!account || operation.operationName !== GQLQueries.TransactionList) {
      return prevContext
    }

    return createOnRampTransactionsAuth(ON_RAMP_AUTH_MAX_LIMIT, account, signerManager).then((onRampAuth) => {
      return {
        ...prevContext,
        onRampAuth,
      }
    })
  }).concat((operation, forward) => {
    if (operation.getContext().onRampAuth) {
      operation.variables = {
        ...operation.variables,
        onRampAuth: operation.getContext().onRampAuth,
      }
    }
    return forward(operation)
  })
}
