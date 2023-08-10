import React, { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Pressable } from 'react-native'
import { OnboardingStackBaseParams, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { CarouselContext } from 'src/components/carousel/Carousel'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreens } from 'src/screens/Screens'
import { dimensions } from 'ui/src/theme/restyle/sizing'

const { fullWidth } = dimensions

function Page({
  text,
  params,
}: {
  text: ReactNode
  params: OnboardingStackBaseParams
}): JSX.Element {
  const navigation = useOnboardingStackNavigation()
  const onDismiss = (): void => {
    navigation.navigate(OnboardingScreens.Backup, params)
  }

  return (
    <CarouselContext.Consumer>
      {(context): JSX.Element => (
        <Pressable
          onPress={(event): void =>
            event.nativeEvent.locationX < fullWidth * 0.33 ? context.goToPrev() : context.goToNext()
          }>
          <Flex centered>
            <Flex
              row
              alignItems="center"
              justifyContent="space-between"
              px="spacing24"
              width={fullWidth}>
              <Text color="neutral2" variant="subheadSmall">
                <Trans>What’s a recovery phrase?</Trans>
              </Text>
              <CloseButton color="neutral2" onPress={onDismiss} />
            </Flex>
            <Flex flex={0.2} />
            <Flex flex={0.8} px="spacing24">
              <Text fontSize={28} lineHeight={34} variant="headlineMedium">
                {text}
              </Text>
            </Flex>
          </Flex>
        </Pressable>
      )}
    </CarouselContext.Consumer>
  )
}

export const SeedPhraseEducationContent = (params: OnboardingStackBaseParams): JSX.Element[] => [
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          A recovery phrase (or seed phrase) is a <Text color="accent1">set of words</Text> required
          to access your wallet, <Text color="accent1">like a password.</Text>
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          You can <Text color="accent1">enter</Text> your recovery phrase on a new device{' '}
          <Text color="accent1">to restore your wallet</Text> and its contents.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          But, if you <Text color="accent1">lose your recovery phrase</Text>, you’ll{' '}
          <Text color="accent1">lose access</Text> to your wallet.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          Instead of memorizing your recovery phrase, you can{' '}
          <Text color="accent1">back it up to iCloud</Text> and protect it with a password.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          You can also manually back up your recovery phrase by{' '}
          <Text color="accent1">writing it down</Text> and storing it in a safe place.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          We recommend using <Text color="accent1">both types of backups</Text>, because if you lose
          your recovery phrase, you won’t be able to restore your wallet.
        </Trans>
      </Text>
    }
  />,
]
