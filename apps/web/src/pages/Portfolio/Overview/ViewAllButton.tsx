import { memo } from 'react'
import { useNavigate } from 'react-router'
import { Button, Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

interface ViewAllButtonProps {
  label: string
  elementName: ElementName
  href?: string
  onPress?: () => void
}

export const ViewAllButton = memo(function ViewAllButton({ href, label, elementName, onPress }: ViewAllButtonProps) {
  const navigate = useNavigate()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else if (href) {
      navigate(href)
    }
  }

  return (
    <Flex row width="max-content">
      <Trace logPress element={elementName}>
        <Button
          variant="default"
          emphasis="tertiary"
          size="small"
          onPress={handlePress}
          icon={<ArrowRight />}
          iconPosition="after"
          width="max-content"
          borderRadius="$roundedFull"
        >
          {label}
        </Button>
      </Trace>
    </Flex>
  )
})
