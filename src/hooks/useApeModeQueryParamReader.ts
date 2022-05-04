import { useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'

import { updateUserExpertMode } from '../state/user/reducer'
import useParsedQueryString from './useParsedQueryString'

export default function ApeModeQueryParamReader(): null {
  useApeModeQueryParamReader()
  return null
}

function useApeModeQueryParamReader() {
  const dispatch = useAppDispatch()
  const { ape } = useParsedQueryString()

  useEffect(() => {
    if (typeof ape !== 'string') return
    if (ape === '' || ape.toLowerCase() === 'true') {
      dispatch(updateUserExpertMode({ userExpertMode: true }))
    }
  })
}
