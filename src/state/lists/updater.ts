import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../index'
import { fetchTokenList } from './actions'
import { DEFAULT_TOKEN_LIST_URL } from './hooks'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(fetchTokenList(DEFAULT_TOKEN_LIST_URL) as any)
  }, [dispatch])

  return null
}
