import AddLiquidityV2 from './index'
import { Redirect } from 'pages/Swap/redirects'

export function RedirectDuplicateTokenIdsV2(props: any) {
  const {
    match: {
      params: { currencyIdA, currencyIdB },
    },
  } = props

  if (currencyIdA && currencyIdB && currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Redirect to={`/add/v2/${currencyIdA}`} />
  }

  return <AddLiquidityV2 {...props} />
}
