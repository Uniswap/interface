import React, { type ErrorInfo, type PropsWithChildren, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { type Dispatch } from 'redux'
import { Button, Flex, Switch, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { pushNotification, resetNotifications } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { type AppStateResetter } from 'uniswap/src/state/createAppStateResetter'
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
  appStateResetter?: AppStateResetter
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
    const { fallback, appStateResetter } = this.props

    if (error !== null) {
      return fallback === null ? null : fallback || <ErrorScreen error={error} appStateResetter={appStateResetter} />
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

const ICON_SIZE = 30

function ErrorScreen({ error, appStateResetter }: { error: Error; appStateResetter?: AppStateResetter }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const accounts = useAccounts()

  // If there is no active account, we need to reset the onboarding flow
  if (error.message === 'No active account' && Object.values(accounts).length === 0) {
    dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
  }

  const [isClearDataEnabled, setIsClearDataEnabled] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const handleRestart = useCallback(async () => {
    setIsRestarting(true)
    if (isClearDataEnabled && appStateResetter) {
      try {
        await appStateResetter.resetAll()
      } catch (e) {
        logger.error(e, {
          tags: {
            file: 'ErrorBoundary',
            function: 'handleRestart',
          },
        })
      }
    }
    await restartApp()
  }, [isClearDataEnabled, appStateResetter])

  return (
    <Trace logImpression element={ElementName.AppCrashScreen}>
      <Flex fill backgroundColor="$surface1" gap="$spacing20" px="$spacing16" py="$spacing48">
        <Flex centered grow gap="$spacing16">
          <Flex backgroundColor="$surface3" borderRadius="$rounded16" p="$spacing12">
            <AlertTriangleFilled color="$neutral1" size={ICON_SIZE} />
          </Flex>
          <Flex centered gap="$spacing8">
            <Text textAlign="center" variant="subheading1">
              {t('errors.crash.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('errors.crash.message')}
            </Text>
          </Flex>
          {error.message && !isProdEnv() && (
            <Text textAlign="center" variant="body3">
              {error.message}
            </Text>
          )}
        </Flex>

        {appStateResetter && (
          <Flex
            alignSelf="stretch"
            backgroundColor="$surface2"
            borderRadius="$rounded16"
            gap="$spacing8"
            p="$spacing16"
          >
            <Flex row alignItems="center" justifyContent="space-between">
              <Text variant="subheading2">{t('errors.crash.resetData.title')}</Text>
              <Switch checked={isClearDataEnabled} variant="default" onCheckedChange={setIsClearDataEnabled} />
            </Flex>
            <Text color="$neutral2" variant="body3">
              {t('errors.crash.resetData.description')}
            </Text>
          </Flex>
        )}

        <Flex row alignSelf="stretch">
          <Button
            backgroundColor="$neutral1"
            emphasis="primary"
            isDisabled={isRestarting}
            loading={isRestarting}
            onPress={handleRestart}
          >
            {t('errors.crash.restart')}
          </Button>
        </Flex>
      </Flex>
    </Trace>
  )
}
