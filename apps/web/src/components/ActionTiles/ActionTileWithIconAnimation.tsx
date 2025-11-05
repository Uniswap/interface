import { ActionTile, ActionTileProps } from 'components/AccountDrawer/ActionTile'
import { Wiggle } from 'components/animations/Wiggle'
import { Flex, GeneratedIcon } from 'ui/src'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type ActionTileWithIconAnimationProps = Omit<ActionTileProps, 'Icon'> & {
  Icon: GeneratedIcon
}

export function ActionTileWithIconAnimation({
  dataTestId,
  Icon,
  name,
  onClick,
  disabled,
  padding,
}: ActionTileWithIconAnimationProps) {
  const { value: isHovered, setTrue: setIsHovered, setFalse: setIsHoveredFalse } = useBooleanState(false)

  return (
    <Flex onHoverIn={setIsHovered} onHoverOut={setIsHoveredFalse}>
      <ActionTile
        dataTestId={dataTestId}
        Icon={
          <Wiggle
            isAnimating={isHovered}
            width="max-content"
            display="flex"
            alignItems="center"
            justifyContent="center"
            wiggleAmount={10}
          >
            <Icon size="$icon.24" color="$accent1" />
          </Wiggle>
        }
        name={name}
        onClick={onClick}
        disabled={disabled}
        padding={padding}
      />
    </Flex>
  )
}
