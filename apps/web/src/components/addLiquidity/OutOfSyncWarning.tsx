import Column from 'components/Column'
import Row from 'components/Row'
import { SupportArticleURL } from 'constants/supportArticles'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { ExternalLink } from 'theme/components'
import { Text } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'

const Container = styled.div`
  height: 100%;
  width: 100%;
  max-width: 550px;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  background: ${({ theme }) => theme.surface2};
`
const StyledColumn = styled(Column)`
  height: 100%;
`
const IconContainer = styled.div`
  height: 40px;
  width: 40px;
  padding: 10px;
  border-radius: 12px;
  background: ${({ theme }) => theme.critical2};
`
export function OutOfSyncWarning() {
  return (
    <Container>
      <Row gap="md" height="100%">
        <StyledColumn>
          <IconContainer>
            <AlertTriangle color="$statusCritical" size="$icon.20" />
          </IconContainer>
        </StyledColumn>
        <StyledColumn gap="xs">
          <Text variant="body3" color="$neutral1">
            <Trans>Pool out of sync</Trans>
          </Text>
          <Text variant="body3" color="$neutral2">
            <Trans>
              This pool is out of sync with market prices. Adding liquidity at the suggested ratios may result in loss
              of funds.
            </Trans>
          </Text>
          <ExternalLink href={SupportArticleURL.IMPERMANENT_LOSS}>
            <Text variant="buttonLabel4" color="$neutral1">
              <Trans>Learn more</Trans>
            </Text>
          </ExternalLink>
        </StyledColumn>
      </Row>
    </Container>
  )
}
