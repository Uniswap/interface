import * as SentryBrowser from '@sentry/browser'
import * as Sentry from '@sentry/react'
import { setTag } from '@sentry/react'
import { useEffect } from 'react'
import {
  createHashRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import { getSentryEnvironment } from 'src/app/version'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'
import { beforeSend } from 'wallet/src/utils/sentry'

export const enum SentryAppNameTag {
  Sidebar = 'sidebar',
  Onboarding = 'onboarding',
  ContentScript = 'content-script',
  Background = 'background',
}

export function initializeSentry(appNameTag: SentryAppNameTag, sentryUserId: string): void {
  if (__DEV__) {
    return
  }
  Sentry.init({
    environment: getSentryEnvironment(),
    dsn: config.sentryDsn,
    release: process.env.VERSION,
    integrations: [
      new Sentry.BrowserTracing({
        // See docs for support of different versions of variation of react router
        // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        ),
      }),
    ],
    beforeSend,
    ...sentrySampleRateOptions,
  })
  setTag('appName', appNameTag)
  Sentry.setUser({ id: sentryUserId })
}

export function initSentryForBrowserScripts(appNameTag: SentryAppNameTag, sentryUserId: string): void {
  if (__DEV__) {
    return
  }

  // Wrapped in try/catch because in this context it can fail silently
  try {
    SentryBrowser.init({
      environment: getSentryEnvironment(),
      dsn: config.sentryDsn,
      release: process.env.VERSION,
      // TODO (EXT-528): Look into adding tracing integration
      beforeSend,
      ...sentrySampleRateOptions,
    })
  } catch (e) {
    logger.debug('sentry.ts', 'initSentryForBrowserScripts', 'Error in Sentry init', e)
  }
  setTag('appName', appNameTag)

  if (sentryUserId) {
    SentryBrowser.setUser({ id: sentryUserId })
  }
}

const sentrySampleRateOptions = {
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
}

export const sentryCreateHashRouter = Sentry.wrapCreateBrowserRouter(createHashRouter)
