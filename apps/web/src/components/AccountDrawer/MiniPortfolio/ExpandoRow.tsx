import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, HeightAnimator, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

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
        <Button
          fill={false}
          icon={<RotatableChevron color="$neutral2" animation="200ms" direction={isExpanded ? 'up' : 'down'} />}
          iconPosition="after"
          size="small"
          emphasis="secondary"
          onPress={toggle}
        >
          <Button.Text color="$neutral2">{isExpanded ? t('common.hide.button') : t('common.show.button')}</Button.Text>
        </Button>
      </Flex>
      <HeightAnimator open={isExpanded}>{children}</HeightAnimator>
    </>
  )
}
