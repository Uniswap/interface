import { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { Flex } from 'ui/src'
import { NoTokens } from 'ui/src/components/icons/NoTokens'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { isExtensionApp } from 'utilities/src/platform'

interface TokensListEmptyStateProps {
  containerStyle?: StyleProp<ViewStyle | CSSProperties | (ViewStyle & CSSProperties)>
  title?: string
  description?: string | null
  buttonLabel?: string
  onPress?: () => void
}

export function TokensListEmptyState({
  containerStyle,
  title,
  description,
  buttonLabel,
  onPress,
}: TokensListEmptyStateProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered pt="$spacing48" px="$spacing36" style={containerStyle}>
      <BaseCard.EmptyState
        buttonLabel={buttonLabel ?? (isExtensionApp ? t('tokens.list.none.button') : undefined)}
        description={description === undefined ? t('tokens.list.none.description.default') : description}
        icon={<NoTokens color="$neutral3" size="$icon.100" />}
        title={title ?? t('tokens.list.none.title')}
        onPress={onPress}
      />
    </Flex>
  )
}
