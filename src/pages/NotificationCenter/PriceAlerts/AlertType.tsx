import { t } from '@lingui/macro'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { PriceAlertType } from 'pages/NotificationCenter/const'

type Props = {
  type: PriceAlertType
}

const labelByType: Record<PriceAlertType, string> = {
  [PriceAlertType.ABOVE]: t`above`,
  [PriceAlertType.BELOW]: t`below`,
}

const AlertType: React.FC<Props> = ({ type }) => {
  const theme = useTheme()

  return (
    <Text
      as="span"
      sx={{
        color: type === PriceAlertType.ABOVE ? theme.primary : theme.red,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      {type === PriceAlertType.ABOVE ? <ArrowUp size={18} /> : <ArrowDown size={18} />} {labelByType[type]}
    </Text>
  )
}

export default AlertType
