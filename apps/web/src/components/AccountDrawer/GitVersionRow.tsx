import { MouseoverTooltip } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'

const Container = styled.div`
  width: 100%;
  cursor: pointer;
`

export function GitVersionRow() {
  const [isCopied, staticCopy] = useCopyClipboard()
  return process.env.REACT_APP_GIT_COMMIT_HASH ? (
    <Container
      onClick={() => {
        staticCopy(process.env.REACT_APP_GIT_COMMIT_HASH as string)
      }}
    >
      <MouseoverTooltip text="Copied" forceShow={isCopied} disabled>
        <ThemedText.BodySmall color="neutral3">
          <Trans i18nKey="account.drawer.gitVersion" />
          {' ' + process.env.REACT_APP_GIT_COMMIT_HASH.substring(0, 6)}
        </ThemedText.BodySmall>
      </MouseoverTooltip>
    </Container>
  ) : null
}
