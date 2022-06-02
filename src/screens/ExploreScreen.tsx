import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AppBackground } from 'src/components/gradients'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { FavoriteTokensSection } from 'src/features/explore/FavoriteTokensSection'
import { SearchResultsSection } from 'src/features/explore/SearchResultsSection'
import { TopTokensSection } from 'src/features/explore/TopTokensSection'

export function ExploreScreen() {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false)

  const onChangeFilter = (newSearchFilter: string) => {
    setSearchQuery(newSearchFilter)
  }

  const onSearchFocus = () => {
    setIsSearchMode(true)
  }

  const onSearchBlur = () => {
    setIsSearchMode(false)
  }

  return (
    <Screen edges={['left', 'right']}>
      <AppBackground />
      <VirtualizedList>
        <Flex gap="lg" my="xl">
          <Flex row mt="lg" mx="lg">
            <Text variant="h3">{t('Explore')}</Text>
          </Flex>
          <Flex mx="md">
            <SearchTextInput
              backgroundColor="translucentBackground"
              placeholder={t('Search for tokens or address')}
              value={searchQuery}
              onBlur={onSearchBlur}
              onChangeText={onChangeFilter}
              onFocus={onSearchFocus}
            />

            {isSearchMode ? (
              <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
                <SearchResultsSection searchQuery={searchQuery} />
              </AnimatedFlex>
            ) : (
              <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
                <FavoriteTokensSection fixedCount={5} />
                <TopTokensSection fixedCount={10} />
              </AnimatedFlex>
            )}
          </Flex>
        </Flex>
      </VirtualizedList>
    </Screen>
  )
}
