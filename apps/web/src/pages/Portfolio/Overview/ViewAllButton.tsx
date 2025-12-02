import { memo } from 'react'
import { useNavigate } from 'react-router'
import { Button, Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'

export const ViewAllButton = memo(function ViewAllButton({ href, label }: { href: string; label: string }) {
  const navigate = useNavigate()

  return (
    <Flex row width="max-content">
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
    </Flex>
  )
})
