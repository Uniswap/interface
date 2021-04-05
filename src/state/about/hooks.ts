import { useQuery } from '@apollo/client'

import { GLOBAL_DATA } from 'apollo/queries'

export function useGlobalData() {
  return useQuery(GLOBAL_DATA())
}
