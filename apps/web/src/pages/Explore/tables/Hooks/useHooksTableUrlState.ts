import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useHref, useLocation, useNavigate } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'
import { OrderDirection } from '~/data/util'
import type { HookFilterState } from '~/features/Hooks/hookFilters'
import type { HookSortField } from '~/features/Hooks/types'
import {
  type HooksTableUrlState,
  parseHooksTableParams,
  serializeHooksTableParams,
} from '~/pages/Explore/tables/Hooks/hooksTableUrlState'
import { isBrowserRouterEnabled } from '~/utils/env'

function getCurrentRouteUrl(): URL {
  return new URL(isBrowserRouterEnabled() ? window.location.href : window.location.hash.slice(1), window.location.href)
}

interface UseHooksTableUrlStateResult extends HooksTableUrlState {
  searchDraft: string
  setSearch: (value: string) => void
  setSort: (field: HookSortField) => OrderDirection
  setFilters: (value: HookFilterState) => void
}

// nuqs setters queue uncancellable writes, so input events schedule one cancellable router commit.
export function useHooksTableUrlState(): UseHooksTableUrlStateResult {
  const location = useLocation()
  const navigate = useNavigate()
  const state = parseHooksTableParams(new URLSearchParams(location.search))
  const [draft, setDraft] = useState(state.search)
  const pendingSearch = useRef<{ timer: ReturnType<typeof setTimeout>; originHref: string; value: string } | undefined>(
    undefined,
  )
  const renderedHref = new URL(useHref(location), window.location.href).href

  const cancelPendingSearch = useEvent(() => {
    clearTimeout(pendingSearch.current?.timer)
    pendingSearch.current = undefined
  })

  useLayoutEffect(() => {
    // Preserve typing that began after history changed but before React committed that navigation.
    if (pendingSearch.current?.originHref !== renderedHref) {
      cancelPendingSearch()
      setDraft((current) => (current.trim() === state.search ? current : state.search))
    }
  }, [cancelPendingSearch, location.key, renderedHref, state.search])

  const resetAfterHistoryNavigation = useEvent(() => {
    cancelPendingSearch()
    setDraft(parseHooksTableParams(getCurrentRouteUrl().searchParams).search)
  })

  useEffect(() => {
    window.addEventListener('popstate', resetAfterHistoryNavigation)
    return () => {
      window.removeEventListener('popstate', resetAfterHistoryNavigation)
      cancelPendingSearch()
    }
  }, [cancelPendingSearch, resetAfterHistoryNavigation])

  const commit = useEvent((changes: Parameters<typeof serializeHooksTableParams>[1]) => {
    const currentUrl = getCurrentRouteUrl()
    const search = serializeHooksTableParams(currentUrl.searchParams, changes)
    if (search === currentUrl.search) {
      return
    }
    void navigate({ pathname: currentUrl.pathname, search, hash: currentUrl.hash }, { preventScrollReset: true })
  })

  const setSearch = useEvent((value: string) => {
    cancelPendingSearch()
    setDraft(value)
    if (value === '') {
      commit({ search: null })
      return
    }
    const scheduledHref = window.location.href
    const timer = setTimeout(() => {
      pendingSearch.current = undefined
      if (window.location.href === scheduledHref) {
        commit({ search: value.trim() })
      }
    }, 300)
    pendingSearch.current = { timer, originHref: scheduledHref, value }
  })

  const flushSearchDraft = useEvent((committedSearch: string) => {
    const pending = pendingSearch.current
    const search = (pending?.originHref === window.location.href ? pending.value : committedSearch).trim()
    cancelPendingSearch()
    setDraft(search)
    return search
  })

  const setSort = useEvent((sortField: HookSortField) => {
    const currentState = parseHooksTableParams(getCurrentRouteUrl().searchParams)
    const search = flushSearchDraft(currentState.search)
    const sortDirection =
      currentState.sortField === sortField && currentState.sortDirection === OrderDirection.Desc
        ? OrderDirection.Asc
        : OrderDirection.Desc
    commit({ search, sortField, sortDirection })
    return sortDirection
  })

  const setFilters = useEvent((filters: HookFilterState) => {
    const currentState = parseHooksTableParams(getCurrentRouteUrl().searchParams)
    const search = flushSearchDraft(currentState.search)
    commit({ search, filters })
  })

  return {
    ...state,
    searchDraft: draft,
    setSearch,
    setSort,
    setFilters,
  }
}
