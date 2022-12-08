import axios from 'axios'
import useSWR from 'swr'

import { SWR_KEYS } from 'constants/index'
import { GrantProgram } from 'types/grantProgram'

type Response = {
  code: number
  message: string
  data?: GrantProgram
}

const useGetGrantProgram = (id = 'latest') => {
  return useSWR<GrantProgram>(
    `${SWR_KEYS.getGrantProgram(id)}`,
    async (url: string) => {
      const response = await axios.get<Response>(url)

      if (response?.data?.data) {
        return response.data.data
      }

      throw new Error(response?.data?.message || 'Something went wrong while fetching the latest grant program')
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  )
}

export default useGetGrantProgram
