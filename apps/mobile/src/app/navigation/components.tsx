import { BackButton } from 'src/components/buttons/BackButton'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export const renderHeaderBackButton = (): JSX.Element => <BackButton color="$neutral2" size={iconSizes.icon28} />

export const renderHeaderBackImage = (): JSX.Element => (
  <RotatableChevron color="$neutral2" height={iconSizes.icon28} width={iconSizes.icon28} />
)
