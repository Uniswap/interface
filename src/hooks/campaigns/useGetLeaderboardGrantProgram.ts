import axios from 'axios'
import { stringify } from 'querystring'
import useSWR, { mutate } from 'swr'

import { SWR_KEYS } from 'constants/index'
import { ProjectRanking } from 'types/grantProgram'

export type RankByParam = 'total_participants' | 'total_trades' | 'total_volume'

type LeaderBoardData = {
  totalItems: number
  rankings: ProjectRanking[]
}

type Response = {
  code: number
  message: string
  data?: LeaderBoardData
}

const generateUrl = ({ id, rankBy, page = 1, pageSize = 5 }: Args) => {
  if (!id || !rankBy) {
    return ''
  }

  return `${SWR_KEYS.getGrantProgramLeaderBoard(id)}?${stringify({ rankBy, page, pageSize })}`
}

type Args = { id?: number; rankBy: RankByParam; page?: number; pageSize?: number }

const useGetLeaderboardGrantProgram = (args: Args) => {
  const url = generateUrl(args)
  const swrData = useSWR<LeaderBoardData>(
    url,
    async (url: string) => {
      const response = await axios.get<Response>(url)
      if (response?.data?.data) {
        return response.data.data
      }

      throw new Error(response?.data?.message || 'Something went wrong while fetching the leader board data')
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  )

  const refresh = () => {
    mutate(url)
  }

  return {
    swrData,
    refresh,
  }
}

export default useGetLeaderboardGrantProgram
