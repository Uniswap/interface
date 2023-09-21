import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router-dom'
import { Button, Flex, Text } from 'ui/src'
import DeadLuni from 'ui/src/assets/graphics/dead-luni.svg'

export function ErrorBoundary({ children }: PropsWithChildren<unknown>): JSX.Element {
  const error = useRouteError()
  const { t } = useTranslation()

  if (!error) {
    return <>{children}</>
  }

  return (
    <Flex
      fill
      alignItems="center"
      bg="$surface2"
      minHeight="100vh"
      px="$spacing16"
      py="$spacing48"
      width="100%">
      <Flex centered grow gap="$spacing36">
        <DeadLuni />
        <Flex centered gap="$spacing12">
          <Text variant="subheading1">{t('Uh oh!')}</Text>
          <Text variant="body2">{t('Something crashed.')}</Text>
        </Flex>
        {__DEV__ && (
          <Text variant="body2">
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </Text>
        )}
      </Flex>
      <Button theme="primary" onPress={(): void => chrome.runtime.reload()}>
        {t('Restart app')}
      </Button>
    </Flex>
  )
}
