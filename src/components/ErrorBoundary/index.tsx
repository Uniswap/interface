import React, { ErrorInfo } from 'react'
import { ExternalLink, ThemedBackground, TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import ReactGA from 'react-ga'
import { getUserAgent } from '../../utils/getUserAgent'

const FallbackWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  z-index: 1;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  position: relative;
  margin-top: 1rem;
  max-width: 60%;
  width: 100%;
`

const CodeBlockWrapper = styled.div`
  background: ${({ theme }) => theme.bg0};
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
          <ThemedBackground />
          <BodyWrapper>
            <AutoColumn gap={'md'}>
              <SomethingWentWrongWrapper>
                <TYPE.label fontSize={24} fontWeight={600}>
                  Something went wrong
                </TYPE.label>
              </SomethingWentWrongWrapper>
              <CodeBlockWrapper>
                <code>
                  <TYPE.main fontSize={10}>{error.stack}</TYPE.main>
                </code>
              </CodeBlockWrapper>
              <LinkWrapper>
                <ExternalLink
                  id={`create-github-issue-link`}
                  href={`https://github.com/Uniswap/uniswap-interface/issues/new?assignees=&labels=bug&body=${encodedBody}&title=Crash report`}
                  target="_blank"
                >
                  <TYPE.link fontSize={16}>
                    Create an issue on GitHub
                    <span>↗</span>
                  </TYPE.link>
                </ExternalLink>
              </LinkWrapper>
            </AutoColumn>
          </BodyWrapper>
        </FallbackWrapper>
      )
    }
    return this.props.children
  }
}

function issueBody(error: Error): string {
  if (!error) throw new Error('no error to report')
  const deviceData = getUserAgent()
  return `**Bug Description**
  
App crashed

**Steps to Reproduce**

1. Go to ...
2. Click on ...
   ...
   
${
  error.name &&
  `**Error**

\`\`\`
${error.name}${error.message && `: ${error.message}`}
\`\`\`
`
}
${
  error.stack &&
  `**Stacktrace**

\`\`\`
${error.stack}
\`\`\`
`
}
${
  deviceData &&
  `**Device data**

\`\`\`json5
${JSON.stringify(deviceData, null, 2)}
\`\`\`
`
}
`
}
