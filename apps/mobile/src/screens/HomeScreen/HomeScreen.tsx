import { useStartProfiler } from '@shopify/react-native-performance'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { HomeScreenPortfolioScrollProvider } from 'src/screens/HomeScreen/portfolio/context/HomeScreenPortfolioScrollContext'
import { HomeScreenPortfolio } from 'src/screens/HomeScreen/portfolio/HomeScreenPortfolio'
import { SmartWalletModals } from 'src/screens/HomeScreen/SmartWalletModals'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { TokenBalanceListContextProvider } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'
import { useOpenSmartWalletNudgeOnCompletedSwap } from 'wallet/src/components/smartWallet/smartAccounts/hooks'
import { setIncrementNumPostSwapNudge } from 'wallet/src/features/behaviorHistory/slice'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

/**
 * Home Screen hosts both Tokens and NFTs Tab
 */
function HomeScreen({
  isLayoutReady,
  setIsLayoutReady,
}: {
  isLayoutReady: boolean
  setIsLayoutReady: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  const dispatch = useDispatch()
  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()
  const { trigger } = useBiometricPrompt()
  // The Home heartbeat coordinator only takes over the Tokens tab list refreshing when this
  // flag is on — otherwise the list must keep its own poll running, or it would never refresh.
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const startProfilerTimer = useStartProfiler()

  useWalletRestore({ openModalImmediately: true })

  useEffect(() => {
    return () => setIsLayoutReady(false)
  }, [setIsLayoutReady])

  useOpenSmartWalletNudgeOnCompletedSwap(
    useEvent(() => {
      if (!activeAccount.address || activeAccount.type !== AccountType.SignerMnemonic) {
        return
      }

      navigate(ModalName.SmartWalletNudge, {
        onEnableSmartWallet: async () => {
          const successAction = (): void => {
            dispatch(setSmartWalletConsent({ address: activeAccount.address, smartWalletConsent: true }))
            navigate(ModalName.SmartWalletEnabledModal, {
              showReconnectDappPrompt: false,
            })
          }

          if (requiresBiometrics) {
            await trigger({ successCallback: successAction })
          } else {
            successAction()
          }
        },
      })
      dispatch(setIncrementNumPostSwapNudge({ walletAddress: activeAccount.address }))
    }),
  )

  const onPressToken = useCallback(
    (currencyId: CurrencyId): void => {
      startProfilerTimer({ source: MobileScreens.Home })
      tokenDetailsNavigation.navigate(currencyId)
    },
    [startProfilerTimer, tokenDetailsNavigation],
  )

  return (
    <HomeScreenPortfolioScrollProvider>
      <TokenBalanceListContextProvider
        disablePolling={isDataLivelinessEnabled}
        isExternalProfile={false}
        evmOwner={activeAccount.address}
        onPressToken={onPressToken}
      >
        <HomeScreenPortfolio isLayoutReady={isLayoutReady} setIsLayoutReady={setIsLayoutReady} />
      </TokenBalanceListContextProvider>
    </HomeScreenPortfolioScrollProvider>
  )
}

/**
 * Adding `key` forces a full re-render and re-mount when switching accounts
 * to avoid issues with wrong cached data being shown in some memoized components that are already mounted.
 */
export function WrappedHomeScreen(_props: AppStackScreenProp<MobileScreens.Home>): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()

  const [isLayoutReady, setIsLayoutReady] = useState(false)

  return (
    <>
      <HomeScreen key={activeAccount.address} isLayoutReady={isLayoutReady} setIsLayoutReady={setIsLayoutReady} />
      <SmartWalletModals isLayoutReady={isLayoutReady} />
    </>
  )
}
