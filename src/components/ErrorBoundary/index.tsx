import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import React, { PropsWithChildren } from 'react'
import styled from 'styled-components/macro'

import { ExternalLink, ThemedText } from '../../theme'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const FallbackWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  z-index: 1;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  padding: 1rem;
  width: 100%;
`

const CodeBlockWrapper = styled.div`
  background: ${({ theme }) => theme.deprecated_bg0};
  overflow: auto;
  white-space: pre;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 24px;
  padding: 18px 24px;
  color: ${({ theme }) => theme.deprecated_text1};
`

const Padding = styled.div`
  padding: 6px 24px;
`

const Fallback = ({ error }: { error: Error }) => {
  return (
    <FallbackWrapper>
      <BodyWrapper>
        <AutoColumn gap="md">
          <Padding>
            <ThemedText.DeprecatedLabel fontSize={24} fontWeight={600}>
              <Trans>Something went wrong</Trans>
            </ThemedText.DeprecatedLabel>
          </Padding>
          <CodeBlockWrapper>
            <code>
              <ThemedText.DeprecatedMain fontSize={10}>{error.stack}</ThemedText.DeprecatedMain>
            </code>
          </CodeBlockWrapper>
          <AutoRow>
            <Padding>
              <ExternalLink id="get-support-on-discord" href="https://discord.gg/FCfyBSbCU5" target="_blank">
                <ThemedText.DeprecatedLink fontSize={16} color="deprecated_blue1">
                  <Trans>Get support on Discord</Trans>
                  <span>↗</span>
                </ThemedText.DeprecatedLink>
              </ExternalLink>
            </Padding>
          </AutoRow>
        </AutoColumn>
      </BodyWrapper>
    </FallbackWrapper>
  )
}

async function updateServiceWorker(): Promise<ServiceWorkerRegistration> {
  const ready = await navigator.serviceWorker.ready
  // the return type of update is incorrectly typed as Promise<void>. See
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
  return ready.update() as unknown as Promise<ServiceWorkerRegistration>
}

const reloadIfUpdateAvailable = async () => {
  try {
    const registration = await updateServiceWorker()

    // We want to refresh only if we detect a new service worker is waiting to be activated.
    // See details about it: https://web.dev/service-worker-lifecycle/
    if (registration?.waiting) {
      await registration.unregister()

      // Makes Workbox call skipWaiting().
      // For more info on skipWaiting see: https://web.dev/service-worker-lifecycle/#skip-the-waiting-phase
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      window.location.reload()
    }
  } catch (error) {
    console.error('Failed to update service worker', error)
  }
}

export default function ErrorBoundary({ children }: PropsWithChildren): JSX.Element {
  return (
    <Sentry.ErrorBoundary
      fallback={Fallback}
      beforeCapture={(scope) => {
        scope.setLevel('fatal')
      }}
      onError={reloadIfUpdateAvailable}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
