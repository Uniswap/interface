import { Flex } from 'rebass'

import { ReactComponent as GridViewIcon } from 'assets/svg/grid_view.svg'
import { ReactComponent as ListViewIcon } from 'assets/svg/list_view.svg'
import { ButtonEmpty } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'

export default function ListGridViewGroup() {
  const [viewMode, setViewMode] = useViewMode()
  const theme = useTheme()

  return (
    <Flex sx={{ gap: '0.5rem' }}>
      <ButtonEmpty
        padding="0"
        style={{ color: viewMode === VIEW_MODE.GRID ? theme.subText : theme.primary }}
        onClick={() => setViewMode(VIEW_MODE.LIST)}
      >
        <ListViewIcon />
      </ButtonEmpty>
      <ButtonEmpty
        padding="0"
        style={{ color: viewMode === VIEW_MODE.LIST ? theme.subText : theme.primary }}
        onClick={() => setViewMode(VIEW_MODE.GRID)}
      >
        <GridViewIcon />
      </ButtonEmpty>
    </Flex>
  )
}
