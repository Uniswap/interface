import { Redirect, RouteComponentProps } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'

import CreatePool from './index'

export default function RedirectDuplicateTokenIds(
  props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>,
) {
  const {
    match: {
      params: { currencyIdA, currencyIdB },
    },
  } = props
  if (currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Redirect to={`${APP_PATHS.CLASSIC_CREATE_POOL}/${currencyIdA}`} />
  }
  return <CreatePool {...props} />
}
