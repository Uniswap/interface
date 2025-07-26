import { Flex, Text } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'

export default function Profile() {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      mt={-INTERFACE_NAV_HEIGHT}
      pt={INTERFACE_NAV_HEIGHT}
      px="$spacing20"
    >
      <Flex backgroundColor="$surface1" borderRadius="$rounded16" p="$spacing24" maxWidth={600} width="100%">
        <Text variant="heading2" textAlign="center" mb="$spacing16">
          Profile Page
        </Text>
        <Text variant="body1" textAlign="center" color="$neutral2">
          Welcome to your profile page! This is where you can manage your account settings and preferences.
        </Text>
      </Flex>
    </Flex>
  )
}
