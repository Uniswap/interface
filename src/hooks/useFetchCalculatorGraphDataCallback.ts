import { nanoid } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../state'
import { CalculatorGraphData } from '../state/calculator/reducer'
import getCalculatorGraphData from '../utils/getCalculatorGraphData'
import { fetchCalculatorGraphData } from '../state/calculator/actions'

export function useFetchCalculatorGraphDataCallback(): (listUrl: string) => Promise<CalculatorGraphData> {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    async (listUrl: string) => {
      const requestId = nanoid()
      dispatch(fetchCalculatorGraphData.pending({ requestId, url: listUrl }))
      return getCalculatorGraphData(listUrl)
        .then(graphData => {
          dispatch(fetchCalculatorGraphData.fulfilled({ url: listUrl, graphData, requestId }))
          return graphData
        })
        .catch(error => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          dispatch(fetchCalculatorGraphData.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch]
  )
}
