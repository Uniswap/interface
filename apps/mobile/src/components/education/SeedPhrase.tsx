import React, { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Pressable } from 'react-native'
import { OnboardingStackBaseParams, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { CarouselContext } from 'src/components/carousel/Carousel'
import { IS_ANDROID } from 'src/constants/globals'
import { OnboardingScreens } from 'src/screens/Screens'
import { Flex, Text } from 'ui/src'
import { dimensions } from 'ui/src/theme'

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
          <Flex centered gap="$spacing16">
            <Flex
              row
              alignItems="center"
              justifyContent="space-between"
              px="$spacing24"
              width={fullWidth}>
              <Text color="$neutral2" variant="subheading2">
                <Trans>What’s a recovery phrase?</Trans>
              </Text>
              <CloseButton color="neutral2" onPress={onDismiss} />
            </Flex>
            <Flex flex={0.2} />
            <Flex flex={0.8} px="$spacing24">
              <Text fontSize={28} lineHeight={34} variant="heading2">
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
      <Text fontSize={28} lineHeight={34} variant="heading2">
        <Trans>
          A recovery phrase (or seed phrase) is a <Text color="$accent1">set of words</Text>{' '}
          required to access your wallet, <Text color="$accent1">like a password.</Text>
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="heading2">
        <Trans>
          You can <Text color="$accent1">enter</Text> your recovery phrase on a new device{' '}
          <Text color="$accent1">to restore your wallet</Text> and its contents.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="heading2">
        <Trans>
          But, if you <Text color="$accent1">lose your recovery phrase</Text>, you’ll{' '}
          <Text color="$accent1">lose access</Text> to your wallet.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="heading2">
        {IS_ANDROID ? (
          <Trans>
            Instead of memorizing your recovery phrase, you can{' '}
            <Text color="$accent1">back it up to Google Drive</Text> and protect it with a password.
          </Trans>
        ) : (
          <Trans>
            Instead of memorizing your recovery phrase, you can{' '}
            <Text color="$accent1">back it up to iCloud</Text> and protect it with a password.
          </Trans>
        )}
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="heading2">
        <Trans>
          You can also manually back up your recovery phrase by{' '}
          <Text color="$accent1">writing it down</Text> and storing it in a safe place.
        </Trans>
      </Text>
    }
  />,
  <Page
    params={params}
    text={
      <Text fontSize={28} lineHeight={34} variant="heading2">
        <Trans>
          We recommend using <Text color="$accent1">both types of backups</Text>, because if you
          lose your recovery phrase, you won’t be able to restore your wallet.
        </Trans>
      </Text>
    }
  />,
]
