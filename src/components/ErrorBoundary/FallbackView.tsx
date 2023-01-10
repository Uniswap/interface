import { Trans, t } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import UAParser from 'ua-parser-js'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { ExternalLink } from 'theme'

const parser = new UAParser(window.navigator.userAgent)
const userAgent = parser.getResult()

const predefinedErrors = [
  {
    name: 'LocalStorageAccessDenied',
    match: (e: Error) => {
      return e.message.match(/localStorage.*Access is denied/)
    },
    title: t`Permission needed`,
    description: t`We need access to your local storage. The reason can be that you may have accidentally blocked cookies from this site. Please find it in your settings and turn it off.`,
  },
]

const FallbackWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
`

const BodyWrapper = styled.div`
  width: 100%;
  margin: auto;
  padding: 18px 24px;
  padding-top: 48px;
`

const CodeBlockWrapper = styled.div`
  overflow: auto;
  white-space: pre;
`

const LinkWrapper = styled.div`
  margin: auto;
`

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

type Props = {
  error: Error
}
const FallbackView: React.FC<Props> = ({ error }) => {
  const encodedBody = encodeURIComponent(issueBody(error))
  const foundError = predefinedErrors.find(err => err.match(error))

  return (
    <FallbackWrapper>
      <BodyWrapper>
        <AutoColumn gap={'lg'} justify="center">
          <Text textAlign="center" fontSize="24px" maxWidth={'600px'}>
            <Trans>{foundError?.title || 'Oops! Something went wrong'}</Trans>
          </Text>

          {foundError?.description ? (
            <Text textAlign="center" fontSize="16px" maxWidth={'600px'} marginTop="16px">
              <Trans>{foundError.description}</Trans>
            </Text>
          ) : (
            <>
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
            </>
          )}

          <ButtonPrimary
            margin="auto"
            width="fit-content"
            onClick={() => {
              try {
                localStorage.clear()
              } catch (e) {
                // empty
              }
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

export default FallbackView
