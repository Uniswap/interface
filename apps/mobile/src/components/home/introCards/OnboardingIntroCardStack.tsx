import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { IntroCardProps } from 'src/components/home/introCards/IntroCard'
import { IntroCardStack } from 'src/components/home/introCards/IntroCardStack'
import { openModal } from 'src/features/modals/modalSlice'
import { Buy, UniswapLogo } from 'ui/src/components/icons'
import { Experiments, OnboardingRedesignRecoveryBackupProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTranslation } from 'uniswap/src/i18n'

export function OnboardingIntroCardStack(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const redesignRecoveryBackupEnabled = useExperimentValue(
    Experiments.OnboardingRedesignRecoveryBackup,
    OnboardingRedesignRecoveryBackupProperties.Enabled,
    false,
  )

  const cards: IntroCardProps[] = useMemo(
    () => [
      ...(redesignRecoveryBackupEnabled
        ? [
            {
              Icon: UniswapLogo,
              iconProps: {
                color: '$accent1',
              },
              iconContainerProps: {
                backgroundColor: '$accent2',
                borderRadius: '$rounded12',
              },
              title: t('onboarding.home.intro.welcome.title'),
              description: t('onboarding.home.intro.welcome.description'),
              headerActionString: t('common.action.swipe'),
            } satisfies IntroCardProps,
          ]
        : []),
      {
        Icon: Buy,
        title: t('onboarding.home.intro.fund.title'),
        description: t('onboarding.home.intro.fund.description'),
        headerActionString: t('common.action.go'),
        headerActionType: 'button',
        onPress: (): void => {
          dispatch(openModal({ name: ModalName.FiatOnRampAggregator }))
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.OnboardingIntroCardFundWallet,
          })
        },
      },
    ],
    [dispatch, redesignRecoveryBackupEnabled, t],
  )
  return <IntroCardStack cards={cards} />
}
