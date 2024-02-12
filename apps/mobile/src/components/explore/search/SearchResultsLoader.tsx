import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { Loader } from 'src/components/loading'
import { AnimatedFlex, Flex } from 'ui/src'

export const SearchResultsLoader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('Tokens')} />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <Loader.Token repeat={2} />
        </AnimatedFlex>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('NFT Collections')} />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <Loader.Token repeat={2} />
        </AnimatedFlex>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('Wallets')} />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <Loader.Token />
        </AnimatedFlex>
      </Flex>
    </Flex>
  )
}
