import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { SearchPopularNFTCollections } from 'src/components/explore/search/SearchPopularNFTCollections'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { renderSearchItem } from 'src/components/explore/search/SearchResultsSection'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import ClockIcon from 'ui/src/assets/icons/clock.svg'
import { InfoCircleFilled, Star, TrendUp } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'

const TrendUpIcon = <TrendUp color="$neutral2" size="$icon.24" />

export function SearchEmptySection({ selectedChain }: { selectedChain: UniverseChainId | null }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const searchHistory = useSelector(selectSearchHistory)

  const [showPopularInfo, setShowPopularInfo] = useState(false)

  // Popular NFT collections data is only available on Mainnet
  // TODO(WALL-5876): Update this once we have a way to fetch NFT collections for all chains
  const showPopularNftCollections = !selectedChain || selectedChain === UniverseChainId.Mainnet

  const onPressClearSearchHistory = (): void => {
    dispatch(clearSearchHistory())
  }

  const onPopularTokenInfoPress = (): void => {
    dismissNativeKeyboard()
    setShowPopularInfo(true)
  }

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <>
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing12" pb="$spacing36">
        {searchHistory.length > 0 && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
            <FlatList
              ListHeaderComponent={
                <Flex
                  row
                  alignItems="center"
                  gap="$spacing16"
                  justifyContent="space-between"
                  mb="$spacing4"
                  pr="$spacing20"
                >
                  <SectionHeaderText
                    icon={
                      <ClockIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
                    }
                    title={t('explore.search.section.recent')}
                  />
                  <TouchableArea onPress={onPressClearSearchHistory}>
                    <Text color="$accent1" variant="buttonLabel2">
                      {t('explore.search.action.clear')}
                    </Text>
                  </TouchableArea>
                </Flex>
              }
              data={searchHistory}
              renderItem={(props): JSX.Element | null =>
                renderSearchItem({ ...props, searchContext: { isHistory: true } })
              }
            />
          </AnimatedFlex>
        )}
        <Flex gap="$spacing4">
          <SectionHeaderText
            afterIcon={<InfoCircleFilled color="$neutral2" size="$icon.16" />}
            icon={TrendUpIcon}
            title={t('explore.search.section.popularTokens')}
            onPress={onPopularTokenInfoPress}
          />
          <SearchPopularTokens selectedChain={selectedChain} />
        </Flex>
        {showPopularNftCollections && (
          <Flex gap="$spacing4">
            <SectionHeaderText icon={TrendUpIcon} title={t('explore.search.section.popularNFT')} />
            <SearchPopularNFTCollections />
          </Flex>
        )}
      </AnimatedFlex>
      <WarningModal
        backgroundIconColor={colors.surface3.get()}
        caption={t('explore.search.section.popularTokenInfo')}
        rejectText={t('common.button.close')}
        icon={<Star color="$neutral1" size="$icon.24" />}
        isOpen={showPopularInfo}
        modalName={ModalName.NetworkFeeInfo}
        severity={WarningSeverity.None}
        title={t('explore.search.section.popularTokens')}
        onClose={() => setShowPopularInfo(false)}
      />
    </>
  )
}
