import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { PasskeyImportConfirm } from 'uniswap/src/components/passkey/PasskeyImportConfirm'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { exportSeedPhrase } from 'uniswap/src/features/passkey/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { PasskeyImportLoading } from 'wallet/src/features/onboarding/PasskeyImportLoading'
import { resolveImportableAddresses } from 'wallet/src/features/onboarding/resolveImportableAddresses'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.PasskeyImport>

export function PasskeyImportScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { generateImportedAccounts, selectImportedAccounts } = useOnboardingContext()
  const { chains: chainIds } = useEnabledChains()
  const headerHeight = useHeaderHeight()
  const [walletInfo, setWalletInfo] = useState<{ walletId: string; walletAddress: string } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleError = useEvent((error: Error, fn: string) => {
    logger.error(error, { tags: { file: 'PasskeyImportScreen.tsx', function: fn } })
    navigation.goBack()
  })

  // Resolve walletId/address up front so the confirm screen renders before the second
  // passkey ceremony (export).
  useEffect(() => {
    const lookupWallet = async (): Promise<void> => {
      const signinResp = await EmbeddedWalletApiClient.fetchWalletSigninRequest({
        credential: params.passkeyCredential,
      })
      if (!signinResp.walletId || !signinResp.walletAddress) {
        throw new Error('WalletSignIn response missing walletId or walletAddress')
      }
      setWalletInfo({ walletId: signinResp.walletId, walletAddress: signinResp.walletAddress })
    }

    lookupWallet().catch((error: Error) => handleError(error, 'lookupWallet'))
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [])

  const onPressImport = useEvent(async () => {
    if (!walletInfo || isImporting) {
      return
    }
    setIsImporting(true)
    try {
      const mnemonic = await exportSeedPhrase({ walletId: walletInfo.walletId })
      // Undefined here means the user cancelled the export ceremony; let them retry.
      if (!mnemonic) {
        setIsImporting(false)
        return
      }
      const importedAddress = await Keyring.importMnemonic(mnemonic)
      if (!importedAddress) {
        throw new Error('Failed to generate account from imported mnemonic')
      }
      const generatedAccounts = await generateImportedAccounts({
        mnemonicId: importedAddress,
        backupType: BackupType.Passkey,
      })

      // If the seed phrase has activity at multiple HD derivation indices, route through
      // SelectWalletScreen so the user can pick which to import. Network failure here falls
      // through to the single-wallet auto-select path so the user is never blocked.
      let importableAddresses: Address[] = []
      try {
        importableAddresses = await resolveImportableAddresses({
          addresses: generatedAccounts.map((acc) => acc.address),
          chainIds,
          requiredAddress: walletInfo.walletAddress,
        })
      } catch (resolveError) {
        logger.error(resolveError, {
          tags: { file: 'PasskeyImportScreen.tsx', function: 'resolveImportableAddresses' },
        })
      }

      if (importableAddresses.length > 1) {
        navigation.navigate({
          name: OnboardingScreens.SelectWallet,
          params: { ...params, importType: ImportType.Passkey },
          merge: true,
        })
        return
      }

      // Embedded wallets have a single active address; auto-select to skip SelectWalletScreen.
      const primaryAccount = generatedAccounts.find((acc) =>
        areAddressesEqual({
          addressInput1: { address: acc.address, platform: Platform.EVM },
          addressInput2: { address: walletInfo.walletAddress, platform: Platform.EVM },
        }),
      )
      if (!primaryAccount) {
        throw new Error('Embedded wallet address not derived from imported mnemonic')
      }
      // Pass `generatedAccounts` explicitly: `selectImportedAccounts`'s closure was captured at the
      // last render and still sees `importedAccounts` from before `generateImportedAccounts` set it.
      await selectImportedAccounts([primaryAccount.address], generatedAccounts)

      navigation.navigate({
        name: OnboardingScreens.Notifications,
        params,
        merge: true,
      })
    } catch (error) {
      setIsImporting(false)
      handleError(error as Error, 'onPressImport')
    }
  })

  return (
    <OnboardingScreen disableGoBack={false}>
      {walletInfo ? (
        <PasskeyImportConfirm
          address={walletInfo.walletAddress}
          isImporting={isImporting}
          pb={headerHeight}
          onPressImport={onPressImport}
        />
      ) : (
        <PasskeyImportLoading pb={headerHeight} />
      )}
    </OnboardingScreen>
  )
}
