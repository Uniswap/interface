import { CompositeScreenProps } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Button, Flex, Loader, Text, useMedia, useSporeColors } from 'ui/src'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { fonts, iconSizes, opacify } from 'ui/src/theme'
import { useENSAvatar } from 'uniswap/src/features/ens/api'
import { Experiments, OnboardingRedesignRecoveryBackupProperties } from 'uniswap/src/features/gating/experiments'
import { getExperimentValue } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { NumberType } from 'utilities/src/format/types'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import {
  useCreateOnboardingAccountIfNone,
  useOnboardingContext,
} from 'wallet/src/features/onboarding/OnboardingContext'
import AnimatedNumber from 'wallet/src/features/portfolio/AnimatedNumber'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type Props = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WelcomeWallet>,
  NativeStackScreenProps<AppStackParamList, MobileScreens.Home, undefined>
>

export function WelcomeWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  useNavigationHeader(navigation)
  useCreateOnboardingAccountIfNone()

  const { getOnboardingAccountAddress, getUnitagClaim } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const unitagClaim = getUnitagClaim()

  const colors = useSporeColors()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const media = useMedia()

  const walletName = useDisplayName(onboardingAccountAddress)
  const { data: avatar } = useENSAvatar(onboardingAccountAddress)

  const onPressNext = (): void => {
    const onboardingExperimentEnabled = getExperimentValue(
      Experiments.OnboardingRedesignRecoveryBackup,
      OnboardingRedesignRecoveryBackupProperties.Enabled,
      false,
    )

    navigation.navigate({
      name: onboardingExperimentEnabled ? OnboardingScreens.Notifications : OnboardingScreens.Backup,
      merge: true,
      params,
    })
  }

  const zeroBalance = convertFiatAmountFormatted(0, NumberType.PortfolioBalance)

  const displayName = unitagClaim ? { type: DisplayNameType.Unitag, name: unitagClaim.username } : walletName

  return (
    <Screen mb="$spacing12" mx="$spacing24">
      <Flex fill gap="$spacing36" justifyContent="center">
        <Flex gap="$spacing12" px="$spacing16">
          {unitagClaim?.avatarUri ? (
            <UnitagProfilePicture
              address={onboardingAccountAddress ?? ''}
              size={iconSizes.icon64}
              unitagAvatarUri={unitagClaim?.avatarUri}
            />
          ) : (
            <AccountIcon
              address={onboardingAccountAddress ?? ''}
              avatarUri={avatar}
              showBackground={true}
              showBorder={false}
              showViewOnlyBadge={false}
              size={iconSizes.icon64}
            />
          )}
          <DisplayNameText displayName={displayName} justifyContent="flex-start" textProps={{ variant: 'body1' }} />
          <AnimatedNumber
            balance={0}
            colorIndicationDuration={0}
            loading={false}
            loadingPlaceholderText="0.00"
            shouldFadeDecimals={true}
            value={zeroBalance}
            warmLoading={false}
          />
          <Loader.Token repeat={2} />
        </Flex>
        <Flex gap="$spacing16" py="$spacing16">
          <Text
            $short={{ variant: 'heading3' }}
            maxFontSizeMultiplier={media.short ? 1.1 : fonts.heading3.maxFontSizeMultiplier}
            textAlign="center"
            variant="heading3"
          >
            {t('onboarding.wallet.title')}
          </Text>
          <Text
            $short={{ variant: 'subheading2' }}
            color="$neutral2"
            maxFontSizeMultiplier={media.short ? 1.1 : fonts.body1.maxFontSizeMultiplier}
            textAlign="center"
            variant="subheading2"
          >
            {t('onboarding.wallet.description.full')}
          </Text>
        </Flex>
      </Flex>
      <Trace logPress element={ElementName.Next}>
        <Button
          disabled={!onboardingAccountAddress}
          icon={
            <Flex grow row alignItems="center" justifyContent="space-between">
              <Flex row alignItems="center" gap="$spacing8">
                <Flex backgroundColor={opacify(10, colors.white.val)} borderRadius="$roundedFull" p="$spacing8">
                  <LockIcon color={colors.white.val} height={iconSizes.icon16} width={iconSizes.icon16} />
                </Flex>
                <Text color="$white" variant="buttonLabel1">
                  {t('onboarding.wallet.continue')}
                </Text>
              </Flex>
              <Arrow color={colors.white.val} direction="e" size={iconSizes.icon24} />
            </Flex>
          }
          testID={TestID.Next}
          onPress={onPressNext}
        />
      </Trace>
    </Screen>
  )
}
