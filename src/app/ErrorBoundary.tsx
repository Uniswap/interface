import React, { ErrorInfo } from 'react'
import RNRestart from 'react-native-restart'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { logException } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { logger } from 'src/utils/logger'

interface ErrorBoundaryState {
  error: Error | null
}

// Uncaught errors during renders of subclasses will be caught here
// Errors in handlers (e.g. press handler) will not reach here
export class ErrorBoundary extends React.Component<unknown, ErrorBoundaryState> {
  constructor(props: unknown) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      LogContext.ErrorBoundary,
      'componentDidCatch',
      'Error caught by boundary',
      error,
      errorInfo
    )
    logException(LogContext.ErrorBoundary, error)
  }

  render() {
    const { error } = this.state
    if (error !== null) {
      return (
        <Flex alignItems="center" flex={1} justifyContent="center">
          <Text variant="headlineLarge">An Error Occurred</Text>
          {error.message && <Text variant="headlineSmall">{error.message}</Text>}
          <Box>
            <Button
              label="Restart"
              onPress={() => {
                RNRestart.Restart()
              }}
            />
          </Box>
        </Flex>
      )
    }
    return this.props.children
  }
}
