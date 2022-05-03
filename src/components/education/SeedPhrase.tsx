import React, { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { Pressable } from 'react-native'
import { CarouselContext } from 'src/components/carousel/Carousel'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

function Page({ text }: { text: ReactNode }) {
  return (
    <CarouselContext.Consumer>
      {(context) => (
        <Pressable onPress={() => context.goToNext()}>
          <Flex centered>
            <Box flex={0.2} />
            <Box flex={0.8}>
              <Text fontSize={28} lineHeight={34} variant="h2">
                {text}
              </Text>
            </Box>
          </Flex>
        </Pressable>
      )}
    </CarouselContext.Consumer>
  )
}

export const SeedPhraseEducationContent = () => [
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        <Trans>
          A seed phrase is a set of 12 unique words that you can use to access to your wallet—
          <Text color="pink">it's like your wallet's secret password.</Text>
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        <Trans>
          You can{' '}
          <Text color="pink">enter your seed phrase on a new device to recover your wallet</Text>{' '}
          and access your funds.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        <Trans>
          Instead of memorizing your seed phrase,{' '}
          <Text color="pink">you can back it up to iCloud</Text> and protect it by setting a PIN.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        <Trans>
          You can also{' '}
          <Text color="pink">manually back up your seed phrase by writing it down</Text> and storing
          it in a safe place.
        </Trans>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        <Trans>
          We recommend using both types of backups, because{' '}
          <Text color="pink">
            if you lose all of your backups, you won’t be able to recover your wallet.
          </Text>
        </Trans>
      </Text>
    }
  />,
]
