import { PropsWithChildren } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'

export enum PasskeyMenuModalState {
  ADD_PASSKEY = 'ADD_PASSKEY',
  DELETE_PASSKEY = 'DELETE_PASSKEY',
  DELETE_PASSKEY_SPEEDBUMP = 'DELETE_PASSKEY_SPEEDBUMP',
  VERIFY_PASSKEY = 'VERIFY_PASSKEY',
}

export function GenericPasskeyMenuModal({
  show,
  onClose,
  children,
}: PropsWithChildren<{ show: boolean; onClose: () => void }>) {
  return (
    <Flex
      display={show ? 'flex' : 'none'}
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      background="$surface1"
      opacity={1}
      borderRadius="$rounded20"
      pt={24}
      px="$padding16"
      pb="$padding16"
      gap="$gap16"
      alignItems="center"
      width="max-content"
      maxWidth={336}
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
      <Flex row width="100%" mb={-8} justifyContent="flex-end" $md={{ display: 'none' }}>
        <TouchableArea onPress={onClose}>
          <X size={24} color="$neutral2" />
        </TouchableArea>
      </Flex>
      {children}
    </Flex>
  )
}
