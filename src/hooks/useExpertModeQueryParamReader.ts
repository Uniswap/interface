import { parse } from 'qs'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'
import { AppDispatch } from 'state'
import { updateUserExpertMode } from '../state/user/actions'

export default function ExpertModeQueryParamReader({ location: { search } }: RouteComponentProps): null {
  return useExpertModeQueryParamReader(search)
}

function useExpertModeQueryParamReader(search: string): null {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!search) return

    const parsed = parse(search, {
      parseArrays: false,
      ignoreQueryPrefix: true,
    })

    console.log(parsed)
    const expertMode = parsed['expert_mode'] || parsed.ape

    if (typeof expertMode !== 'string') return

    dispatch(updateUserExpertMode({ userExpertMode: expertMode.toLowerCase() === 'true' }))
  }, [dispatch, search])

  return null
}
