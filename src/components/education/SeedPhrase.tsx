import React, { ReactNode } from 'react'
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
            <Box flex={0.7}>
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
        A seed phrase is a set of 12 unique words that you can use to access to your wallet—
        <Text color="pink">it's like your wallet's secret password.</Text>
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        You can{' '}
        <Text color="pink">enter your seed phrase on a new device to recover your wallet</Text> and
        access your funds.
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        Instead of memorizing your seed phrase,{' '}
        <Text color="pink">you can back it up to iCloud</Text> and protect it by setting a PIN.
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        You can also <Text color="pink">manually back up your seed phrase by writing it down</Text>{' '}
        and storing it in a safe place.
      </Text>
    }
  />,
  <Page
    text={
      <Text fontSize={28} lineHeight={34} variant="h2">
        We recommend using both types of backups, because{' '}
        <Text color="pink">
          if you lose all of your backups, you won’t be able to recover your wallet.
        </Text>
      </Text>
    }
  />,
]
