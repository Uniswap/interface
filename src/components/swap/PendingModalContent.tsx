import { ColumnCenter } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import { ReactNode } from 'react'

interface PendingModalContentProps {
  title: ReactNode
  subtitle: ReactNode
  label: ReactNode
  tooltipText?: ReactNode
  logo: ReactNode
}

export function PendingModalContent({ title, subtitle, label, tooltipText, logo }: PendingModalContentProps) {
  return (
    <ColumnCenter gap="sm">
      <div>{logo}</div>
      <div>{title}</div>
      <div>{subtitle}</div>
      <Row gap="xs" justify="center">
        {label}
        <QuestionHelper text={tooltipText} />
      </Row>
    </ColumnCenter>
  )
}
