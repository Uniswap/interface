import { Navigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'

import CreatePool from './index'

export default function RedirectDuplicateTokenIds() {
  const { currencyIdA, currencyIdB } = useParams()
  if (currencyIdA?.toLowerCase() === currencyIdB?.toLowerCase()) {
    return <Navigate to={`${APP_PATHS.CLASSIC_CREATE_POOL}/${currencyIdA}`} replace />
  }
  return <CreatePool />
}
