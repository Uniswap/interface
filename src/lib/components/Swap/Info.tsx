import { Info, Minus, Plus } from 'react-feather'

import { inlaidIcon, ThemedButton } from '../../themed/components'
import { useShowDetails } from './state/hooks'

const InfoPlus = inlaidIcon(Info, Plus)
const InfoMinus = inlaidIcon(Info, Minus)

export default function ShowDetails() {
  const [showDetails, toggleShowDetails] = useShowDetails()
  return <ThemedButton onClick={toggleShowDetails}>{showDetails ? <InfoMinus /> : <InfoPlus />}</ThemedButton>
}
