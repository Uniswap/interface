import { ReactNode } from 'react'
import { Flex } from 'rebass'

import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import { ButtonEmpty } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'

const defaultIcons: { [mode in VIEW_MODE]: ReactNode } = {
  [VIEW_MODE.LIST]: <ListViewIcon />,
  [VIEW_MODE.GRID]: <GridViewIcon />,
}

export default function ListGridViewGroup({ customIcons }: { customIcons?: { [mode in VIEW_MODE]?: ReactNode } }) {
  const [viewMode, setViewMode] = useViewMode()
  const theme = useTheme()

  return (
    <Flex sx={{ gap: '0.5rem' }}>
      {[VIEW_MODE.LIST, VIEW_MODE.GRID].map(mode => (
        <ButtonEmpty
          padding="0"
          style={{ color: viewMode === mode ? theme.primary : theme.subText }}
          onClick={() => setViewMode(mode)}
          key={mode}
        >
          {customIcons?.[mode] || defaultIcons[mode]}
        </ButtonEmpty>
      ))}
    </Flex>
  )
}
