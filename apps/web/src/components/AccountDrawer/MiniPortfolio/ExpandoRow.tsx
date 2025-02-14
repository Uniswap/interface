import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, Text, TouchableArea, styled } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

const ToggleButton = styled(Flex, {
  row: true,
  alignItems: 'center',
  py: '$spacing4',
  pr: '$spacing8',
  pl: '$spacing12',
  borderRadius: '$rounded12',
  backgroundColor: '$surface3',
  hoverStyle: { backgroundColor: '$surface3Hovered' },
})

// TODO(WEB-1982): Replace this component to use `components/Expand` under the hood
type ExpandoRowProps = PropsWithChildren<{ title?: string; numItems: number; isExpanded: boolean; toggle: () => void }>
export function ExpandoRow({ title, numItems, isExpanded, toggle, children }: ExpandoRowProps) {
  const { t } = useTranslation()
  const titleWithFallback = title ?? t('common.hidden')
  if (numItems === 0) {
    return null
  }
  return (
    <>
      <Flex row justifyContent="space-between" alignItems="center" p="$spacing16">
        <Text variant="subheading2" color="$neutral2">{`${titleWithFallback} (${numItems})`}</Text>
        <TouchableArea>
          <ToggleButton onPress={toggle}>
            <Text variant="buttonLabel3" fontWeight="$book" color="$neutral2">
              {isExpanded ? t('common.hide.button') : t('common.show.button')}
            </Text>
            <RotatableChevron animation="200ms" direction={isExpanded ? 'up' : 'down'} />
          </ToggleButton>
        </TouchableArea>
      </Flex>
      <HeightAnimator open={isExpanded}>{children}</HeightAnimator>
    </>
  )
}
