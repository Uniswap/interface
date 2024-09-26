import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled, { useTheme } from 'lib/styled-components'
import { ReactNode } from 'react'
import { ArrowRight } from 'react-feather'
import { ClickableStyle, ThemedText } from 'theme/components'
import { Text } from 'ui/src'

const Container = styled.button`
  border-radius: 16px;
  border: none;
  background: ${({ theme }) => theme.surface2};
  padding: 12px 16px;
  margin-top: 12px;
  ${ClickableStyle}
`

interface TabButtonProps {
  text: ReactNode
  icon: ReactNode
  extraWarning?: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function TabButton({ text, icon, extraWarning, onClick, disabled, className }: TabButtonProps) {
  const theme = useTheme()

  return (
    <Container onClick={onClick} disabled={disabled} className={className}>
      <Row justify="space-between" align="center">
        <Row gap="md">
          {icon}
          <Column>
            <Text variant="buttonLabel3" color="$neutral2" lineHeight={20} fontWeight="$medium">
              {text}
            </Text>
            {extraWarning && <ThemedText.LabelMicro>{extraWarning}</ThemedText.LabelMicro>}
          </Column>
        </Row>
        <ArrowRight color={theme.neutral2} size="20px" />
      </Row>
    </Container>
  )
}
