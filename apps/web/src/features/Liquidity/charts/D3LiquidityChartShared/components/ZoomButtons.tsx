import { Flex, TouchableArea, TouchableAreaProps } from 'ui/src'
import { Expand } from 'ui/src/components/icons/Expand'
import { SearchMinus } from 'ui/src/components/icons/SearchMinus'
import { SearchPlus } from 'ui/src/components/icons/SearchPlus'

const ZoomOptionButton = ({ children, ...props }: TouchableAreaProps) => {
  return (
    <TouchableArea
      animation="100ms"
      animateOnly={['opacity']}
      backgroundColor="$transparent"
      hoverStyle={{ backgroundColor: '$transparent', opacity: 0.8 }}
      pressStyle={{ backgroundColor: '$surface3', opacity: 0.8 }}
      alignItems="center"
      justifyContent="center"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$spacing8"
      {...props}
    >
      {children}
    </TouchableArea>
  )
}

export function ZoomButtons({
  onZoomIn,
  onZoomOut,
  onReset,
  resetDisabled = false,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  resetDisabled?: boolean
}) {
  return (
    <Flex row centered borderRadius="$roundedFull">
      <ZoomOptionButton borderTopLeftRadius="$roundedFull" borderBottomLeftRadius="$roundedFull" onPress={onZoomOut}>
        <SearchMinus size={16} color="$neutral1" />
      </ZoomOptionButton>
      <ZoomOptionButton
        disabled={resetDisabled}
        borderRadius="$none"
        borderLeftWidth={0}
        borderRightWidth={0}
        onPress={onReset}
      >
        <Expand size={16} color="$neutral1" />
      </ZoomOptionButton>
      <ZoomOptionButton borderTopRightRadius="$roundedFull" borderBottomRightRadius="$roundedFull" onPress={onZoomIn}>
        <SearchPlus size={16} color="$neutral1" />
      </ZoomOptionButton>
    </Flex>
  )
}
