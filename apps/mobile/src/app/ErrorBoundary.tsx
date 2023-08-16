import React, { ErrorInfo, PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import RNRestart from 'react-native-restart'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import DeadLuni from 'ui/src/assets/graphics/dead-luni.svg'
import { logger } from 'utilities/src/logger/logger'

interface ErrorBoundaryState {
  error: Error | null
}

// Uncaught errors during renders of subclasses will be caught here
// Errors in handlers (e.g. press handler) will not reach here
export class ErrorBoundary extends React.Component<PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error & { cause?: Error }, errorInfo: ErrorInfo): void {
    // Based on https://github.com/getsentry/sentry-javascript/blob/develop/packages/react/src/errorboundary.tsx
    const errorBoundaryError = new Error(error.message)
    errorBoundaryError.name = `React ErrorBoundary ${errorBoundaryError.name}`
    errorBoundaryError.stack = errorInfo.componentStack
    error.cause = errorBoundaryError

    logger.error(error, {
      level: 'fatal',
      tags: {
        file: 'ErrorBoundary',
        function: 'componentDidCatch',
      },
    })
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (error !== null) {
      return <ErrorScreen error={error} />
    }

    return this.props.children
  }
}

function ErrorScreen({ error }: { error: Error }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex alignItems="center" flex={1} justifyContent="center" px="spacing16" py="spacing48">
      <Flex centered grow gap="spacing36">
        <DeadLuni />
        <Flex centered gap="spacing12">
          <Text variant="subheadLarge">{t('Uh oh!')}</Text>
          <Text variant="bodySmall">{t('Something crashed.')}</Text>
        </Flex>
        {error.message && __DEV__ && <Text variant="bodySmall">{error.message}</Text>}
      </Flex>
      <Box alignSelf="stretch">
        <Button
          label={t('Restart app')}
          onPress={(): void => {
            RNRestart.Restart()
          }}
        />
      </Box>
    </Flex>
  )
}
