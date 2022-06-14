import { default as React, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatListProps } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { CoingeckoMarketCoin, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { Screens } from 'src/screens/Screens'

export interface BaseTokenSectionProps {
  displayFavorites?: boolean
  expanded?: boolean
  fixedCount?: number
  metadataDisplayType: string
  orderBy?: CoingeckoOrderBy
  onCycleMetadata: () => void
}

type GenericTokenSectionProps<T> = BaseTokenSectionProps & {
  assets?: T[]
  horizontal?: boolean
  id: string
  loading?: boolean
  title: string | ReactNode
  subtitle?: string | ReactNode
  renderItem: FlatListProps<CoingeckoMarketCoin>['renderItem']
}

/** Renders a token section inside a Flatlist with expand behavior */
export function GenericTokenSection<T>({
  assets,
  displayFavorites,
  expanded,
  fixedCount,
  horizontal,
  id,
  loading,
  title,
  renderItem,
  subtitle,
}: GenericTokenSectionProps<T>) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  // TODO: refactor
  const onToggle = () => {
    if (expanded) {
      navigation.navigate(Screens.Explore)
    } else {
      navigation.navigate(Screens.ExploreTokens, { displayFavorites })
    }
  }

  return (
    <Section.Container>
      <Section.Header
        buttonLabel={t('View all')}
        expanded={!!expanded}
        subtitle={subtitle}
        title={title}
        onMaximize={onToggle}
        onMinimize={onToggle}
      />
      {loading ? (
        <Box padding="sm">
          <Loading repeat={4} type="box" />
        </Box>
      ) : (
        <Box ml={horizontal ? 'sm' : 'none'}>
          <Section.List
            ItemSeparatorComponent={() => <Separator ml="md" />}
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
