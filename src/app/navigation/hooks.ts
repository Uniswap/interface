import { NavigationContainerRefContext, NavigationContext } from '@react-navigation/core'
import { useCallback, useContext } from 'react'
import { navigate as rootNavigate } from 'src/app/navigation/rootNavigation'
import { useAppStackNavigation, useExploreStackNavigation } from 'src/app/navigation/types'
import { useTransactionListLazyQuery } from 'src/data/__generated__/types-and-hooks'
import { Screens } from 'src/screens/Screens'

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerActivityNavigation(): {
  preload: (address: string) => void
  navigate: () => void
} {
  const navigation = useAppStackNavigation()
  const [load] = useTransactionListLazyQuery()

  const preload = useCallback(
    (address: string) => {
      load({
        variables: {
          address,
        },
      })
    },
    [load]
  )

  const navigate = useCallback(() => navigation.navigate(Screens.Home), [navigation])

  return { preload, navigate }
}

/**
 * Utility hook to simplify navigating to Activity screen.
 * Preloads query needed to render transaction list.
 */
export function useEagerExternalProfileNavigation(): {
  preload: (address: string) => void
  navigate: (address: string, walletName?: string) => void
} {
  const navigation = useExploreStackNavigation()

  const [load] = useTransactionListLazyQuery()

  const preload = useCallback(
    (address: string) => {
      load({ variables: { address } })
    },
    [load]
  )

  const navigate = useCallback(
    (address: string, walletName?: string) => {
      navigation.navigate(Screens.ExternalProfile, { address, walletName })
    },
    [navigation]
  )

  return { preload, navigate }
}

export function useEagerExternalProfileRootNavigation(): {
  preload: (address: string) => void
  navigate: (address: string, callback: () => void) => void
} {
  const [load] = useTransactionListLazyQuery()

  const preload = useCallback(
    (address: string) => {
      load({
        variables: {
          address,
        },
      })
    },
    [load]
  )

  const navigate = useCallback((address: string, callback?: () => void) => {
    rootNavigate(Screens.ExternalProfile, { address }).then(() => {
      callback?.()
    })
  }, [])

  return { preload, navigate }
}

/**
 * Utility hook that checks if the caller is part of the navigation tree.
 *
 * Inspired by how the navigation library checks if the the navigation object exists.
 * https://github.com/react-navigation/react-navigation/blob/d7032ba8bb6ae24030a47f0724b61b561132fca6/packages/core/src/useNavigation.tsx#L18
 */
export function useIsPartOfNavigationTree(): boolean {
  const root = useContext(NavigationContainerRefContext)
  const navigation = useContext(NavigationContext)

  return navigation !== undefined || root !== undefined
}
