import { Text, type TextCompatProps } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

export function HookUnavailableValue({
  variant = 'body2',
  ...textProps
}: Omit<TextCompatProps, 'children' | 'color' | 'aria-hidden'>): JSX.Element {
  const { t } = useTranslation()

  return (
    <>
      <Text {...textProps} tag="span" variant={variant} color="$neutral3" aria-hidden>
        —
      </Text>
      <Text tag="span" className="sr-only">
        {t('common.unavailable')}
      </Text>
    </>
  )
}
