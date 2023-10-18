import React, { ComponentProps, ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Pressable } from 'react-native'
import { OnboardingStackBaseParams, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { CarouselContext } from 'src/components/carousel/Carousel'
import { IS_ANDROID } from 'src/constants/globals'
import { OnboardingScreens } from 'src/screens/Screens'
import { Flex, Text, useDeviceDimensions } from 'ui/src'

function Page({
  text,
  params,
}: {
  text: ReactNode
  params: OnboardingStackBaseParams
}): JSX.Element {
  const { fullWidth } = useDeviceDimensions()
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
              <CloseButton color="$neutral2" onPress={onDismiss} />
            </Flex>
            <Flex flex={0.2} />
            <Flex flex={0.8} px="$spacing24">
              <CustomHeadingText>{text}</CustomHeadingText>
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
      <CustomHeadingText>
        <Trans>
          A recovery phrase (or seed phrase) is a{' '}
          <CustomHeadingText color="$accent1">set of words</CustomHeadingText> required to access
          your wallet, <CustomHeadingText color="$accent1">like a password.</CustomHeadingText>
        </Trans>
      </CustomHeadingText>
    }
  />,
  <Page
    params={params}
    text={
      <CustomHeadingText>
        <Trans>
          You can <CustomHeadingText color="$accent1">enter</CustomHeadingText> your recovery phrase
          on a new device{' '}
          <CustomHeadingText color="$accent1">to restore your wallet</CustomHeadingText> and its
          contents.
        </Trans>
      </CustomHeadingText>
    }
  />,
  <Page
    params={params}
    text={
      <CustomHeadingText>
        <Trans>
          But, if you{' '}
          <CustomHeadingText color="$accent1">lose your recovery phrase</CustomHeadingText>, you’ll{' '}
          <CustomHeadingText color="$accent1">lose access</CustomHeadingText> to your wallet.
        </Trans>
      </CustomHeadingText>
    }
  />,
  <Page
    params={params}
    text={
      <CustomHeadingText>
        {IS_ANDROID ? (
          <Trans>
            Instead of memorizing your recovery phrase, you can{' '}
            <CustomHeadingText color="$accent1">back it up to Google Drive</CustomHeadingText> and
            protect it with a password.
          </Trans>
        ) : (
          <Trans>
            Instead of memorizing your recovery phrase, you can{' '}
            <CustomHeadingText color="$accent1">back it up to iCloud</CustomHeadingText> and protect
            it with a password.
          </Trans>
        )}
      </CustomHeadingText>
    }
  />,
  <Page
    params={params}
    text={
      <CustomHeadingText>
        <Trans>
          You can also manually back up your recovery phrase by{' '}
          <CustomHeadingText color="$accent1">writing it down</CustomHeadingText> and storing it in
          a safe place.
        </Trans>
      </CustomHeadingText>
    }
  />,
  <Page
    params={params}
    text={
      <CustomHeadingText>
        <Trans>
          We recommend using{' '}
          <CustomHeadingText color="$accent1">both types of backups</CustomHeadingText>, because if
          you lose your recovery phrase, you won’t be able to restore your wallet.
        </Trans>
      </CustomHeadingText>
    }
  />,
]

function CustomHeadingText(props: ComponentProps<typeof Text>): JSX.Element {
  return <Text fontSize={28} lineHeight={34} variant="heading2" {...props} />
}
