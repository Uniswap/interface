import { CompositeScreenProps } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import AnimatedNumber from 'src/components/AnimatedNumber'
import { Screen } from 'src/components/layout/Screen'
import Trace from 'src/components/Trace/Trace'
import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Button, Flex, Loader, Text, useMedia, useSporeColors } from 'ui/src'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { fonts, iconSizes, opacify } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { Arrow } from 'wallet/src/components/icons/Arrow'
import { useENSAvatar } from 'wallet/src/features/ens/api'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { useActiveAccountAddress, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { useAppDispatch } from 'wallet/src/state'
import { ElementName } from 'wallet/src/telemetry/constants'

type Props = CompositeScreenProps<
  NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.WelcomeWallet>,
  NativeStackScreenProps<AppStackParamList, Screens.Home, undefined>
>

export function WelcomeWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  useAddBackButton(navigation)

  const colors = useSporeColors()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const media = useMedia()

  const activeAddress = useActiveAccountAddress()
  const walletName = useDisplayName(activeAddress)
  const { data: avatar } = useENSAvatar(activeAddress)
  const dispatch = useAppDispatch()

  const onPressNext = (): void => {
    navigation.navigate({
      name: OnboardingScreens.Backup,
      merge: true,
      params,
    })
  }

  // Ensure pending account is cleared before navigating away
  navigation.addListener('beforeRemove', () => {
    if (params.entryPoint === OnboardingEntryPoint.Sidebar) {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    }
  })

  const zeroBalance = convertFiatAmountFormatted(0, NumberType.PortfolioBalance)

  const displayName = params.unitagClaim
    ? { type: DisplayNameType.Unitag, name: params.unitagClaim.username }
    : walletName

  return (
    <Screen mb="$spacing12" mx="$spacing24">
      <Flex fill gap="$spacing36" justifyContent="center">
        <Flex gap="$spacing12" px="$spacing16">
          {params.unitagClaim?.avatarUri ? (
            <UnitagProfilePicture
              address={activeAddress ?? ''}
              size={iconSizes.icon64}
              unitagAvatarUri={params.unitagClaim?.avatarUri}
            />
          ) : (
            <AccountIcon
              address={activeAddress ?? ''}
              avatarUri={avatar}
              showBackground={true}
              showBorder={false}
              showViewOnlyBadge={false}
              size={iconSizes.icon64}
            />
          )}
          <DisplayNameText
            displayName={displayName}
            justifyContent="flex-start"
            textProps={{ variant: 'body1' }}
          />
          <AnimatedNumber
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
            variant="heading3">
            {t('onboarding.wallet.title')}
          </Text>
          <Text
            $short={{ variant: 'subheading2' }}
            color="$neutral2"
            maxFontSizeMultiplier={media.short ? 1.1 : fonts.body1.maxFontSizeMultiplier}
            textAlign="center"
            variant="subheading2">
            {t('onboarding.wallet.description.full')}
          </Text>
        </Flex>
      </Flex>
      <Trace logPress element={ElementName.Next}>
        <Button
          icon={
            <Flex grow row alignItems="center" justifyContent="space-between">
              <Flex row alignItems="center" gap="$spacing8">
                <Flex
                  borderRadius="$roundedFull"
                  p="$spacing8"
                  style={{ backgroundColor: opacify(10, colors.sporeWhite.val) }}>
                  <LockIcon
                    color={colors.sporeWhite.val}
                    height={iconSizes.icon16}
                    width={iconSizes.icon16}
                  />
                </Flex>
                <Text color="$sporeWhite" variant="buttonLabel2">
                  {t('onboarding.wallet.continue')}
                </Text>
              </Flex>
              <Arrow color={colors.sporeWhite.val} direction="e" size={iconSizes.icon24} />
            </Flex>
          }
          testID={ElementName.Next}
          onPress={onPressNext}
        />
      </Trace>
    </Screen>
  )
}
