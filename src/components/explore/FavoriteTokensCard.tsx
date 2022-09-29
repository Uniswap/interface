import { default as React, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { TokenItemBox } from 'src/components/explore/TokenItem'
import { AnimatedFlex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'

import { useFavoriteTokenInfo } from 'src/features/explore/hooks'
import { Screens } from 'src/screens/Screens'

import { FadeIn } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'

/** Renders the favorite tokens card on the Explore page */
export function FavoriteTokensCard({ metadataDisplayType }: { metadataDisplayType?: string }) {
  const { tokens: favorites, isLoading } = useFavoriteTokenInfo()
  const [isEditing, setIsEditing] = useState(false)

  const renderItem = useCallback(
    ({ item: token, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => {
      return (
        <TokenItemBox
          coin={token}
          gesturesEnabled={false}
          index={index}
          isEditing={isEditing}
          metadataDisplayType={metadataDisplayType}
        />
      )
    },
    [isEditing, metadataDisplayType]
  )

  return (
    <AnimatedFlex entering={FadeIn} gap="sm" mx="xs">
      <HeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      {isLoading ? (
        <Flex row alignItems="flex-start" m="sm">
          <Loading repeat={4} type="favorite" />
        </Flex>
      ) : (
        <FlatList
          horizontal
          ItemSeparatorComponent={() => <Separator mr="sm" />}
          ListEmptyComponent={FavoritesEmptyState}
          contentContainerStyle={{ ...flex.grow }}
          data={favorites}
          keyExtractor={key}
          listKey="explore-pinned-tokens"
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AnimatedFlex>
  )
}

function HeaderRow({ isEditing, onPress }: { isEditing: boolean; onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="textSecondary" variant="subheadSmall">
        {isEditing ? t('Edit pinned tokens') : t('Pinned tokens')}
      </Text>
      {!isEditing ? (
        <Button name={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={theme.colors.textSecondary}
            height={12}
            strokeLinecap="round"
            strokeWidth="1"
            width={14}
          />
        </Button>
      ) : (
        <TextButton textColor="accentActive" textVariant="smallLabel" onPress={onPress}>
          {t('Done')}
        </TextButton>
      )}
    </Flex>
  )
}

export function FavoritesEmptyState() {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  return (
    <BaseCard.EmptyState
      buttonLabel={t('Explore tokens')}
      description={t('Pin tokens to monitor their prices.')}
      onPress={() => {
        navigation.navigate(Screens.ExploreTokens)
      }}
    />
  )
}

function key({ id }: { id: string }) {
  return id
}
