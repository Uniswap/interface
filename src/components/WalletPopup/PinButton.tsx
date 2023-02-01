import { Flex } from 'rebass'

import { ReactComponent as PinIcon } from 'assets/svg/pin_icon.svg'
import { ReactComponent as PinSolidIcon } from 'assets/svg/pin_solid_icon.svg'
import useTheme from 'hooks/useTheme'

type Props = {
  isActive: boolean
  onClick: () => void
}
const PinButton: React.FC<Props> = ({ isActive, onClick }) => {
  const theme = useTheme()

  return (
    <Flex
      sx={{
        width: '16px',
        height: '16px',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      role="button"
      onClick={onClick}
    >
      {isActive ? <PinSolidIcon color={theme.text} /> : <PinIcon color={theme.subText} />}
    </Flex>
  )
}

export default PinButton
