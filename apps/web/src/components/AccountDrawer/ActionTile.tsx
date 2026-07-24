import { ReactNode } from 'react'
import { Flex, FlexProps, styled, Text } from 'ui/src'

const Tile = styled(Flex, {
  gap: '$gap12',
  userSelect: 'none',
  height: '100%',
  flex: 1,
  display: 'flex',
  justifyContent: 'flex-start',
  p: '$padding12',
  backgroundColor: '$accent2',
  overflow: 'hidden',

  borderColor: 'transparent',
  borderRadius: '$rounded16',
  borderStyle: 'solid',
  borderWidth: '1px',
  animation: 'fast',

  hoverStyle: {
    backgroundColor: '$accent2Hovered',
    cursor: 'pointer',
  },
  disabledStyle: {
    cursor: 'default',
    opacity: 0.6,
  },
})

export type ActionTileProps = {
  dataTestId: string
  Icon: ReactNode
  name: string
  onClick: () => void
  disabled?: boolean
  padding?: FlexProps['p']
}

export function ActionTile({ dataTestId, Icon, name, onClick, disabled, padding = '$spacing12' }: ActionTileProps) {
  return (
    <Tile data-testid={dataTestId} onPress={onClick} disabled={disabled} p={padding}>
      {Icon}
      <Text variant="buttonLabel2" color="$accent1">
        {name}
      </Text>
    </Tile>
  )
}
