import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { useWeb3React } from '@web3-react/core'
import { ButtonLight, SmallButtonPrimary } from 'components/Button'
import { ChevronUpIcon } from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import React, { PropsWithChildren, useState } from 'react'
import { Copy } from 'react-feather'
import styled from 'styled-components/macro'
import { isSentryEnabled } from 'utils/env'

import { CopyToClipboard, ExternalLink, ThemedText } from '../../theme'
import { Column } from '../Column'

const FallbackWrapper = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  width: 100%;
  max-width: 500px;
  margin: auto;
  padding: 1rem;
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
  font-family: ${({ theme }) => theme.fonts.code};
  overflow: scroll;
  max-height: calc(100vh - 450px);
`

const Separator = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const CodeBlockWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.backgroundModule};
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
  justify-content: space-between;
  word-break: break-word;
`

const Fallback = ({ error, eventId }: { error: Error; eventId: string | null }) => {
  const [isExpanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()

  // @todo: ThemedText components should be responsive by default
  const [Title, Description] = isMobile
    ? [ThemedText.HeadlineSmall, ThemedText.BodySmall]
    : [ThemedText.HeadlineLarge, ThemedText.BodySecondary]

  const showErrorId = isSentryEnabled() && eventId

  const showMoreButton = (
    <ShowMoreButton onClick={() => setExpanded((s) => !s)}>
      <ThemedText.Link color="textSecondary">
        <Trans>{isExpanded ? 'Show less' : 'Show more'}</Trans>
      </ThemedText.Link>
      <ShowMoreIcon $isExpanded={isExpanded} secondaryWidth="20" secondaryHeight="20" />
    </ShowMoreButton>
  )

  const errorDetails = error.stack || error.message

  return (
    <FallbackWrapper>
      <BodyWrapper>
        <Column gap="xl">
          {showErrorId ? (
            <>
              <Column gap="sm">
                <Title textAlign="center">
                  <Trans>Something went wrong</Trans>
                </Title>
                <Description textAlign="center" color="textSecondary">
                  <Trans>
                    Sorry, an error occured while processing your request. If you request support, be sure to provide
                    your error ID.
                  </Trans>
                </Description>
              </Column>
              <CodeBlockWrapper>
                <CodeTitle>
                  <ThemedText.SubHeader fontWeight={500}>
                    <Trans>Error ID: {eventId}</Trans>
                  </ThemedText.SubHeader>
                  <CopyToClipboard toCopy={eventId}>
                    <CopyIcon />
                  </CopyToClipboard>
                </CodeTitle>
                <Separator />
                {isExpanded && (
                  <>
                    <Code>{errorDetails}</Code>
                    <Separator />
                  </>
                )}
                {showMoreButton}
              </CodeBlockWrapper>
            </>
          ) : (
            <>
              <Column gap="sm">
                <Title textAlign="center">
                  <Trans>Something went wrong</Trans>
                </Title>
                <Description textAlign="center" color="textSecondary">
                  <Trans>
                    Sorry, an error occured while processing your request. If you request support, be sure to copy the
                    details of this error.
                  </Trans>
                </Description>
              </Column>
              <CodeBlockWrapper>
                <CodeTitle>
                  <ThemedText.SubHeader fontWeight={500}>Error details</ThemedText.SubHeader>
                  <CopyToClipboard toCopy={errorDetails}>
                    <CopyIcon />
                  </CopyToClipboard>
                </CodeTitle>
                <Separator />
                <Code>{errorDetails.split('\n').slice(0, isExpanded ? undefined : 4)}</Code>
                <Separator />
                {showMoreButton}
              </CodeBlockWrapper>
            </>
          )}
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
        </Column>
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
  const { chainId } = useWeb3React()
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, eventId }) => <Fallback error={error} eventId={eventId} />}
      beforeCapture={(scope) => {
        scope.setLevel('fatal')
        scope.setTag('chain_id', chainId)
      }}
      onError={() => {
        updateServiceWorkerInBackground()
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
