import axios from 'axios'
import useSWR from 'swr'

import { SWR_KEYS } from 'constants/index'
import { GrantProgram } from 'types/grantProgram'

type Response = {
  code: number
  message: string
  data?: {
    totalItems: number
    competitions: GrantProgram[]
  }
}

const useGetGrantPrograms = () => {
  return useSWR<Response>(
    SWR_KEYS.getListGrantPrograms,
    async (url: string) => {
      const { data: response } = await axios({
        method: 'GET',
        url,
        params: {
          page: 1,
          pageSize: 100,
        },
      })

      return response
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )
}

export default useGetGrantPrograms
