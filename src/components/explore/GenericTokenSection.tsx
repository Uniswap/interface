import { default as React, ReactElement, ReactNode } from 'react'
import { FlatListProps } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { CoingeckoMarketCoin, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

export interface BaseTokenSectionProps {
  displayFavorites?: boolean
  fixedCount?: number
  metadataDisplayType: string
  orderBy?: CoingeckoOrderBy
  onCycleMetadata?: () => void
}

type GenericTokenSectionProps<T> = BaseTokenSectionProps & {
  assets?: T[]
  ListEmptyComponent?: ReactElement
  horizontal?: boolean
  id: string
  loading?: boolean
  title: string | ReactNode
  subtitle?: string | ReactNode
  renderItem: FlatListProps<CoingeckoMarketCoin>['renderItem']
}

/** Renders a token section inside a Flatlist with expand behavior */
export function GenericTokenSection<T>({
  ListEmptyComponent,
  assets,
  displayFavorites,
  fixedCount,
  horizontal,
  id,
  loading,
  renderItem,
  subtitle,
  title,
}: GenericTokenSectionProps<T>) {
  const navigation = useExploreStackNavigation()

  const onPress = () => {
    if (displayFavorites) {
      navigation.navigate(Screens.ExploreFavorites)
    } else {
      navigation.navigate(Screens.ExploreTokens)
    }
  }

  return (
    <Section.Container>
      <Section.Header subtitle={subtitle} title={title} onPress={onPress} />
      {loading ? (
        <Box padding="sm">
          <Loading repeat={4} type="box" />
        </Box>
      ) : (
        <Box ml={horizontal ? 'sm' : 'none'} mt={horizontal ? 'sm' : 'none'}>
          <Section.List
            ItemSeparatorComponent={() => <Separator ml={horizontal ? 'sm' : 'none'} />}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={flex.fill}
            data={fixedCount ? assets?.slice(0, fixedCount) : assets}
            horizontal={horizontal}
            keyExtractor={key}
            listKey={id}
            renderItem={renderItem}
          />
        </Box>
      )}
    </Section.Container>
  )
}

function key({ id }: { id: string }) {
  return id
}
