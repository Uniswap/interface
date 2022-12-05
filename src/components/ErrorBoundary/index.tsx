import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import React, { PropsWithChildren } from 'react'
import styled from 'styled-components/macro'

import { ExternalLink, ThemedText } from '../../theme'
import { AutoColumn } from '../Column'

const FallbackWrapper = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  width: 480px;
  margin: auto;
  padding: 1rem;
`

const SmallButtonPrimary = styled(ButtonPrimary)`
  width: auto;
  font-size: 16px;
  padding: 10px 16px;
  border-radius: 12px;
`

const SmallButtonLight = styled(ButtonLight)`
  font-size: 16px;
  padding: 10px 16px;
  border-radius: 12px;
`

const StretchedRow = styled.div`
  display: flex;
  gap: 24px;

  > * {
    display: flex;
    flex: 1;
  }
`

const Code = styled.code`
  font-weight: 300;
  font-size: 12px;
  line-height: 16px;
  word-wrap: break-word;
  width: 100%;
  color: ${({ theme }) => theme.textPrimary};
  font-family: courier, courier new, serif;
`

const CodeBlockWrapper = styled.div`
  display: flex;
  background: ${({ theme }) => theme.backgroundModule};
  overflow-y: scroll;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 24px;
  padding: 18px 24px;
  color: ${({ theme }) => theme.deprecated_text1};
`

const Fallback = ({ error }: { error: Error }) => {
  return (
    <FallbackWrapper>
      <BodyWrapper>
        <AutoColumn gap="xl">
          <AutoColumn gap="sm">
            <ThemedText.HeadlineLarge textAlign="center">
              <Trans>Something went wrong</Trans>
            </ThemedText.HeadlineLarge>
            <ThemedText.BodySecondary textAlign="center">
              <Trans>
                Sorry, an error occured while processing your request. If you request support, be sure to provide your
                error ID.
              </Trans>
            </ThemedText.BodySecondary>
          </AutoColumn>
          <CodeBlockWrapper>
            <Code>{error.stack}</Code>
          </CodeBlockWrapper>
          <StretchedRow>
            <SmallButtonPrimary onClick={() => window.location.reload()}>
              <Trans>Reload the app</Trans>
            </SmallButtonPrimary>
            <ExternalLink id="get-support-on-discord" href="https://discord.gg/FCfyBSbCU5" target="_blank">
              <SmallButtonLight>
                <Trans>Get support</Trans>
              </SmallButtonLight>
            </ExternalLink>
          </StretchedRow>
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

const updateServiceWorkerInBackground = async () => {
  try {
    const registration = await updateServiceWorker()

    // We want to refresh only if we detect a new service worker is waiting to be activated.
    // See details about it: https://web.dev/service-worker-lifecycle/
    if (registration?.waiting) {
      await registration.unregister()

      // Makes Workbox call skipWaiting().
      // For more info on skipWaiting see: https://web.dev/service-worker-lifecycle/#skip-the-waiting-phase
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
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
      onError={updateServiceWorkerInBackground}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
