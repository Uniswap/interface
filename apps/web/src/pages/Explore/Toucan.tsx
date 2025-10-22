import { useNavigate } from 'react-router'
import { Button, Flex } from 'ui/src'

export default function Toucan() {
  const navigate = useNavigate()

  return (
    <Flex>
      <Button
        onPress={() => {
          navigate('/explore/toucan/123')
        }}
      >
        Toucan
      </Button>
    </Flex>
  )
}
