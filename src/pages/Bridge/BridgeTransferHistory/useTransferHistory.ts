import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { KS_SETTING_API } from 'constants/env'
import useGetBridgeTransfers from 'hooks/bridge/useGetBridgeTransfers'
import { setHistoryURL } from 'state/bridge/actions'

import { ITEMS_PER_PAGE } from '../consts'

const useTransferHistory = (account: string) => {
  const dispatch = useDispatch()
  const [page, setPage] = useState(1)

  const swrKey = account
    ? `${KS_SETTING_API}/v1/multichain-transfers?userAddress=${account}&page=${page}&pageSize=${ITEMS_PER_PAGE}`
    : ''
  const { data, isValidating, error } = useGetBridgeTransfers(swrKey)

  const transfers = useMemo(() => {
    if (data) return data.data.transfers
    return []
  }, [data])

  const canGoPrevious = page !== 1
  const maxPage = data?.data?.pagination?.totalItems
    ? Math.floor((data.data.pagination.totalItems - 1) / ITEMS_PER_PAGE) + 1
    : 1
  const canGoNext = page < maxPage

  const onClickPrevious = () => {
    if (!canGoPrevious) {
      return
    }
    setPage(page - 1)
  }

  const onClickNext = () => {
    if (!canGoNext) {
      return
    }
    setPage(page + 1)
  }

  const range = useMemo(() => [ITEMS_PER_PAGE * (page - 1) + 1, Math.min(ITEMS_PER_PAGE * page)], [page])

  useEffect(() => {
    dispatch(setHistoryURL(swrKey))
  }, [dispatch, swrKey])

  return {
    range,
    transfers,
    isValidating,
    error,
    canGoNext,
    canGoPrevious,
    onClickNext,
    onClickPrevious,
    isCompletelyEmpty: page === 1 && transfers.length === 0,
  }
}

export default useTransferHistory
