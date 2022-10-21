import { AppStackParamList } from 'src/app/navigation/types'
import { TransactionListQuery$variables } from 'src/components/TransactionList/__generated__/TransactionListQuery.graphql'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { Screens } from 'src/screens/Screens'
import { TokenDetailsScreenQuery$variables } from 'src/screens/__generated__/TokenDetailsScreenQuery.graphql'

/** Helper to map from screen params to query variables. */
export const preloadMapping = {
  tokenDetails: ({
    currencyId,
  }: Omit<
    AppStackParamList[Screens.TokenDetails],
    'preloadedQuery'
  >): TokenDetailsScreenQuery$variables => {
    return {
      contract: currencyIdToContractInput(currencyId),
    }
  },
  activity: ({ address }: TransactionListQuery$variables) => {
    return {
      address,
    }
  },
  externalProfile: ({ address }: TransactionListQuery$variables) => {
    return {
      address,
    }
  },
}
