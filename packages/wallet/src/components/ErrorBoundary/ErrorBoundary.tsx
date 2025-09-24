import React, { ErrorInfo, PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'
import { Button, Flex, Text } from 'ui/src'
import { DEAD_LUNI } from 'ui/src/assets'
import { pushNotification, resetNotifications } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { isProdEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { restartApp } from 'wallet/src/components/ErrorBoundary/restartApp'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

const NOTIFICATION_ROUTER_COMPONENT_NAME = 'SharedNotificationToastRouter'

interface ErrorBoundaryState {
  error: Error | null
}

interface ErrorBoundariesDispatchProps {
  dispatch: Dispatch
}

interface ErrorBoundariesOwnProps {
  onError?: (error: Error | null) => void
  fallback?: React.ReactNode
  name?: string
  notificationText?: string
}

// Uncaught errors during renders of subclasses will be caught here
// Errors in handlers (e.g. press handler) will not reach here
class InternalErrorBoundary extends React.Component<
  PropsWithChildren<ErrorBoundariesOwnProps & ErrorBoundariesDispatchProps>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<ErrorBoundariesOwnProps & ErrorBoundariesDispatchProps>) {
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
    errorBoundaryError.stack = errorInfo.componentStack ?? undefined
    error.cause = errorBoundaryError

    logger.error(error, {
      level: 'error',
      tags: {
        file: 'ErrorBoundary',
        function: 'componentDidCatch',
        errorBoundaryName: this.props.name ?? 'Global',
      },
    })

    this.props.onError?.(error)

    const isNotificationError = !!errorBoundaryError.stack?.includes(NOTIFICATION_ROUTER_COMPONENT_NAME)
    if (isNotificationError) {
      this.props.dispatch(resetNotifications())
    }

    if (this.props.notificationText) {
      this.props.dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: this.props.notificationText,
        }),
      )
    }
  }

  render(): React.ReactNode {
    const { error } = this.state
    const { fallback } = this.props

    if (error !== null) {
      return fallback === null ? null : fallback || <ErrorScreen error={error} />
    }

    return this.props.children
  }
}

export function ErrorBoundary({
  notificationText,
  showNotification = false,
  ...props
}: PropsWithChildren<ErrorBoundariesOwnProps> & { showNotification?: boolean }): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  // We want to temporary disable non global error boundaries until https://linear.app/uniswap/issue/WALL-4461 is done
  const disableLocalErrorBoundaries = true
  // we do not pass `name` to global error boundary
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (disableLocalErrorBoundaries && props.name) {
    return <>{props.children}</>
  }

  return (
    <InternalErrorBoundary
      dispatch={dispatch}
      notificationText={showNotification ? (notificationText ?? t('common.error.somethingWrong')) : undefined}
      {...props}
    />
  )
}

const LUNI_SIZE = 150

function ErrorScreen({ error }: { error: Error }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const accounts = useAccounts()

  // If there is no active account, we need to reset the onboarding flow
  if (error.message === 'No active account' && Object.values(accounts).length === 0) {
    dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
  }

  return (
    <Trace logImpression element={ElementName.AppCrashScreen}>
      <Flex centered fill backgroundColor="$surface1" gap="$spacing16" px="$spacing16" py="$spacing48">
        <Flex centered grow gap="$spacing36">
          <Image resizeMode="contain" source={DEAD_LUNI} height={LUNI_SIZE} width={LUNI_SIZE} />
          <Flex centered gap="$spacing8">
            <Text variant="subheading1">{t('errors.crash.title')}</Text>
            <Text variant="body2">{t('errors.crash.message')}</Text>
          </Flex>
          {error.message && !isProdEnv() && <Text variant="body2">{error.message}</Text>}
        </Flex>
        <Flex row alignSelf="stretch">
          <Button emphasis="primary" variant="branded" onPress={restartApp}>
            {t('errors.crash.restart')}
          </Button>
        </Flex>
      </Flex>
    </Trace>
  )
}
