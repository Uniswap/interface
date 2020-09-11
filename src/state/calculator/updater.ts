import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import useInterval from '../../hooks/useInterval'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { AppDispatch, AppState } from '../index'
import { useFetchCalculatorGraphDataCallback } from '../../hooks/useFetchCalculatorGraphDataCallback'

export default function Updater(): null {
  const { library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const graphData = useSelector<AppState, AppState['calculator']['graphData']>(state => state.calculator.graphData)

  const isWindowVisible = useIsWindowVisible()

  const fetchCalculatorGraphData = useFetchCalculatorGraphDataCallback()

  const fetchAllCalculatorGraphData = useCallback(() => {
    if (!isWindowVisible) return

    fetchCalculatorGraphData('').catch(error => console.debug('interval list fetching error', error))
  }, [fetchCalculatorGraphData, isWindowVisible, graphData])

  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllCalculatorGraphData, library ? 1000 * 60 * 10 : null)

  return null
}
