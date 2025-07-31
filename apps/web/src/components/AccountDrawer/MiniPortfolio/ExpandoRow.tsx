import { PropsWithChildren, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, HeightAnimator, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useTimeout } from 'utilities/src/time/timing'

type ExpandoRowProps = PropsWithChildren<{
  title?: string
  numItems: number
  isExpanded: boolean
  toggle: () => void
  enableOverflow?: boolean
}>

export function ExpandoRow({ title, numItems, isExpanded, toggle, children, enableOverflow = false }: ExpandoRowProps) {
  const { t } = useTranslation()
  const titleWithFallback = title ?? t('common.hidden')

  const [allowOverflow, setAllowOverflow] = useState(false)

  // Delay overflow change to prevent UI glitches when expanding/collapsing
  useTimeout(
    () => {
      if (enableOverflow && isExpanded) {
        setAllowOverflow(true)
      }
    },
    enableOverflow && isExpanded ? 300 : undefined,
  )

  useEffect(() => {
    if (!isExpanded) {
      setAllowOverflow(false)
    }
  }, [isExpanded])

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
      <HeightAnimator
        open={isExpanded}
        useInitialHeight
        styleProps={{ overflow: allowOverflow ? 'visible' : 'hidden' }}
      >
        {isExpanded && children}
      </HeightAnimator>
    </>
  )
}
