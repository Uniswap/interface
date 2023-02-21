import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { Text } from 'src/components/Text'

interface RecipientListProps {
  sections: SectionListData<SearchableRecipient>[]
  onPress: (recipient: string) => void
}

export function RecipientList({ onPress, sections }: RecipientListProps): JSX.Element {
  const renderItem = function ({ item }: ListRenderItemInfo<SearchableRecipient>): JSX.Element {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} py="spacing12">
        <RecipientRow recipient={item} onPress={onPress} />
      </AnimatedFlex>
    )
  }

  return (
    <SectionList
      bounces={false}
      keyExtractor={key}
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      renderSectionHeader={SectionHeader}
      sections={sections}
    />
  )
}

function SectionHeader(info: { section: SectionListData<SearchableRecipient> }): JSX.Element {
  return (
    <AnimatedFlex backgroundColor="background1" entering={FadeIn} exiting={FadeOut} py="spacing8">
      <Text color="textSecondary" variant="subheadSmall">
        {info.section.title}
      </Text>
    </AnimatedFlex>
  )
}

function key(recipient: SearchableRecipient): string {
  return `recipient-${recipient.address}`
}

interface RecipientProps {
  recipient: SearchableRecipient
  onPress: (recipient: string) => void
}

export function RecipientRow({ recipient, onPress }: RecipientProps): JSX.Element {
  return (
    <TouchableArea onPress={(): void => onPress(recipient.address)}>
      <AddressDisplay address={recipient.address} size={35} />
    </TouchableArea>
  )
}

export function RecipientLoadingRow(): JSX.Element {
  const { t } = useTranslation()
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} mx="spacing8">
      <Text color="textTertiary" variant="bodySmall">
        {t('Search Results')}
      </Text>
      <Loader.Token />
    </AnimatedFlex>
  )
}
