import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { LaunchpadLogo } from '~/pages/Launches/LaunchpadLogo'

// Shared by every table that renders a Launchpad column so they stay visually in sync.
// `CellContainer` is `grow: true`, so `size` only caps the column once `meta.flexGrow` is 0.
export const LAUNCHPAD_COLUMN_WIDTH = 112
export const LAUNCHPAD_COLUMN_META = { flexGrow: 0 } as const

/** Launchpad identity cell content (registry logo + name), shared by the launch and live-auction tables. */
export function LaunchpadCellContent({
  label,
  logoUrl,
  logoLoading = false,
}: {
  label?: string
  logoUrl?: string
  /** While true, the logo renders as a skeleton — avoids flashing the color fallback and then swapping once the registry resolves. */
  logoLoading?: boolean
}): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$gap8" flexShrink={1} minWidth={0}>
      <LaunchpadLogo size={iconSizes.icon16} url={logoUrl} name={label} loading={logoLoading} />
      <EllipsisText flexShrink={1} minWidth={0}>
        {label}
      </EllipsisText>
    </Flex>
  )
}
