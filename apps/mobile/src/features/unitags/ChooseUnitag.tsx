import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Pill } from 'src/components/text/Pill'
import { TooltipInfoButton } from 'src/components/tooltip/TooltipButton'
import { ScreenRow } from 'src/components/unitags/ScreenRow'
import { UNITAG_SUFFIX } from 'src/features/unitags/constants'
import { UnitagInput } from 'src/features/unitags/UnitagInput'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { useKeyboardLayout } from 'src/utils/useKeyboardLayout'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { useActiveAccountAddress, usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

const LIVE_CHECK_DELAY_MS = 1000

export function ChooseUnitag({
  entryPoint,
}: {
  entryPoint: OnboardingScreens.Landing | Screens.Home
}): JSX.Element {
  const colors = useSporeColors()
  const keyboard = useKeyboardLayout()
  const compact = keyboard.isVisible && keyboard.containerHeight !== 0
  const minHeight = compact ? keyboard.containerHeight : 0
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddress()
  const pendingAccountAddress = Object.values(usePendingAccounts())?.[0]?.address
  const unitagAddress = activeAddress || pendingAccountAddress
  const [unitag, setUnitag] = useState<string | undefined>(undefined)
  const [showLiveCheck, setShowLiveCheck] = useState(false)

  const onChange = (text: string | undefined): void => {
    if (unitag !== text?.trim()) {
      setShowLiveCheck(false)
    }
    setUnitag(text?.trim())
  }

  const onSubmit = (): void => {
    Keyboard.dismiss()
  }

  const onPressContinue = (): void => {
    if (unitag) {
      navigate(Screens.UnitagStack, {
        screen: UnitagScreens.ChooseProfilePicture,
        params: { entryPoint, unitag },
      })
    }
  }

  const onPressMaybeLater = (): void => {
    navigate(Screens.OnboardingStack, {
      screen: OnboardingScreens.EditName,
      params: {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      },
    })
  }

  useEffect(() => {
    const delayFn = setTimeout(() => {
      setShowLiveCheck(true)
    }, LIVE_CHECK_DELAY_MS)

    return () => {
      clearTimeout(delayFn)
    }
  }, [unitag])

  return (
    <Flex
      grow
      $short={{ gap: '$spacing8' }}
      flexGrow={compact ? 0 : 1}
      gap="$spacing16"
      minHeight={minHeight}
      pb="$spacing16"
      px="$spacing16">
      <ScreenRow
        tooltipButton={
          <TooltipInfoButton
            backgroundIconColor={colors.surface1.get()}
            closeText={t('Got it')}
            modalIcon={
              <Flex centered row gap="$spacing4">
                <Pill
                  customBackgroundColor={colors.surface2.val}
                  label={shortenAddress(unitagAddress ?? ADDRESS_ZERO)}
                  px="$spacing8"
                />
                <Icons.LinkHorizontalAlt color={colors.neutral2.get()} size={iconSizes.icon24} />
                <Pill
                  customBackgroundColor={colors.surface2.val}
                  foregroundColor={colors.accent1.val}
                  label={unitag && unitag !== '' ? unitag : t('yourusername')}
                  px="$spacing8"
                />
              </Flex>
            }
            modalText={t(
              `This username is a simple, user-friendly way to use your address in transactions. Your current address remains unchanged and secure.`
            )}
            modalTitle={t('An easier way to receive')}
            size={iconSizes.icon24}
          />
        }
      />
      <TitleRow />
      <Flex fill justifyContent="space-between">
        <UnitagInput
          activeAddress={entryPoint === Screens.Home ? activeAddress : null}
          errorMessage={undefined} // TODO (MOB-2105): GET /username/ from unitags backend and surface any errors
          inputSuffix={true ? UNITAG_SUFFIX : undefined} // TODO (MOB-2105)
          liveCheck={showLiveCheck}
          placeholderLabel="yourname"
          showUnitagLogo={false} // TODO (MOB-2125): add Unitag logo animation when continue button is pressed
          value={unitag}
          onChange={onChange}
          onSubmit={onSubmit}
        />
        <Flex gap="$spacing8">
          {entryPoint === OnboardingScreens.Landing && (
            <Button color="$accent1" size="medium" theme="branded" onPress={onPressMaybeLater}>
              {t('Maybe later')}
            </Button>
          )}
          <Button size="medium" theme="primary" onPress={onPressContinue}>
            {t('Continue')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

function TitleRow(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered gap="$spacing12" m="$spacing12">
      <Text
        $short={{ variant: 'subheading1' }}
        allowFontScaling={false}
        textAlign="center"
        variant="heading3">
        {t('Claim your username')}
      </Text>
      <Text
        $short={{ variant: 'body3', maxFontSizeMultiplier: 1.1 }}
        color="$neutral2"
        maxFontSizeMultiplier={fonts.body2.maxFontSizeMultiplier}
        textAlign="center"
        variant="body2">
        {t(
          'This is your unique name that people can send funds to and use to find you across defi.'
        )}
      </Text>
    </Flex>
  )
}
