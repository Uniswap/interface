import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router-dom'
import { Button, Flex, Stack, Text } from 'ui/src'
import DeadLuni from 'ui/src/assets/graphics/dead-luni.svg'

export function ErrorBoundary({ children }: PropsWithChildren<unknown>): JSX.Element {
  const error = useRouteError()
  const { t } = useTranslation()

  if (!error) {
    return <>{children}</>
  }

  return (
    <Stack
      alignItems="center"
      backgroundColor="$surface2"
      flex={1}
      minHeight="100vh"
      px="$spacing16"
      py="$spacing48"
      width="100%">
      <Flex centered grow gap="$spacing36">
        <DeadLuni />
        <Flex centered gap="$spacing12">
          <Text variant="subheadLarge">{t('Uh oh!')}</Text>
          <Text variant="bodySmall">{t('Something crashed.')}</Text>
        </Flex>
        {__DEV__ && (
          <Text variant="bodySmall">
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </Text>
        )}
      </Flex>
      <Button theme="primary" onPress={(): void => chrome.runtime.reload()}>
        {t('Restart app')}
      </Button>
    </Stack>
  )
}
