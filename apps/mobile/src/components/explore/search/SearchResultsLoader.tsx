import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { AnimatedBox } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { Flex } from 'ui/src'

export const SearchResultsLoader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('Tokens')} />
        <AnimatedBox entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <Loader.Token repeat={2} />
        </AnimatedBox>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('NFT Collections')} />
        <AnimatedBox entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <Loader.Token repeat={2} />
        </AnimatedBox>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('Wallets')} />
        <AnimatedBox entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <Loader.Token />
        </AnimatedBox>
      </Flex>
    </Flex>
  )
}
