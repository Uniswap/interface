import React from 'react'
import { useHomeStackNavigation } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'

export default function EnsNameResults({ names }: { names: { name: string; address: Address }[] }) {
  const navigation = useHomeStackNavigation()

  const onPress = (item: { name: string; address: Address }) => {
    navigation.navigate(Screens.User, { address: item.address })
  }

  return (
    <Flex row>
      {Object.values(names).map((item, index) => (
        <Button
          key={index}
          backgroundColor="tabBackground"
          borderRadius="lg"
          padding="md"
          onPress={() => onPress(item)}>
          <Text variant="body1">{item.name}</Text>
        </Button>
      ))}
    </Flex>
  )
}
