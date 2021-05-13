import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'state'
import { updateUserExpertMode } from '../state/user/actions'
import useParsedQueryString from './useParsedQueryString'

export default function ApeModeQueryParamReader(): null {
  useApeModeQueryParamReader()
  return null
}

function useApeModeQueryParamReader() {
  const dispatch = useDispatch<AppDispatch>()
  const { ape } = useParsedQueryString()

  useEffect(() => {
    if (typeof ape !== 'string') return

    dispatch(updateUserExpertMode({ userExpertMode: ape.toLowerCase() === 'true' }))
  })
}
