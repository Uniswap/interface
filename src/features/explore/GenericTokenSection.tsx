import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatListProps } from 'react-native'
import { SharedElement } from 'react-navigation-shared-element'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Box, Inset } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Loading } from 'src/components/loading'
import { Asset } from 'src/features/dataApi/zerion/types'
import { Screens } from 'src/screens/Screens'

export interface BaseTokenSectionProps {
  expanded?: boolean
  fixedCount?: number
}

type GenericTokenSectionProps = BaseTokenSectionProps & {
  assets?: Nullable<Asset[]>
  horizontal?: boolean
  id: string
  loading?: boolean
  title: string
  renderItem: FlatListProps<Asset>['renderItem']
}

/** Renders a token section inside a Flatlist with expand behavior */
export function GenericTokenSection({
  assets,
  expanded,
  fixedCount,
  id,
  loading,
  title,
  renderItem,
  horizontal,
}: GenericTokenSectionProps) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  // TODO: refactor
  const onToggle = () => {
    if (expanded) {
      navigation.goBack()
    } else {
      navigation.navigate(Screens.ExploreTokens)
    }
  }

  return (
    <Section.Container>
      <SharedElement id={id}>
        <Section.Header
          buttonLabel={t('View all')}
          expanded={!!expanded}
          title={title}
          onMaximize={onToggle}
          onMinimize={onToggle}
        />
      </SharedElement>
      {loading ? (
        <Box padding="sm">
          <Loading repeat={4} type="box" />
        </Box>
      ) : (
        <Section.List
          ItemSeparatorComponent={Separator}
          data={fixedCount ? assets?.slice(0, fixedCount) : assets}
          horizontal={horizontal}
          keyExtractor={key}
          listKey={id}
          renderItem={renderItem}
        />
      )}
    </Section.Container>
  )
}

function Separator() {
  return <Inset all="xs" />
}

function key(asset: Asset) {
  return asset.asset.asset_code
}
