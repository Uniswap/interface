import Column from 'components/Column'
import Row from 'components/Row'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'

const Container = styled.div`
  height: 100%;
  width: 100%;
  max-width: 550px;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
`
const StyledColumn = styled(Column)`
  height: 100%;
`
const IconContainer = styled.div`
  height: 40px;
  width: 40px;
  padding: 10px;
  border-radius: 12px;
  background: ${({ theme }) => theme.surface3};
`
export function OutOfSyncWarning() {
  return (
    <Container>
      <Row gap="md" height="100%">
        <StyledColumn>
          <IconContainer>
            <AlertTriangle color="$neutral2" size={iconSizes.icon20} />
          </IconContainer>
        </StyledColumn>
        <StyledColumn>
          <Text variant="body3" color="$neutral2">
            <Trans>Pool out of sync</Trans>
          </Text>
          <Text variant="body2">
            <Trans>
              This pool is out of sync with market prices. Adding liquidity at the suggested ratios may result in loss
              of funds.
            </Trans>
          </Text>
        </StyledColumn>
      </Row>
    </Container>
  )
}
