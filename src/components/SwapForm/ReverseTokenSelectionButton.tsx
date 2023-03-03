import { useState } from 'react'

import ArrowRotate from 'components/ArrowRotate'

type Props = {
  onClick: () => void
}
const ReverseTokenSelectionButton: React.FC<Props> = ({ onClick }) => {
  const [rotated, setRotated] = useState(false)

  const handleClick = () => {
    onClick()
    setRotated(r => !r)
  }

  return <ArrowRotate rotate={rotated} onClick={handleClick} />
}

export default ReverseTokenSelectionButton
