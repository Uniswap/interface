import { Trans } from '@lingui/macro'
import React, { ErrorInfo } from 'react'
import ReactGA from 'react-ga'
import styled from 'styled-components/macro'

import store, { AppState } from '../../state'
import { ExternalLink, TYPE } from '../../theme'
import { userAgent } from '../../utils/userAgent'
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
  white-space: ;
`

const CodeBlockWrapper = styled.div`
  background: ${({ theme }) => theme.bg0};
  overflow: auto;
  white-space: pre;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 24px;
  padding: 18px 24px;
  color: ${({ theme }) => theme.text1};
`

const LinkWrapper = styled.div`
  color: ${({ theme }) => theme.blue1};
  padding: 6px 24px;
`

const SomethingWentWrongWrapper = styled.div`
  padding: 6px 24px;
`

type ErrorBoundaryState = {
  error: Error | null
}

const IS_UNISWAP = window.location.hostname === 'app.uniswap.org'

export default class ErrorBoundary extends React.Component<unknown, ErrorBoundaryState> {
  constructor(props: unknown) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ReactGA.exception({
      ...error,
      ...errorInfo,
      fatal: true,
    })
  }

  render() {
    const { error } = this.state

    if (error !== null) {
      const encodedBody = encodeURIComponent(issueBody(error))
      return (
        <FallbackWrapper>
          <BodyWrapper>
            <AutoColumn gap={'md'}>
              <SomethingWentWrongWrapper>
                <TYPE.label fontSize={24} fontWeight={600}>
                  <Trans>Something went wrong</Trans>
                </TYPE.label>
              </SomethingWentWrongWrapper>
              <CodeBlockWrapper>
                <code>
                  <TYPE.main fontSize={10}>{error.stack}</TYPE.main>
                </code>
              </CodeBlockWrapper>
              {IS_UNISWAP ? (
                <AutoRow>
                  <LinkWrapper>
                    <ExternalLink
                      id="create-github-issue-link"
                      href={`https://github.com/Uniswap/uniswap-interface/issues/new?assignees=&labels=bug&body=${encodedBody}&title=${encodeURIComponent(
                        `Crash report: \`${error.name}${error.message && `: ${error.message}`}\``
                      )}`}
                      target="_blank"
                    >
                      <TYPE.link fontSize={16}>
                        <Trans>Create an issue on GitHub</Trans>
                        <span>↗</span>
                      </TYPE.link>
                    </ExternalLink>
                  </LinkWrapper>
                  <LinkWrapper>
                    <ExternalLink id="get-support-on-discord" href="https://discord.gg/FCfyBSbCU5" target="_blank">
                      <TYPE.link fontSize={16}>
                        <Trans>Get support on Discord</Trans>
                        <span>↗</span>
                      </TYPE.link>
                    </ExternalLink>
                  </LinkWrapper>
                </AutoRow>
              ) : null}
            </AutoColumn>
          </BodyWrapper>
        </FallbackWrapper>
      )
    }
    return this.props.children
  }
}

function getRelevantState(): null | keyof AppState {
  const path = window.location.hash
  if (!path.startsWith('#/')) {
    return null
  }
  const pieces = path.substring(2).split(/[\/\\?]/)
  switch (pieces[0]) {
    case 'swap':
      return 'swap'
    case 'add':
      if (pieces[1] === 'v2') return 'mint'
      else return 'mintV3'
    case 'remove':
      if (pieces[1] === 'v2') return 'burn'
      else return 'burnV3'
  }
  return null
}

function issueBody(error: Error): string {
  const relevantState = getRelevantState()
  const deviceData = userAgent
  return `## URL
  
${window.location.href}

${
  relevantState
    ? `## \`${relevantState}\` state
    
\`\`\`json
${JSON.stringify(store.getState()[relevantState], null, 2)}
\`\`\`
`
    : ''
}
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
