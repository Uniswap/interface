import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import EnsNameResults from 'src/components/CurrencySelector/EnsNameResults'
import { AppBackground } from 'src/components/gradients'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { FavoriteTokensSection } from 'src/features/explore/FavoriteTokensSection'
import { TopTokensSection } from 'src/features/explore/TopTokensSection'

export function ExploreScreen() {
  const { t } = useTranslation()

  const [searchFilter, setSearchFilter] = useState<string>('')
  const { address: ensAddress, name: ensName } = useENS(ChainId.Mainnet, searchFilter)

  const onChangeFilter = (newSearchFilter: string) => {
    setSearchFilter(newSearchFilter)
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
              placeholder={t('Search token symbols or address')}
              value={searchFilter}
              onChangeText={onChangeFilter}
            />
          </Flex>
          {ensName && ensAddress ? (
            <EnsNameResults
              names={[
                {
                  name: ensName,
                  address: ensAddress,
                },
              ]}
            />
          ) : null}
          <Flex mx="md">
            <FavoriteTokensSection fixedCount={5} />
            <TopTokensSection fixedCount={5} />
          </Flex>
        </Flex>
      </VirtualizedList>
    </Screen>
  )
}
