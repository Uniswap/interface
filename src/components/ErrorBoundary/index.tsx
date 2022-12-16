import { Trans } from '@lingui/macro'
import { captureException } from '@sentry/react'
import React, { ErrorInfo, PropsWithChildren } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { UAParser } from 'ua-parser-js'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { ExternalLink } from 'theme'

const parser = new UAParser(window.navigator.userAgent)

const userAgent = parser.getResult()

const FallbackWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  padding: 1rem;
  margin: auto;
  padding: 18px 24px;
`

const CodeBlockWrapper = styled.div`
  overflow: auto;
  white-space: pre;
`

const LinkWrapper = styled.div`
  margin: auto;
`

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.name === 'ChunkLoadError') return window.location.reload()
    const e = new Error(`[${error.name}] ${error.message}`, {
      cause: error,
    })
    e.name = 'AppCrash'
    captureException(e, { level: 'fatal' })
  }

  render() {
    const { error } = this.state

    if (error !== null) {
      const encodedBody = encodeURIComponent(issueBody(error))

      return (
        <FallbackWrapper>
          <BodyWrapper>
            <AutoColumn gap={'md'}>
              <Text textAlign="center">
                <Trans>Oops! Something went wrong</Trans>
              </Text>
              <CodeBlockWrapper>
                <code>
                  <Text fontSize={10}>{error.stack}</Text>
                </code>
              </CodeBlockWrapper>
              <AutoRow>
                <LinkWrapper>
                  <ExternalLink
                    id="create-github-issue-link"
                    href={`https://github.com/KyberNetwork/kyberswap-interface/issues/new?assignees=&labels=bug&body=${encodedBody}&title=${encodeURIComponent(
                      `Crash report: \`${error.name}${error.message && `: ${error.message}`}\``,
                    )}`}
                    target="_blank"
                  >
                    <Text fontSize={16}>
                      <Trans>Create an issue on GitHub</Trans>
                      <span>↗</span>
                    </Text>
                  </ExternalLink>
                </LinkWrapper>
              </AutoRow>

              <ButtonPrimary
                margin="auto"
                width="fit-content"
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
              >
                Refresh
              </ButtonPrimary>
            </AutoColumn>
          </BodyWrapper>
        </FallbackWrapper>
      )
    }
    return this.props.children
  }
}

function issueBody(error: Error): string {
  const deviceData = userAgent
  return `## URL

${window.location.href}

${
  error.name &&
  `## Error

\`\`\`
${error.name}${error.message && `: ${error.message}`}
\`\`\`
`
}
${
  error.stack &&
  `## Stacktrace

\`\`\`
${error.stack}
\`\`\`
`
}
${
  deviceData &&
  `## Device data

\`\`\`json
${JSON.stringify(deviceData, null, 2)}
\`\`\`
`
}
`
}
