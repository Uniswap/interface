import { inlaidIcon, StyledButton } from 'lib/styled/components'
import { Info, Minus, Plus } from 'react-feather'

import { useShowDetails } from './state/hooks'

const InfoPlus = inlaidIcon(Info, Plus)
const InfoMinus = inlaidIcon(Info, Minus)

export default function ShowDetails() {
  const [showDetails, toggleShowDetails] = useShowDetails()
  return <StyledButton onClick={toggleShowDetails}>{showDetails ? <InfoMinus /> : <InfoPlus />}</StyledButton>
}
