import { useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled, { useTheme } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'

type SeverityLevel = 'warning' | 'serious'

const DropdownIcon = styled(DropdownSVG)`
  width: 24px;
  height: 24px;
  transition: transform 300ms;
  color: ${({ theme }) => theme.text};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

const Wrapper = styled.div<{ $level: SeverityLevel }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 20px;
  background: ${({ $level, theme }) => ($level === 'serious' ? `${theme.red}4d` : `${theme.warning}4d`)};
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  padding: 12px 16px;
`

type Props = {
  level?: 'warning' | 'serious'
  shortText: React.ReactNode
  longText?: React.ReactNode
  className?: string
}
const WarningNote: React.FC<Props> = ({ className, level = 'warning', shortText, longText = '' }) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)

  const isClickable = !!longText

  return (
    <Wrapper className={className} $level={level}>
      <Flex
        sx={{
          alignItems: 'center',
          gap: '8px',
          cursor: isClickable ? 'pointer' : undefined,
          transition: 'all 150ms linear',
        }}
        onClick={() => {
          if (isClickable) {
            setExpanded(e => !e)
          }
        }}
      >
        <Flex width="16px" height="16px" flex="0 0 16px">
          <AlertTriangle size={16} color={level === 'serious' ? theme.red : theme.warning} />
        </Flex>
        <Flex
          flexDirection="column"
          flex="1 1 0"
          color={theme.text}
          sx={{
            gap: '8px',
          }}
        >
          {shortText}
        </Flex>

        {isClickable && (
          <Flex flex="0 0 24px" width="24px" height="16px" justifyContent="center" alignItems="center">
            <Box width="24px" height="24px">
              <DropdownIcon data-flip={expanded} />
            </Box>
          </Flex>
        )}
      </Flex>
      {expanded && longText}
    </Wrapper>
  )
}

export default WarningNote
