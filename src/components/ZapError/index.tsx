import { rgba } from 'polished'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const ZapErrorWrapper = styled.div<{ warning?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme, warning }) => rgba(warning ? theme.warning : theme.red, 0.35)};
  padding: 1rem;
  border-radius: 999px;
  margin-bottom: 28px;
  color: ${({ theme }) => theme.text};
  font-size: 12px;
  font-weight: 400;
`

const ZapError = ({ message, warning }: { message?: string; warning?: boolean }) => {
  const theme = useTheme()

  return (
    <ZapErrorWrapper warning={warning}>
      <AlertTriangle color={warning ? theme.warning : theme.red} style={{ strokeWidth: 1.5 }} size={16} />
      {message}
    </ZapErrorWrapper>
  )
}

export default ZapError
