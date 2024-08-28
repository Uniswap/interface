import { parse, ParsedQs } from 'qs'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export default function useParsedQueryString(): ParsedQs {
  const { search } = useLocation()
  return useMemo(() => {
    const hash = window.location.hash
    const query = search || hash.substr(hash.indexOf('?'))

    return query && query.length > 1 ? parse(query, { parseArrays: false, ignoreQueryPrefix: true }) : {}
  }, [search])
}
