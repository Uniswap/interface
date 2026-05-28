import { ActionTileProps } from 'components/AccountDrawer/ActionTile'
import { Flex, GeneratedIcon, styled, Text } from 'ui/src'

type ActionTileWithIconAnimationProps = Omit<ActionTileProps, 'Icon'> & {
  Icon: GeneratedIcon
  value?: string | number
}

const Tile = styled(Flex, {
  gap: '$gap12',
  userSelect: 'none',
  height: '100%',
  minHeight: '100%',
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-start',
  p: '$padding16',
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

export function ActionTileWithIconAnimation({ Icon, name, value }: ActionTileWithIconAnimationProps) {
  return (
    <Tile>
      <Flex row justifyContent="space-between" width="100%" alignItems="center">
        <Icon color="$accent1" size="$icon.36" />
        <Text color="$accent1">{name}</Text>
      </Flex>
      <Flex grow justifyContent="flex-end">
        <Text textAlign="right" variant="heading3">
          {value}
        </Text>
      </Flex>
    </Tile>
  )
}
