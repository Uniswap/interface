import { EventFilter } from '@ethersproject/contracts'
import { useActiveWeb3React } from './web3'

export interface LogsResponse<Data, Error> {
  data?: Data
  error?: Error
}

export default function useLogs<Data = any, Error = any>(
  filters: EventFilter | EventFilter[]
): LogsResponse<Data, Error> {
  const { library } = useActiveWeb3React()
  const response: LogsResponse<Data, Error> = {}
  if (!library) {
    return response
  }
  if (Array.isArray(filters)) {
    return response
  } else {
    library.getLogs(filters)
    return response
  }
}
