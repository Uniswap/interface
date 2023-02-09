import React, { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Pressable } from 'react-native'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { CarouselContext } from 'src/components/carousel/Carousel'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'

const { fullWidth } = dimensions

function Page({ text }: { text: ReactNode }): JSX.Element {
  const navigation = useOnboardingStackNavigation()
  const onDismiss = (): void => {
    navigation.navigate(OnboardingScreens.Backup)
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
              <Text color="textSecondary" variant="subheadSmall">
                <Trans>What’s a recovery phrase?</Trans>
              </Text>
              <CloseButton color="textSecondary" onPress={onDismiss} />
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

export const SeedPhraseEducationContent = (): JSX.Element[] => [
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          A recovery phrase (or seed phrase) is a <Text color="accentAction">set of words</Text>{' '}
          required to access your wallet, <Text color="accentAction">like a password.</Text>
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          You can <Text color="accentAction">enter</Text> your recovery phrase on a new device{' '}
          <Text color="accentAction">to restore your wallet</Text> and its contents.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          But, if you <Text color="accentAction">lose your recovery phrase</Text>, you’ll{' '}
          <Text color="accentAction">lose access</Text> to your wallet.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          Instead of memorizing your recovery phrase, you can{' '}
          <Text color="accentAction">back it up to iCloud</Text> and protect it with a password.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          You can also manually back up your recovery phrase by{' '}
          <Text color="accentAction">writing it down</Text> and storing it in a safe place.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          We recommend using <Text color="accentAction">both types of backups</Text>, because if you
          lose your recovery phrase, you won’t be able to restore your wallet.
        </Trans>
      </Text>
    }
  />,
]
