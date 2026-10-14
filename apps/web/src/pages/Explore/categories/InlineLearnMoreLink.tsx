import { Anchor, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

/** "Learn more" link that sits inline at the end of a category description or disclaimer. */
export function InlineLearnMoreLink({ href, label }: { href: string; label?: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Anchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      textDecorationLine="none"
      color="$neutral1"
      fontWeight="$medium"
      fontSize="$small"
      lineHeight="$small"
      hoverStyle={{ opacity: 0.6 }}
      $platform-web={{ cursor: 'pointer' }}
    >
      <Text variant="buttonLabel3" color="$neutral1">
        {label ?? t('common.button.learn')}
      </Text>
    </Anchor>
  )
}
