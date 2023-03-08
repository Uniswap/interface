import React from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { NftAssetTrait } from 'src/data/__generated__/types-and-hooks'
import { theme as FixedTheme } from 'src/styles/theme'

export function NFTTraitCard({
  trait,
  titleTextColor,
}: {
  trait: NftAssetTrait
  titleTextColor?: string
}): JSX.Element {
  const theme = useAppTheme()
  return (
    <Flex
      bg="textOnDimTertiary"
      borderRadius="rounded16"
      gap="spacing4"
      px="spacing16"
      py="spacing12">
      <Text
        style={{ color: titleTextColor ?? theme.colors.textOnBrightPrimary }}
        variant="buttonLabelMicro">
        {trait.name}
      </Text>
      <Text color="textOnBrightPrimary" variant="subheadSmall">
        {trait.value}
      </Text>
    </Flex>
  )
}

export function NFTTraitList({
  traits,
  titleTextColor = 'textPrimary',
}: {
  traits: NftAssetTrait[]
  titleTextColor?: string
}): JSX.Element {
  function renderItem(item: ListRenderItemInfo<NftAssetTrait>): JSX.Element {
    return <NFTTraitCard titleTextColor={titleTextColor} trait={item.item} />
  }

  return (
    <FlatList
      ItemSeparatorComponent={Separator}
      data={traits}
      horizontal={true}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
    />
  )
}

function Separator(): JSX.Element {
  return <Box width={FixedTheme.spacing.spacing8} />
}
