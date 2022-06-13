import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeInUp, FadeOut, FadeOutUp } from 'react-native-reanimated'
import { AppBackground } from 'src/components/gradients'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { FavoriteTokensSection } from 'src/features/explore/FavoriteTokensSection'
import { useTokenMetadataDisplayType } from 'src/features/explore/hooks'
import { SearchResultsSection } from 'src/features/explore/SearchResultsSection'
import { TopTokensSection } from 'src/features/explore/TopTokensSection'

export function ExploreScreen() {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)

  const onChangeSearchFilter = (newSearchFilter: string) => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = () => {
    setIsSearchMode(true)
  }

  const onSearchCancel = () => {
    setIsSearchMode(false)
  }

  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppBackground />
      <VirtualizedList>
        {!isSearchMode && (
          <AnimatedFlex entering={FadeInUp} exiting={FadeOutUp} mx="md" px="xs" py="sm">
            <Text variant="h3">{t('Explore')}</Text>
          </AnimatedFlex>
        )}
        <Flex gap="sm" mt="sm" mx="md">
          <SearchTextInput
            backgroundColor="neutralBackground"
            placeholder={t('Search for tokens, ENS, or address')}
            value={searchQuery}
            onCancel={onSearchCancel}
            onChangeText={onChangeSearchFilter}
            onFocus={onSearchFocus}
          />

          {isSearchMode ? (
            <AnimatedFlex entering={FadeIn} exiting={FadeOut} mt="sm">
              <SearchResultsSection searchQuery={searchQuery} />
            </AnimatedFlex>
          ) : (
            <>
              <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
                <FavoriteTokensSection
                  fixedCount={5}
                  metadataDisplayType={tokenMetadataDisplayType}
                  onCycleMetadata={cycleTokenMetadataDisplayType}
                />
              </AnimatedFlex>
              <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
                <TopTokensSection
                  fixedCount={10}
                  metadataDisplayType={tokenMetadataDisplayType}
                  onCycleMetadata={cycleTokenMetadataDisplayType}
                />
              </AnimatedFlex>
            </>
          )}
        </Flex>
      </VirtualizedList>
    </Screen>
  )
}
