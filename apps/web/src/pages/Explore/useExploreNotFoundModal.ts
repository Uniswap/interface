import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { ExploreTab } from '~/types/explore'

export const NOT_FOUND_RESULT_PARAM = 'result'
export const NOT_FOUND_TYPE_PARAM = 'type'

/**
 * The not-found modal is driven straight off `?type=<tab>&result=not-found`, which TDP/PDP redirect to. Any
 * navigation (tab switch, browser back) dismisses it by construction, and closing strips the params with a
 * `replace` so back cannot land on the modal again.
 */
export function useExploreNotFoundModal(): {
  isTokenNotFoundOpen: boolean
  isPoolNotFoundOpen: boolean
  closeNotFoundModal: () => void
} {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const notFoundType =
    params.get(NOT_FOUND_RESULT_PARAM) === ModalName.NotFound ? params.get(NOT_FOUND_TYPE_PARAM) : null

  const closeNotFoundModal = useEvent((): void => {
    navigate(pathname, { replace: true })
  })

  return {
    isTokenNotFoundOpen: notFoundType === ExploreTab.Tokens,
    isPoolNotFoundOpen: notFoundType === ExploreTab.Pools,
    closeNotFoundModal,
  }
}
