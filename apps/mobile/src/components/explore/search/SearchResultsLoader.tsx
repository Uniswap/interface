import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { Flex, Loader } from 'ui/src'
import { Coin, Gallery, Person } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const SearchResultsLoader = ({ selectedChain }: { selectedChain: UniverseChainId | null }): JSX.Element => {
  const { t } = useTranslation()

  // Only mainnet or "all" networks support nfts, hide loader otherwise
  const hideNftLoading = selectedChain !== null && selectedChain !== UniverseChainId.Mainnet

  return (
    <Flex gap="$spacing16">
      <Flex gap="$spacing12">
        <SectionHeaderText
          icon={<Coin color="$neutral2" size="$icon.24" />}
          title={t('explore.search.section.tokens')}
        />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing24">
          <Loader.Token repeat={2} />
        </AnimatedFlex>
      </Flex>
      <Flex gap="$spacing12">
        <SectionHeaderText
          icon={<Person color="$neutral2" size="$icon.24" />}
          title={t('explore.search.section.wallets')}
        />
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing24">
          <Loader.Token />
        </AnimatedFlex>
      </Flex>
      {!hideNftLoading && (
        <Flex gap="$spacing12">
          <SectionHeaderText
            icon={<Gallery color="$neutral2" size="$icon.24" />}
            title={t('explore.search.section.nft')}
          />
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="$spacing24">
            <Loader.Token repeat={2} />
          </AnimatedFlex>
        </Flex>
      )}
    </Flex>
  )
}
