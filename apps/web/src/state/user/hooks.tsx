/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { Percent } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'
import { useGetPositionsForPairs } from 'uniswap/src/data/rest/getPositions'
import { serializeToken } from 'uniswap/src/utils/currency'
import { useAccount } from '~/hooks/useAccount'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { RouterPreference } from '~/state/routing/types'
import { addSerializedPair, updateUserRouterPreference, updateUserSlippageTolerance } from '~/state/user/reducer'
import { SerializedPair, SlippageTolerance } from '~/state/user/types'

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

function serializePair(pair: Pair): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1),
  }
}

export function usePairAdder(): (pair: Pair) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (pair: Pair) => {
      dispatch(addSerializedPair({ serializedPair: serializePair(pair) }))
    },
    [dispatch],
  )
}

export function useRequestPositionsForSavedPairs() {
  const savedSerializedPairs = useAppSelector(({ user: { pairs } }) => pairs)
  const account = useAccount()
  return useGetPositionsForPairs(savedSerializedPairs, account.address)
}
