import { GraphQLApi } from '@universe/api'
import dayjs from 'dayjs'
import React from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Flex, Text, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'

const formatTraitValue = (trait: GraphQLApi.NftAssetTrait): string | undefined => {
  if (!trait.value) {
    return undefined
  }

  if (trait.name?.toLowerCase().split(' ').includes('date')) {
    const date = dayjs(+trait.value * 1000)
    return date.isValid() ? date.format('MMM D, YYYY') : trait.value
  }

  return trait.value
}

export function NFTTraitCard({
  trait,
  titleTextColor,
}: {
  trait: GraphQLApi.NftAssetTrait
  titleTextColor?: string
}): JSX.Element {
  const colors = useSporeColors()

  return (
    <Flex
      backgroundColor={colors.surface2.val}
      borderRadius="$rounded16"
      gap="$spacing4"
      px="$spacing16"
      py="$spacing12"
    >
      <Text style={{ color: titleTextColor ?? colors.neutral2.get() }} variant="body3">
        {trait.name && trait.name.charAt(0).toUpperCase() + trait.name.slice(1).toLowerCase()}
      </Text>
      <Text color={colors.neutral1.val} variant="subheading2">
        {formatTraitValue(trait)}
      </Text>
    </Flex>
  )
}

export function NFTTraitList({
  traits,
  titleTextColor = 'neutral1',
}: {
  traits: GraphQLApi.NftAssetTrait[]
  titleTextColor?: string
}): JSX.Element {
  function renderItem(item: ListRenderItemInfo<GraphQLApi.NftAssetTrait>): JSX.Element {
    return <NFTTraitCard titleTextColor={titleTextColor} trait={item.item} />
  }

  return (
    <FlatList
      ItemSeparatorComponent={Separator}
      contentContainerStyle={Styles.listContainer}
      data={traits}
      horizontal={true}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
    />
  )
}

function Separator(): JSX.Element {
  return <Flex width={spacing.spacing8} />
}

const Styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.spacing24,
  },
})
