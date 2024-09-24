import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Keyboard } from 'react-native'
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
import { SearchResultType, WalletSearchResult } from 'uniswap/src/features/search/SearchResult'
import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'

const TrendUpIcon = <TrendUp color="$neutral2" size="$icon.24" />

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
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const searchHistory = useSelector(selectSearchHistory)

  const [showPopularInfo, setShowPopularInfo] = useState(false)

  const onPressClearSearchHistory = (): void => {
    dispatch(clearSearchHistory())
  }

  const onPopularTokenInfoPress = (): void => {
    Keyboard.dismiss()
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
                  <SectionHeaderText icon={<RecentIcon />} title={t('explore.search.section.recent')} />
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
          <SearchPopularTokens />
        </Flex>
        <Flex gap="$spacing4">
          <SectionHeaderText icon={TrendUpIcon} title={t('explore.search.section.popularNFT')} />
          <SearchPopularNFTCollections />
        </Flex>
        <FlatList
          ListHeaderComponent={
            <SectionHeaderText icon={TrendUpIcon} title={t('explore.search.section.suggestedWallets')} />
          }
          data={SUGGESTED_WALLETS}
          keyExtractor={walletKey}
          renderItem={renderSearchItem}
        />
      </AnimatedFlex>
      <WarningModal
        backgroundIconColor={colors.surface2.get()}
        caption={t('explore.search.section.popularTokenInfo')}
        closeText={t('common.button.close')}
        icon={<Star color="$neutral2" size="$icon.24" />}
        isOpen={showPopularInfo}
        modalName={ModalName.NetworkFeeInfo}
        severity={WarningSeverity.None}
        title={t('explore.search.section.popularTokens')}
        onClose={() => setShowPopularInfo(false)}
      />
    </>
  )
}

const walletKey = (wallet: WalletSearchResult): string => {
  return wallet.address
}

export const RecentIcon = (): JSX.Element => {
  const colors = useSporeColors()
  return <ClockIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
}
