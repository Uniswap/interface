import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { AnimatedFlex, Flex } from 'ui/src'
import { TokenLoader } from 'wallet/src/components/loading/TokenLoader'

export const SearchResultsLoader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('Tokens')} />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <TokenLoader repeat={2} />
        </AnimatedFlex>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('NFT Collections')} />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <TokenLoader repeat={2} />
        </AnimatedFlex>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText title={t('Wallets')} />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing8">
          <TokenLoader />
        </AnimatedFlex>
      </Flex>
    </Flex>
  )
}
