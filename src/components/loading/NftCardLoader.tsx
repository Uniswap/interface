import React, { ComponentProps } from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'

export function NftCardLoader({ ...props }: ComponentProps<typeof Box>) {
  return (
    <Box flex={1} justifyContent="flex-start" m="xs" {...props}>
      <Box aspectRatio={1} backgroundColor="background3" borderRadius="md" width="100%" />
      <Flex gap="none" py="xs">
        <Flex row alignItems="center" gap="xs" justifyContent="flex-start">
          <Flex row shrink>
            <Box bg="background3" borderRadius="xs" height="90%" width="90%">
              <HiddenFromScreenReaders>
                <Text
                  color="none"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  opacity={0}
                  variant="bodyLarge">
                  Asset Name
                </Text>
              </HiddenFromScreenReaders>
            </Box>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="xs" justifyContent="flex-start">
          <Flex row shrink>
            <Box bg="background3" borderRadius="xs" height="80%" width="80%">
              <HiddenFromScreenReaders>
                <Text
                  color="none"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  opacity={0}
                  variant="bodySmall">
                  Collection Name
                </Text>
              </HiddenFromScreenReaders>
            </Box>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="xs" justifyContent="flex-start">
          <Flex row shrink>
            <Box bg="background3" borderRadius="xs" height="80%" width="60%">
              <HiddenFromScreenReaders>
                <Text
                  color="none"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  opacity={0}
                  variant="bodySmall">
                  0.00 ETH
                </Text>
              </HiddenFromScreenReaders>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}
