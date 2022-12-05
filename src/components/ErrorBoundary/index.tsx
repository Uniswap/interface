import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { ChevronUpIcon } from 'nft/components/icons'
import React, { PropsWithChildren, useState } from 'react'
import { Copy } from 'react-feather'
import styled from 'styled-components/macro'

import { CopyToClipboard, ExternalLink, ThemedText } from '../../theme'
import { AutoColumn } from '../Column'

const FallbackWrapper = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  width: 500px;
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

const Separator = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const CodeBlockWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.backgroundModule};
  overflow-y: scroll;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 24px;
  padding: 24px;
  gap: 10px;
  color: ${({ theme }) => theme.textPrimary};
`

const ShowMoreButton = styled.div`
  display: flex;
  cursor: pointer;
  justify-content: space-between;
`

const CopyIcon = styled(Copy)`
  stroke: ${({ theme }) => theme.textSecondary};
`

const ShowMoreIcon = styled(ChevronUpIcon)<{ $isExpanded?: boolean }>`
  transform: ${({ $isExpanded }) => ($isExpanded ? 'none' : 'rotate(180deg)')};
`

const CodeTitle = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
`

const Fallback = ({ error, eventId }: { error: Error; eventId: string | null }) => {
  const [isExpanded, setExpanded] = useState(false)

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
            <CodeTitle>
              <ThemedText.SubHeader fontWeight={500}>Error ID: {eventId}</ThemedText.SubHeader>
              <CopyToClipboard toCopy="4325">
                <CopyIcon />
              </CopyToClipboard>
            </CodeTitle>
            <Separator />
            {isExpanded && (
              <>
                <Code>{error.stack}</Code>
                <Separator />
              </>
            )}
            <ShowMoreButton onClick={() => setExpanded((s) => !s)}>
              <ThemedText.Link color="textSecondary">
                <Trans>{isExpanded ? 'Show less' : 'Show more'}</Trans>
              </ThemedText.Link>
              <ShowMoreIcon $isExpanded={isExpanded} secondaryWidth="20" secondaryHeight="20" />
            </ShowMoreButton>
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
      fallback={({ error, eventId }) => <Fallback error={error} eventId={eventId} />}
      beforeCapture={(scope) => {
        scope.setLevel('fatal')
      }}
      onError={updateServiceWorkerInBackground}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
