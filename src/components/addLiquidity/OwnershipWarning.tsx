import { Trans } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const ExplainerText = styled.div`
  color: ${({ theme }) => theme.textSecondary};
`
const TitleRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  color: ${({ theme }) => theme.accentWarning};
  margin-bottom: 8px;
`
const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.accentWarningSoft};
  border-radius: 16px;
  margin-top: 12px;
  max-width: 480px;
  padding: 12px 20px;
  width: 100%;
`

interface OwnershipWarningProps {
  ownerAddress: string
}

const OwnershipWarning = ({ ownerAddress }: OwnershipWarningProps) => (
  <Wrapper>
    <TitleRow>
      <AlertTriangle style={{ marginRight: '8px' }} />
      <ThemedText.SubHeader color="accentWarning">
        <Trans>Warning</Trans>
      </ThemedText.SubHeader>
    </TitleRow>
    <ExplainerText>
      <Trans>
        You are not the owner of this LP position. You will not be able to withdraw the liquidity from this position
        unless you own the following address: {ownerAddress}
      </Trans>
    </ExplainerText>
  </Wrapper>
)

export default OwnershipWarning
