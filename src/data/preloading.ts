import { AppStackParamList } from 'src/app/navigation/types'
import { ChainId } from 'src/constants/chains'
import { Screens } from 'src/screens/Screens'
import { ActivityScreenQuery$variables } from 'src/screens/__generated__/ActivityScreenQuery.graphql'
import { TokenDetailsScreenQuery$variables } from 'src/screens/__generated__/TokenDetailsScreenQuery.graphql'
import { UserScreenQuery$variables } from 'src/screens/__generated__/UserScreenQuery.graphql'
import { toGraphQLChain } from 'src/utils/chainId'
import { currencyIdToAddress, currencyIdToChain } from 'src/utils/currencyId'

/** Helper to map from screen params to query variables. */
export const preloadMapping = {
  tokenDetails: ({
    currencyId,
  }: Omit<
    AppStackParamList[Screens.TokenDetails],
    'preloadedQuery'
  >): TokenDetailsScreenQuery$variables => {
    return {
      contract: {
        chain: toGraphQLChain(currencyIdToChain(currencyId) ?? ChainId.Mainnet) ?? 'ETHEREUM',
        address: currencyIdToAddress(currencyId),
      },
    }
  },
  activity: ({ address }: ActivityScreenQuery$variables) => {
    return {
      address,
    }
  },
  user: ({ address }: UserScreenQuery$variables) => {
    return {
      address,
    }
  },
}
