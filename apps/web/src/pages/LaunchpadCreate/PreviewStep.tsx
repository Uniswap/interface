import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { useAtomValue } from 'jotai/utils'
import LaunchpadView from 'pages/LaunchpadPage/LaunchpadView'
import styled from 'styled-components'
import { launchpadParams } from './launchpad-state'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 960px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 800px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`

export default function PreviewStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const options = useAtomValue(launchpadParams)
  return (
    <PageWrapper>
      <LaunchpadView
        options={options}
        participants={0}
        totalRaisedAsQuote={0}
        status="Pending"
        userTokens={0}
        userActionComponent={() => <div />}
      />
      <Row gap="20px" marginTop="20px">
        <ButtonOutlined onClick={onBack}>Back</ButtonOutlined>
        <ButtonPrimary onClick={onNext}>Next</ButtonPrimary>
      </Row>
    </PageWrapper>
  )
}
