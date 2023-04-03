import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'

export const SearchResultsLoader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="spacing16">
      <Flex gap="spacing12">
        <SectionHeaderText title={t('Tokens')} />
        <Box mx="spacing8">
          <Loader.Token repeat={2} />
        </Box>
      </Flex>
      <Flex gap="spacing12">
        <SectionHeaderText title={t('NFT Collections')} />
        <Box mx="spacing8">
          <Loader.Token repeat={2} />
        </Box>
      </Flex>
      <Flex gap="spacing12">
        <SectionHeaderText title={t('Wallets')} />
        <Loader.Token />
      </Flex>
    </AnimatedFlex>
  )
}
