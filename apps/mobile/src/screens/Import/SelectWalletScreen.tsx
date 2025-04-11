import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex, Loader, useLayoutAnimationOnChange } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useImportableAccounts } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

export function SelectWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { selectImportedAccounts, getImportedAccountsAddresses } = useOnboardingContext()
  const importedAddresses = getImportedAccountsAddresses()

  const {
    importableAccounts,
    isLoading,
    showError,
    refetch: refetchAccounts,
  } = useImportableAccounts(importedAddresses)

  const isOnlyOneAccount = importableAccounts?.length === 1

  const { selectedAddresses, toggleAddressSelection } = useSelectAccounts(importableAccounts)

  useLayoutAnimationOnChange(isLoading)

  const onSubmit = useCallback(async () => {
    await selectImportedAccounts(selectedAddresses)

    navigation.navigate({
      name: params?.importType === ImportType.Restore ? OnboardingScreens.Notifications : OnboardingScreens.Backup,
      params,
      merge: true,
    })
  }, [selectImportedAccounts, selectedAddresses, navigation, params])

  const title = isLoading
    ? t('account.wallet.select.loading.title')
    : t('account.wallet.select.title_one', { count: importableAccounts?.length ?? 0 })

  const subtitle = isLoading ? t('account.wallet.select.loading.subtitle') : undefined

  return (
    <>
      <OnboardingScreen
        ignoreContainerPaddingX
        ignoreTextContainerMarginBottom={!isLoading}
        Icon={WalletFilled}
        subtitle={!showError ? subtitle : undefined}
        title={!showError ? title : ''}
      >
        {showError ? (
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={t('account.wallet.select.error')}
            onRetry={refetchAccounts}
          />
        ) : isLoading ? (
          <Flex grow justifyContent="space-between" px="$spacing16">
            <Loader.Wallets repeat={5} />
          </Flex>
        ) : (
          <ScrollView>
            <Flex height="$spacing12" />
            <Flex gap="$spacing12">
              {importableAccounts?.map((account, i) => {
                const { address, balance } = account
                // prevents flickering and incorrect width calculation for long wallet names on Android
                // it's not possible to deselect last wallet
                if (selectedAddresses.length === 0) {
                  return null
                }
                return (
                  <Flex key={address} px="$spacing16">
                    <WalletPreviewCard
                      key={address}
                      address={address}
                      balance={balance}
                      hideSelectionCircle={isOnlyOneAccount}
                      name={ElementName.WalletCard}
                      selected={selectedAddresses.includes(address)}
                      testID={`${TestID.WalletCard}-${i + 1}`}
                      onSelect={toggleAddressSelection}
                    />
                  </Flex>
                )
              })}
            </Flex>
          </ScrollView>
        )}
        <Flex opacity={showError ? 0 : 1} px="$spacing16">
          <Flex row>
            <Button
              isDisabled={isLoading || !!showError || selectedAddresses.length === 0}
              variant="branded"
              size="large"
              onPress={onSubmit}
            >
              {t('common.button.continue')}
            </Button>
          </Flex>
        </Flex>
      </OnboardingScreen>
    </>
  )
}
