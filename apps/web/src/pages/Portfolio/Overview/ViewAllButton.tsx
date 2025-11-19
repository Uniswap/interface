import { memo } from 'react'
import { useNavigate } from 'react-router'
import { Button, Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

interface ViewAllButtonProps {
  href: string
  label: string
  elementName: ElementName
}

export const ViewAllButton = memo(function ViewAllButton({ href, label, elementName }: ViewAllButtonProps) {
  const navigate = useNavigate()

  return (
    <Flex row width="max-content">
      <Trace logPress element={elementName}>
        <Button
          variant="default"
          emphasis="tertiary"
          size="small"
          onPress={() => navigate(href)}
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
