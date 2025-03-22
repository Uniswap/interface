import styled from 'lib/styled-components'
import { AlertTriangle } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'

const ExplainerText = styled.div`
  color: ${({ theme }) => theme.neutral2};
`
const TitleRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  color: ${({ theme }) => theme.deprecated_accentWarning};
  margin-bottom: 8px;
`
const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.deprecated_accentWarningSoft};
  border-radius: 16px;
  margin-top: 12px;
  max-width: 480px;
  padding: 12px 20px;
  width: 100%;
`

interface OwnershipWarningProps {
  ownerAddress?: string
}

const OwnershipWarning = ({ ownerAddress }: OwnershipWarningProps) => (
  <Wrapper>
    <TitleRow>
      <AlertTriangle style={{ marginRight: '8px' }} />
      <ThemedText.SubHeader color="deprecated_accentWarning">
        <Trans i18nKey="common.warning" />
      </ThemedText.SubHeader>
    </TitleRow>
    <ExplainerText>
      <Trans i18nKey="pool.liquidity.ownershipWarning.message" values={{ ownerAddress }} />
    </ExplainerText>
  </Wrapper>
)

export default OwnershipWarning
