import Column from 'components/Column'
import { MissingDataIcon } from 'components/Table/icons'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const ErrorModalContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 320px;
  padding: 12px;
  gap: 12px;

  background-color: ${({ theme }) => theme.surface5};
  backdrop-filter: blur(24px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  border: 1px ${({ theme }) => theme.surface3} solid;
  border-radius: 20px;
`

export const ErrorModal = ({ header, subtitle }: { header: React.ReactNode; subtitle: React.ReactNode }) => (
  <ErrorModalContainer data-testid="table-error-modal">
    <div>
      <MissingDataIcon />
    </div>
    <Column>
      <ThemedText.SubHeader>{header}</ThemedText.SubHeader>
      <ThemedText.LabelSmall>{subtitle}</ThemedText.LabelSmall>
    </Column>
  </ErrorModalContainer>
)
