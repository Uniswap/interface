import { PropsWithChildren } from 'react'
import { Flex } from 'ui/src'

export enum PasskeyMenuModalState {
  ADD_PASSKEY = 'ADD_PASSKEY',
  DELETE_PASSKEY = 'DELETE_PASSKEY',
  DELETE_PASSKEY_SPEEDBUMP = 'DELETE_PASSKEY_SPEEDBUMP',
}

export function GenericPasskeyMenuModal({ show, children }: PropsWithChildren<{ show: boolean }>) {
  return (
    <Flex
      display={show ? 'flex' : 'none'}
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      background="$surface1"
      opacity={1}
      borderRadius="$rounded12"
      pt={24}
      px="$padding16"
      pb="$padding16"
      gap="$gap16"
      alignItems="center"
      width="max-content"
      maxWidth={300}
      zIndex={2}
      onPress={(e) => {
        e.stopPropagation()
      }}
      $md={{
        position: 'static',
        transform: 'none',
        pt: 0,
        px: 0,
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {children}
    </Flex>
  )
}
