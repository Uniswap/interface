import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'

// TODO: Extract to Spore ExpandoRow component (WEB-7906)
export function DropdownController({
  open,
  onClick,
  children,
}: PropsWithChildren & { open: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <TouchableArea
      px="$spacing16"
      my="$spacing4"
      height={28}
      alignItems="center"
      backgroundColor="transparent"
      activeOpacity={1}
      hoverable={false}
      onPress={onClick}
    >
      <Separator />
      <Flex row alignItems="center" mr={-6} px="$spacing16" minWidth="fit-content" flexShrink={0}>
        <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
          {children ? children : open ? t('common.showLess.button') : t('common.showMore.button')}
        </Text>
        {open ? <ChevronsIn color="$neutral2" size="$icon.16" /> : <ChevronsOut color="$neutral2" size="$icon.16" />}
      </Flex>
      <Separator />
    </TouchableArea>
  )
}
