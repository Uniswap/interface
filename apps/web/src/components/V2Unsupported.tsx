import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export function V2Unsupported() {
  return (
    <Flex gap="$gap24" alignItems="center" width="100%">
      <Flex gap="$gap12" width="100%" alignItems="center">
        <Flex
          alignItems="center"
          borderColor="$neutral3"
          borderRadius="$rounded12"
          borderWidth={1}
          justifyContent="center"
          px="$spacing12"
          py="$spacing16"
        >
          <Text color="$neutral2" textAlign="center" variant="body2">
            <Trans i18nKey="v2.notAvailable" />
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
