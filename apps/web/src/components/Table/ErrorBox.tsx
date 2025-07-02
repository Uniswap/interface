import { MissingDataIcon } from 'components/Table/icons'
import { Flex, Text } from 'ui/src'

export const ErrorModal = ({ header, subtitle }: { header: React.ReactNode; subtitle: React.ReactNode }) => (
  <Flex
    row
    testID="table-error-modal"
    alignItems="flex-start"
    justifyContent="flex-start"
    position="absolute"
    top="50%"
    left="50%"
    transform="translate(-50%, -50%)"
    width={320}
    padding="$padding12"
    gap="$gap12"
    backgroundColor="$surface5"
    backdropFilter="blur(24px)"
    boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
    borderWidth={1}
    borderColor="$surface3"
    borderRadius="$rounded20"
  >
    <Flex>
      <MissingDataIcon />
    </Flex>
    <Flex maxWidth={200}>
      <Text variant="subheading1" color="$neutral1">
        {header}
      </Text>
      <Text variant="body2" color="$neutral2">
        {subtitle}
      </Text>
    </Flex>
  </Flex>
)
