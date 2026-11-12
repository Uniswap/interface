import { Percent } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { updateUserRouterPreference, updateUserSlippageTolerance } from '~/state/user/reducer'
import { SlippageTolerance } from '~/state/user/types'
import { RouterPreference } from '~/types/routing'

export function useRouterPreference(): [RouterPreference, (routerPreference: RouterPreference) => void] {
  const dispatch = useAppDispatch()

  const routerPreference = useAppSelector((state) => state.user.userRouterPreference)

  const setRouterPreference = useCallback(
    (newRouterPreference: RouterPreference) => {
      dispatch(updateUserRouterPreference({ userRouterPreference: newRouterPreference }))
    },
    [dispatch],
  )

  return [routerPreference, setRouterPreference]
}

/**
 * Return the user's slippage tolerance, from the redux store, and a function to update the slippage tolerance
 */
export function useUserSlippageTolerance(): [
  Percent | SlippageTolerance.Auto,
  (slippageTolerance: Percent | SlippageTolerance.Auto) => void,
] {
  const userSlippageToleranceRaw = useAppSelector((state) => {
    return state.user.userSlippageTolerance
  })

  const userSlippageTolerance = useMemo(
    () =>
      userSlippageToleranceRaw === SlippageTolerance.Auto
        ? SlippageTolerance.Auto
        : new Percent(userSlippageToleranceRaw, 10_000),
    [userSlippageToleranceRaw],
  )

  const dispatch = useAppDispatch()
  const setUserSlippageTolerance = useCallback(
    // oxlint-disable-next-line no-shadow
    (userSlippageTolerance: Percent | SlippageTolerance.Auto) => {
      let value: SlippageTolerance.Auto | number
      try {
        value =
          userSlippageTolerance === SlippageTolerance.Auto
            ? SlippageTolerance.Auto
            : JSBI.toNumber(userSlippageTolerance.multiply(10_000).quotient)
      } catch {
        value = SlippageTolerance.Auto
      }
      dispatch(
        updateUserSlippageTolerance({
          userSlippageTolerance: value,
        }),
      )
    },
    [dispatch],
  )

  return [userSlippageTolerance, setUserSlippageTolerance]
}
