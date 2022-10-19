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

function Page({ text }: { text: ReactNode }) {
  const navigation = useOnboardingStackNavigation()
  const onDismiss = () => {
    navigation.navigate(OnboardingScreens.Backup)
  }

  return (
    <CarouselContext.Consumer>
      {(context) => (
        <Pressable
          onPress={(event) =>
            event.nativeEvent.locationX < fullWidth * 0.33 ? context.goToPrev() : context.goToNext()
          }>
          <Flex centered>
            <Flex row alignItems="center" justifyContent="space-between" px="lg" width={fullWidth}>
              <Text color="textSecondary" variant="buttonLabelMedium">
                <Trans>What’s a recovery phrase?</Trans>
              </Text>
              <CloseButton color="textSecondary" onPress={onDismiss} />
            </Flex>
            <Flex flex={0.2} />
            <Flex flex={0.8} px="lg">
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

export const SeedPhraseEducationContent = () => [
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          A recovery phrase is a set of 12 unique words that you can use to access to your wallet—
          <Text color="accentAction">it's like your wallet's secret password.</Text>
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          You can{' '}
          <Text color="accentAction">
            enter your recovery phrase on a new device to recover your wallet
          </Text>{' '}
          and access your funds.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          Instead of memorizing your recovery phrase,{' '}
          <Text color="accentAction">you can back it up to iCloud</Text> and protect it by setting a
          password.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          You can also{' '}
          <Text color="accentAction">manually back up your recovery phrase by writing it down</Text>{' '}
          and storing it in a safe place.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="headlineMedium">
        <Trans>
          We recommend using both types of backups, because{' '}
          <Text color="accentAction">
            if you lose all of your backups, you won’t be able to recover your wallet.
          </Text>
        </Trans>
      </Text>
    }
  />,
]
