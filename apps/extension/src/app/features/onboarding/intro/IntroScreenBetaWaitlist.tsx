import { useCallback, useEffect, useReducer, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Complete } from 'src/app/features/onboarding/Complete'
import { GetOnTheBetaWaitlistBanner } from 'src/app/features/onboarding/intro/GetOnTheBetaWaitlistBanner'
import { MainContentWrapper } from 'src/app/features/onboarding/intro/MainContentWrapper'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { checksIfSupportsSidePanel } from 'src/app/utils/chrome'
import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { UNISWAP_BETA_LOGO } from 'src/assets'
import { useAppSelector } from 'src/store/store'
import { Button, Flex, Image, Input, SpinningLoader, Text, useSporeColors } from 'ui/src'
import { ApproveFilled, FileListLock, Unitag } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { UnitagWaitlistPositionResponse } from 'uniswap/src/features/unitags/types'
import { shortenAddress } from 'uniswap/src/utils/addresses'
import { useTimeout } from 'utilities/src/time/timing'
import { fetchExtensionWaitlistEligibity } from 'wallet/src/features/unitags/api'

const UNISWAP_BETA_LOGO_SIZE = 68

export function IntroScreenBetaWaitlist(): JSX.Element {
  const { t, i18n } = useTranslation()
  const colors = useSporeColors()

  const [username, setUsername] = useState('')
  const [eligibility, setEligibility] = useState<UnitagWaitlistPositionResponse | undefined>()
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  const [_, forceUpdate] = useReducer((x: number): number => x + 1, 0)

  useEffect(() => {
    // Initial language change not lead to a rerender for onboarding app
    forceUpdate()
  }, [i18n.language])

  // Detections for some unsupported browsers may not work until stylesheet is loaded
  useTimeout(() => {
    if (!checksIfSupportsSidePanel()) {
      navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.UnsupportedBrowser}`)
    }
  }, 0)

  const isSubmitDisabled = (eligibility && !eligibility.isAccepted) || checkingEligibility || !username

  const onCheckEligibility = async (): Promise<void> => {
    if (isSubmitDisabled) {
      return
    }

    setCheckingEligibility(true)

    const { data } = await fetchExtensionWaitlistEligibity(username)

    setCheckingEligibility(false)
    setEligibility(data)
  }

  const onChangeText = (text: string): void => {
    setUsername(text.trim())
    setEligibility(undefined)
  }

  const isOnboarded = useAppSelector(isOnboardedSelector)

  if (isOnboarded) {
    return <Complete />
  }

  if (eligibility && eligibility.isAccepted) {
    return <EligibleUnitag address={eligibility.address} username={username} />
  }

  return (
    <Flex centered grow gap="$spacing24" justifyContent="center">
      <MainContentWrapper>
        <Flex centered backgroundColor="$surface1" borderRadius="$rounded24" flexGrow={0}>
          <Image
            height={UNISWAP_BETA_LOGO_SIZE}
            source={UNISWAP_BETA_LOGO}
            theme="primary"
            width={UNISWAP_BETA_LOGO_SIZE}
          />
        </Flex>

        <Flex position="relative" pt="$spacing16">
          <Text textAlign="center" variant="heading2">
            Uniswap Wallet
          </Text>

          <Text
            borderRadius="$rounded8"
            borderWidth={2}
            color="$accent1"
            pb={1}
            position="absolute"
            pt={2}
            px={4}
            right={28}
            textAlign="center"
            top={14}
            variant="buttonLabel4"
            // eslint-disable-next-line react/jsx-sort-props
            fontWeight="500"
          >
            BETA
          </Text>
        </Flex>

        <Text color="$neutral2" mt="$spacing8" px="$spacing24" textAlign="center" variant="body2">
          <Trans
            components={{ highlight: <Text color="$accent1" variant="body2" /> }}
            i18nKey="onboarding.introBetaWaitlist.checkEligibilityInstructions"
            t={t}
          />
        </Text>

        <Flex
          borderColor={colors.surface3.val}
          borderRadius="$rounded20"
          borderWidth={1}
          flexDirection="row"
          mt="$spacing32"
          p="$spacing20"
        >
          <Flex fill>
            <Input
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
              backgroundColor="$surface1"
              borderRadius="$rounded12"
              color="$neutral1"
              fontFamily="$body"
              fontSize={24}
              height="100%"
              placeholder={t('onboarding.introBetaWaitlist.unitagPlaceholder')}
              placeholderTextColor="$neutral3"
              value={username}
              width="100%"
              onChangeText={onChangeText}
              onSubmitEditing={onCheckEligibility}
            />
          </Flex>

          <Text color="$neutral2" variant="heading3">
            .uni.eth
          </Text>
        </Flex>

        {eligibility && !eligibility.isAccepted && (
          <Flex
            row
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            gap="$spacing12"
            mt="$spacing12"
            px="$spacing16"
            py="$spacing12"
          >
            <Flex centered>
              <FileListLock color="$neutral2" size={iconSizes.icon16} />
            </Flex>

            <Flex fill>
              <Text color="$neutral2" variant="body3">
                {t('onboarding.introBetaWaitlist.ineligibleExplanation')}
              </Text>
            </Flex>
          </Flex>
        )}

        <Button disabled={isSubmitDisabled} height={50} mt="$spacing24" onPress={onCheckEligibility}>
          {checkingEligibility ? <SpinningLoader /> : t('onboarding.introBetaWaitlist.button.checkEligibility')}
        </Button>
      </MainContentWrapper>

      <GetOnTheBetaWaitlistBanner />
    </Flex>
  )
}

function EligibleUnitag({ address, username }: { address: string; username: string }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const onContinue = useCallback(() => {
    navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Scan}`)
  }, [])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      if (event.key === 'Enter') {
        onContinue()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [onContinue])

  return (
    <Flex centered grow gap="$spacing16" justifyContent="center">
      <MainContentWrapper>
        <Flex centered backgroundColor="$surface1" borderRadius="$rounded24" flexGrow={0}>
          <Flex backgroundColor={colors.statusSuccess2.val} borderRadius="$rounded16" p="$spacing12">
            <ApproveFilled color={colors.statusSuccess.val} size={iconSizes.icon40} />
          </Flex>
        </Flex>

        <Flex pt="$spacing16">
          <Text textAlign="center" variant="heading3">
            {t('onboarding.introBetaWaitlist.eligible.title')}
          </Text>
        </Flex>

        <Text color="$neutral2" mt="$spacing8" mx="$spacing24" textAlign="center" variant="body2">
          {t('onboarding.introBetaWaitlist.eligible.tagline')}
        </Text>

        <Flex centered gap="$spacing12" my="$spacing32">
          <Flex centered row gap="$spacing8">
            <Text color="$neutral1" variant="heading2">
              {username}
            </Text>

            <Flex mt="$spacing4">
              <Unitag color={colors.accent1.val} size={iconSizes.icon36} />
            </Flex>
          </Flex>

          <Text color="$neutral3" variant="body2">
            {shortenAddress(address)}
          </Text>
        </Flex>

        <Button mt="$spacing24" onPress={onContinue}>
          {t('onboarding.introBetaWaitlist.button.letsGo')}
        </Button>
      </MainContentWrapper>
    </Flex>
  )
}
