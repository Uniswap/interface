import { memo } from 'react'
import { Link } from 'react-router'
import { Button, Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

interface ViewAllButtonProps {
  label: string
  elementName: ElementName
  href: string
  onPress?: () => void
  testId?: string
  fullWidth?: boolean
}

export const ViewAllButton = memo(function ViewAllButton({
  href,
  label,
  elementName,
  onPress,
  testId,
  fullWidth = false,
}: ViewAllButtonProps) {
  return (
    <Flex row width={fullWidth ? '100%' : 'max-content'}>
      <Link to={href} style={{ textDecoration: 'none', ...(fullWidth ? { width: '100%' } : undefined) }}>
        <Trace logPress element={elementName}>
          <Button
            variant="default"
            emphasis="tertiary"
            size="small"
            icon={<ArrowRight />}
            iconPosition="after"
            width={fullWidth ? '100%' : 'max-content'}
            justifyContent={fullWidth ? 'center' : undefined}
            borderRadius="$roundedFull"
            data-testid={testId}
            onPress={onPress}
          >
            {label}
          </Button>
        </Trace>
      </Link>
    </Flex>
  )
})
