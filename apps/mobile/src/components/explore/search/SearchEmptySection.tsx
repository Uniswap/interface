import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { SearchPopularNFTCollections } from 'src/components/explore/search/SearchPopularNFTCollections'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { renderSearchItem } from 'src/components/explore/search/SearchResultsSection'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { AnimatedFlex, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import ClockIcon from 'ui/src/assets/icons/clock.svg'
import TrendArrowIcon from 'ui/src/assets/icons/trend-up.svg'
import { iconSizes } from 'ui/src/theme'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { clearSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import {
  SearchResult,
  SearchResultType,
  WalletSearchResult,
} from 'wallet/src/features/search/SearchResult'
import { selectSearchHistory } from 'wallet/src/features/search/selectSearchHistory'

export const SUGGESTED_WALLETS: WalletSearchResult[] = [
  {
    type: SearchResultType.ENSAddress,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ensName: 'vitalik.eth',
  },
  {
    type: SearchResultType.ENSAddress,
    address: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    ensName: 'hayden.eth',
  },
]

export function SearchEmptySection(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const searchHistory = useAppSelector(selectSearchHistory)
  const unitagFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)

  const onPressClearSearchHistory = (): void => {
    dispatch(clearSearchHistory())
  }

  const modifiedHistory: SearchResult[] = useMemo(
    () =>
      searchHistory.map((historyItem: SearchResult) => {
        if (!unitagFeatureFlagEnabled && historyItem.type === SearchResultType.Unitag) {
          return {
            type: SearchResultType.WalletByAddress,
            address: historyItem.address,
            searchId: historyItem.searchId,
          }
        } else {
          return historyItem
        }
      }),
    [searchHistory, unitagFeatureFlagEnabled]
  )

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing12">
      {searchHistory.length > 0 && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
          <FlatList
            ListHeaderComponent={
              <Flex
                row
                alignItems="center"
                gap="$spacing16"
                justifyContent="space-between"
                mb="$spacing4">
                <SectionHeaderText
                  icon={<RecentIcon />}
                  title={t('explore.search.section.recent')}
                />
                <TouchableArea onPress={onPressClearSearchHistory}>
                  <Text color="$accent1" variant="buttonLabel3">
                    {t('explore.search.action.clear')}
                  </Text>
                </TouchableArea>
              </Flex>
            }
            data={modifiedHistory}
            renderItem={(props): JSX.Element | null =>
              renderSearchItem({ ...props, searchContext: { isHistory: true } })
            }
          />
        </AnimatedFlex>
      )}
      <Flex gap="$spacing4">
        <SectionHeaderText icon={<TrendIcon />} title={t('explore.search.section.popularTokens')} />
        <SearchPopularTokens />
      </Flex>
      <Flex gap="$spacing4">
        <SectionHeaderText icon={<TrendIcon />} title={t('explore.search.section.popularNFT')} />
        <SearchPopularNFTCollections />
      </Flex>
      <FlatList
        ListHeaderComponent={
          <SectionHeaderText
            icon={<TrendIcon />}
            title={t('explore.search.section.suggestedWallets')}
          />
        }
        data={SUGGESTED_WALLETS}
        keyExtractor={walletKey}
        renderItem={renderSearchItem}
      />
    </AnimatedFlex>
  )
}

const walletKey = (wallet: WalletSearchResult): string => {
  return wallet.address
}

export const TrendIcon = (): JSX.Element => {
  const colors = useSporeColors()
  return <TrendArrowIcon color={colors.neutral2.get()} width={iconSizes.icon20} />
}

export const RecentIcon = (): JSX.Element => {
  const colors = useSporeColors()
  return (
    <ClockIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
  )
}
