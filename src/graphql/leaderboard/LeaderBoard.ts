import { gql, useQuery } from '@apollo/client'
import dayjs from 'dayjs'
import { apolloClient } from 'graphql/thegraph/apollo'
import { TimePeriodLeaderboard } from 'graphql/utils/util'
import { LeaderBoard } from 'pages/Leaderboard'
import { useMemo } from 'react'

export type LeaderBoard = {
  address: string
  date: number
  id: string
  totalVolume: string
  txCount: number
}

interface LeaderboardDataResponseWeek {
  userWeekDatas: LeaderBoard[]
}

interface LeaderBoarDataResponseMonth {
  userMonthDatas: LeaderBoard[]
}

interface LeaderBoarDataResponseAll {
  users: Omit<LeaderBoard, 'date' | 'address'>[]
}

const LEADERBOARD = gql`
  query leaderBoardAll {
    users(orderBy: totalVolume, first: 300, orderDirection: desc) {
      id
      txCount
      totalVolume
    }
  }
`

const LEADERBOARD_FILTERED = gql`
  query leaderBoardUser($address: Bytes!) {
    users(orderBy: totalVolume, first: 300, orderDirection: desc, where: { address: $address }) {
      id
      txCount
      totalVolume
    }
  }
`

const LEADERBOARDWEEK = gql`
  query leaderBoardWeek($startTime: Int!) {
    userWeekDatas(orderBy: date, first: 300, orderDirection: desc, where: { date: $startTime }) {
      id
      date
      txCount
      totalVolume
      address
    }
  }
`
const LEADERBOARDMONTH = gql`
  query leaderBoardMonth($startTime: Int!) {
    userMonthDatas(orderBy: date, first: 300, orderDirection: desc, where: { date: $startTime }) {
      id
      date
      txCount
      totalVolume
      address
    }
  }
`

/**
 * Fetch leaderboard
 */
export function useLeaderboardData(time: TimePeriodLeaderboard): {
  loading: boolean
  error: boolean
  data?: LeaderBoard[] | Omit<LeaderBoard, 'date' | 'address'>[]
} {
  const period = useMemo(() => {
    switch (time) {
      case TimePeriodLeaderboard.DAY:
        return 0
      case TimePeriodLeaderboard.WEEK:
        return 604800
      case TimePeriodLeaderboard.MONTH:
        return 2629743
    }
  }, [time])

  const utcCurrentTime = dayjs()
  const restTime = utcCurrentTime.unix() % period
  const startTimestamp = utcCurrentTime.unix() - restTime

  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery<LeaderboardDataResponseWeek>(LEADERBOARDWEEK, {
    client: apolloClient,
    variables: {
      startTime: startTimestamp,
    },
  })

  const {
    loading: loadingMonth,
    error: errorMonth,
    data: dataMonth,
  } = useQuery<LeaderBoarDataResponseMonth>(LEADERBOARDMONTH, {
    client: apolloClient,
    variables: {
      startTime: startTimestamp,
    },
  })

  const { loading, error, data } = useQuery<LeaderBoarDataResponseAll>(LEADERBOARD, {
    client: apolloClient,
  })

  const leaderBoard = useMemo(() => {
    switch (time) {
      case TimePeriodLeaderboard.DAY:
        return data?.users
      case TimePeriodLeaderboard.WEEK:
        return dataWeek?.userWeekDatas
      case TimePeriodLeaderboard.MONTH:
        return dataMonth?.userMonthDatas
    }
  }, [data, dataMonth, dataWeek, time])

  const anyError = Boolean(error && (errorWeek || errorMonth))
  const anyLoading = Boolean(loading && (loadingWeek || loadingMonth))

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  return {
    loading: anyLoading,
    error: anyError,
    data: leaderBoard,
  }
}

export default function useLeaderboardFilteredData(address: string): {
  loading: boolean
  error: boolean
  data?: Omit<LeaderBoard, 'date' | 'address'>[]
} {
  const { loading, error, data } = useQuery<LeaderBoarDataResponseAll>(LEADERBOARD_FILTERED, {
    client: apolloClient,
    variables: {
      address,
    },
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  return {
    loading: anyLoading,
    error: anyError,
    data: data?.users,
  }
}
