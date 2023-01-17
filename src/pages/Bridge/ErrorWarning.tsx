import { rgba } from 'polished'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { CollapseItem } from 'components/Collapse'
import useTheme from 'hooks/useTheme'

const style = {
  gap: 8,
  borderRadius: 16,
  padding: '14px 18px',
}
const ErrorWarningPanel = ({ title, type, desc }: { title: ReactNode; type: 'error' | 'warn'; desc?: ReactNode }) => {
  const theme = useTheme()
  const color = type === 'error' ? theme.red : theme.warning
  if (!desc)
    return (
      <Flex color={color} alignItems="center" style={{ background: rgba(color, 0.25), ...style }}>
        <div>
          <AlertTriangle size={16} />
        </div>
        <Text fontWeight={400} fontSize={12} color={theme.text}>
          {title}
        </Text>
      </Flex>
    )
  return (
    <CollapseItem
      arrowComponent={<DropdownSVG />}
      style={{ background: rgba(color, 0.25), ...style }}
      header={
        <Flex color={color} alignItems="center" style={{ gap: 8 }}>
          <div>
            <AlertTriangle size={15} />
          </div>
          <Text fontWeight={500} fontSize={12}>
            {title}
          </Text>
        </Flex>
      }
    >
      {desc && <div style={{ marginLeft: 22 }}>{desc}</div>}
    </CollapseItem>
  )
}
export default ErrorWarningPanel
