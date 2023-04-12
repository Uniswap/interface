import { useState } from 'react'

import ArrowRotate from 'components/ArrowRotate'
import useTheme from 'hooks/useTheme'

type Props = {
  onClick: () => void
}
const ReverseTokenSelectionButton: React.FC<Props> = ({ onClick }) => {
  const [rotated, setRotated] = useState(false)
  const theme = useTheme()

  const handleClick = () => {
    onClick()
    setRotated(r => !r)
  }

  return (
    <ArrowRotate
      rotate={rotated}
      onClick={handleClick}
      style={{ width: 25, height: 25, padding: 4, background: theme.buttonGray }}
    />
  )
}

export default ReverseTokenSelectionButton
