import { default as React, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatListProps } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Asset, OrderBy } from 'src/features/dataApi/zerion/types'
import { Screens } from 'src/screens/Screens'

export interface BaseTokenSectionProps {
  onCycleMetadata: () => void
  expanded?: boolean
  fixedCount?: number
  metadataDisplayType: string
  orderBy?: OrderBy
}

type GenericTokenSectionProps = BaseTokenSectionProps & {
  assets?: Nullable<Asset[]>
  horizontal?: boolean
  id: string
  loading?: boolean
  title: string
  subtitle?: string | ReactNode
  renderItem: FlatListProps<Asset>['renderItem']
}

/** Renders a token section inside a Flatlist with expand behavior */
export function GenericTokenSection({
  assets,
  expanded,
  fixedCount,
  horizontal,
  id,
  loading,
  title,
  renderItem,
  subtitle,
}: GenericTokenSectionProps) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  // TODO: refactor
  const onToggle = () => {
    if (expanded) {
      navigation.navigate(Screens.Explore)
    } else {
      navigation.navigate(Screens.ExploreTokens)
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

function key(asset: Asset) {
  return asset.asset.asset_code
}
