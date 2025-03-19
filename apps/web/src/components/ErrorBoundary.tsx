import { ErrorBoundary as DatadogErrorBoundary } from '@datadog/browser-rum-react'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled from 'lib/styled-components'
import { PropsWithChildren, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyToClipboard, ExternalLink, ThemedText } from 'theme/components'
import { Button, Flex, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const Code = styled.code`
  font-weight: 485;
  font-size: 12px;
  line-height: 16px;
  word-sentry.wrap: break-word;
  width: 100%;
  color: ${({ theme }) => theme.neutral1};
  font-family: ${({ theme }) => theme.fonts.code};
  overflow: scroll;
  max-height: calc(100vh - 450px);
`

const Separator = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`

const Fallback = ({ error, eventId }: { error: Error; eventId: string | null }) => {
  const { t } = useTranslation()

  const errorDetails = error.stack || error.message

  return (
    <Flex width="100vw" height="100vh">
      <Flex width="100%" p="$spacing1" maxWidth={500} centered m="auto">
        <Flex gap="$gap24">
          <ErrorDetailsSection errorDetails={errorDetails} eventId={eventId} />
          <Flex row gap="$gap12">
            <Button emphasis="primary" size="small" variant="branded" onPress={() => window.location.reload()}>
              {t('common.reload.label')}
            </Button>
            <ExternalLink
              style={{ flexGrow: 1, flexBasis: 0 }}
              id="get-support-on-discord"
              href={uniswapUrls.helpRequestUrl}
              target="_blank"
            >
              <Flex row>
                <Button
                  alignSelf="stretch"
                  emphasis="secondary"
                  size="small"
                  variant="branded"
                  onPress={() => window.location.reload()}
                >
                  {t('common.getSupport.button')}
                </Button>
              </Flex>
            </ExternalLink>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

function ErrorDetailsSection({ errorDetails, eventId }: { errorDetails: string; eventId: string | null }): JSX.Element {
  const { t } = useTranslation()
  const [isExpanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()

  // @todo: ThemedText components should be responsive by default
  const [Title, Description] = isMobile
    ? [ThemedText.HeadlineSmall, ThemedText.BodySmall]
    : [ThemedText.HeadlineLarge, ThemedText.BodySecondary]

  return (
    <>
      <Flex gap="$gap8">
        <Title textAlign="center">{t('common.card.error.description')}</Title>
        <Description textAlign="center" color="neutral2">
          {eventId ? t('error.request.provideId') : t('common.error.request')}
        </Description>
      </Flex>
      <Flex backgroundColor="$surface2" gap="$spacing8" p="$spacing24" borderRadius="$rounded24">
        <Flex row gap="$gap16" alignItems="center" justifyContent="space-between">
          <ThemedText.SubHeader>
            {eventId ? t('error.id', { eventId }) : t('common.error.details')}
          </ThemedText.SubHeader>
          <CopyToClipboard toCopy={eventId ?? errorDetails}>
            <CopyAlt color="$neutral2" size="$icon.24" />
          </CopyToClipboard>
        </Flex>
        <Separator />
        <Flex my="spacing12" gap="$spacing8">
          <Code>{errorDetails.split('\n').slice(0, isExpanded ? undefined : 4)}</Code>
          <Separator />
        </Flex>
        <TouchableArea flexDirection="row" justifyContent="space-between" onPress={() => setExpanded((s) => !s)}>
          <ThemedText.Link color="neutral2">
            {isExpanded ? t('common.showLess.button') : t('common.showMore.button')}
          </ThemedText.Link>
          <RotatableChevron width="$icon.20" height="$icon.20" direction={isExpanded ? 'up' : 'down'} />
        </TouchableArea>
      </Flex>
    </>
  )
}

export default function ErrorBoundary({ children }: PropsWithChildren): JSX.Element {
  return (
    <DatadogErrorBoundary fallback={({ error }) => <Fallback error={error} eventId={null} />}>
      {children}
    </DatadogErrorBoundary>
  )
}
