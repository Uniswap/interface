import { default as React } from 'react'
import { ListRenderItemInfo, SectionListData } from 'react-native'
import { SettingsSection, SettingsSectionItem, SettingsSectionItemComponent } from 'src/components/Settings/SettingsRow'

export type SectionData = SettingsSectionItem | SettingsSectionItemComponent
export type SectionInfo = { section: SectionListData<SectionData, SettingsSection> }

export type SettingsListProps = {
  sections: SettingsSection[]
  ItemSeparatorComponent?: React.ComponentType | null
  ListFooterComponent?: React.ComponentType | React.ReactElement | null
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null
  renderItem: (info: ListRenderItemInfo<SectionData>) => React.ReactElement | null
  renderSectionHeader?: (info: SectionInfo) => React.ReactElement | null
  renderSectionFooter?: (info: SectionInfo) => React.ReactElement | null
  showsVerticalScrollIndicator?: boolean
  keyExtractor: (item: SectionData, index: number) => string
}
