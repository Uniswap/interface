import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { ComponentProps, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex, Loader, Text, TouchableArea, useLayoutAnimationOnChange } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useImportableAccounts } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

const ANIMATION_DURATION = 300

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
      name:
        params.importType === ImportType.Restore || params.importType === ImportType.Passkey
          ? OnboardingScreens.Notifications
          : OnboardingScreens.Backup,
      params,
      merge: true,
    })
  }, [selectImportedAccounts, selectedAddresses, navigation, params])

  const title = isLoading
    ? t('account.wallet.select.loading.title')
    : t('account.wallet.select.title_one', { count: importableAccounts?.length ?? 0 })

  const subtitle = isLoading ? t('account.wallet.select.loading.subtitle') : undefined

  const smartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)

  const highlightComponent = <CustomHighlightText />

  const isContinueButtonDisabled = isLoading || !!showError || selectedAddresses.length === 0

  const showSmartWalletDisclaimer = smartWalletEnabled && !isContinueButtonDisabled

  const opacityStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(showSmartWalletDisclaimer ? 1 : 0, { duration: ANIMATION_DURATION }),
    }),
    [showSmartWalletDisclaimer],
  )

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
          <ScrollView testID={TestID.SelectWalletScreenLoaded}>
            <Flex height="$spacing12" />
            <Flex gap="$gap12">
              {importableAccounts?.map((account, i) => {
                const { address, balance } = account
                // prevents flickering and incorrect width calculation for long wallet names on Android
                // it's not possible to deselect last wallet
                if (selectedAddresses.length === 0) {
                  return null
                }
                return (
                  <Flex key={i} px="$spacing16">
                    <WalletPreviewCard
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
        <Animated.View
          style={[
            opacityStyle,
            {
              marginBottom: spacing.spacing16,
              marginHorizontal: spacing.spacing24,
            },
          ]}
        >
          <Trace logPress element={ElementName.SmartWalletDisclaimer}>
            <TouchableArea
              flexDirection="row"
              gap="$gap8"
              pt="$padding8"
              onPress={(): void => {
                navigate(ModalName.SmartWalletInfoModal)
              }}
            >
              <Text color="$neutral2" variant="body4" textAlign="center" flexGrow={1}>
                <Trans
                  key="smartWalletDisclaimer"
                  components={{ highlight: highlightComponent }}
                  i18nKey="account.wallet.select.smartWalletDisclaimer"
                />
              </Text>
            </TouchableArea>
          </Trace>
        </Animated.View>
        <Flex opacity={showError ? 0 : 1} px="$spacing16">
          <Flex row>
            <Button
              isDisabled={isContinueButtonDisabled}
              variant="branded"
              size="large"
              testID={TestID.Continue}
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

function CustomHighlightText(props: ComponentProps<typeof Text>): JSX.Element {
  return <Text variant="buttonLabel4" color="$neutral1" {...props} />
}
