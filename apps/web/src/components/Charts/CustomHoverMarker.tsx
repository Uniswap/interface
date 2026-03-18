import { Flex, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'

interface CustomHoverMarkerProps {
  coordinates: { x: number; y: number }
  lineColor: string
}

export function CustomHoverMarker({ coordinates, lineColor }: CustomHoverMarkerProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <Flex
      position="absolute"
      pointerEvents="none"
      style={{
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
      }}
    >
      {/* Halo - 16px diameter */}
      <Flex
        position="absolute"
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: opacify(20, lineColor),
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* Main marker - 10px diameter with 2px neutral1 border */}
      <Flex
        position="absolute"
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: lineColor,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: colors.surface1.val,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </Flex>
  )
}
