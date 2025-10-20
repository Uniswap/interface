import { ApolloLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GQLQueries } from '@universe/api'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { logger } from 'utilities/src/logger/logger'
import { createOnRampTransactionsAuth, ON_RAMP_AUTH_MAX_LIMIT } from 'wallet/src/data/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export function getOnRampAuthLink(accounts: Record<string, Account>, signerManager: SignerManager): ApolloLink {
  return setContext(async (operation, prevContext) => {
    const account = accounts[operation.variables?.address]

    if (account?.type !== AccountType.SignerMnemonic || operation.operationName !== GQLQueries.TransactionList) {
      return prevContext
    }

    try {
      const onRampAuth = await createOnRampTransactionsAuth({
        limit: ON_RAMP_AUTH_MAX_LIMIT,
        account,
        signerManager,
      })

      return {
        ...prevContext,
        onRampAuth,
      }
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'onRampAuthLink.ts',
          function: 'getOnRampAuthLink',
        },
        extra: {
          address: account.address,
        },
      })

      return prevContext
    }
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
