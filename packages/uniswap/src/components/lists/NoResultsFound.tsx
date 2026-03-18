import { Trans, useTranslation } from 'react-i18next'
import { ClickableWithinGesture, Flex, Text } from 'ui/src'
import { ArrowRight, WifiError } from 'ui/src/components/icons'

export function NoResultsFound({
  searchFilter,
  onResetPressed,
}: {
  searchFilter: string
  onResetPressed?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex>
      <Text color="$neutral3" mt="$spacing16" mx="$spacing20" variant="subheading2">
        <Trans
          components={{ highlight: <Text color="$neutral1" variant="subheading2" /> }}
          i18nKey="tokens.selector.search.empty"
          values={{ searchText: searchFilter }}
        />
      </Text>
      {onResetPressed && (
        <Flex
          row
          gap="$gap8"
          mt="$spacing6"
          ml="$spacing20"
          alignItems="center"
          $platform-web={{ cursor: 'pointer' }}
          pressStyle={{ opacity: 0.6 }}
          {...ClickableWithinGesture}
          onPress={onResetPressed}
        >
          <Text color="$neutral1" variant="body3">
            {t('tokens.selector.search.reset')}
          </Text>
          <ArrowRight size="$icon.12" color="$neutral1" />
        </Flex>
      )}
    </Flex>
  )
}

export function NetworkError(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$gap8" mt="$spacing16" mx="$spacing20">
      <WifiError color="$neutral3" size="$icon.20" />
      <Text color="$neutral3" variant="subheading2">
        {t('tokens.selector.search.networkError')}
      </Text>
    </Flex>
  )
}
