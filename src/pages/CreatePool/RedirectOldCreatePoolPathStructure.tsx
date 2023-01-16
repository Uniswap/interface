import { Navigate, useParams } from 'react-router-dom'

import CreatePool from './index'

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40})-(0x[a-fA-F0-9]{40})$/
export default function RedirectOldCreatePoolPathStructure() {
  const { currencyIdA } = useParams()

  const match = currencyIdA?.match(OLD_PATH_STRUCTURE)
  if (match?.length) {
    return <Navigate to={`/create/${match[1]}/${match[2]}`} replace />
  }

  return <CreatePool />
}
