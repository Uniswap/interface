import { useContext, useEffect, useRef, useState } from 'react'
import { ScrollView as NativeScrollView } from 'react-native'
import { Message, OpenAIContext } from 'src/features/openai/OpenAIContext'
import { Button, Flex, Input, ScrollView, SpinningLoader, Text } from 'ui/src'
import { ArrowUpCircle, UniswapLogo } from 'ui/src/components/icons'
import { fonts, spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function AIAssistantScreen(): JSX.Element {
  const scrollRef = useRef<NativeScrollView>(null)
  const inputRef = useRef<Input>(null)

  const { messages, sendMessage, isOpen, isLoading, close } = useContext(OpenAIContext)
  const [input, setInput] = useState('')
  const [optimisticMessage, setOptimisticMessage] = useState<Message>()
  const address = useActiveAccountAddress() || undefined
  const { avatar } = useAvatar(address)

  const { keyboardHeight } = useBottomSheetSafeKeyboard()

  useEffect(() => {
    setOptimisticMessage(undefined)
  }, [messages])

  const handleSendMessage = (): void => {
    setOptimisticMessage({ text: input, role: 'user', buttons: [] })
    setInput('')
    inputRef.current?.clear()
    sendMessage(input)
  }

  return (
    <>
      {isOpen && (
        <Modal fullScreen name="account-edit-modal" onClose={close}>
          <Flex grow animation="quicker" pb={keyboardHeight > 0 ? keyboardHeight - spacing.spacing20 : '$spacing12'}>
            <ScrollView
              ref={scrollRef}
              flex={1}
              flexGrow={1}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
            >
              <Flex gap="$spacing8" justifyContent="flex-end" pb="$spacing16" px="$spacing16">
                {[...messages, ...(optimisticMessage ? [optimisticMessage] : [])].map((message, index) => (
                  <Flex key={index}>
                    <Flex row gap="$spacing8">
                      {message.role === 'assistant' && <UniswapLogo color="$accent1" size={24} />}
                      <Flex fill alignItems={message.role === 'assistant' ? 'flex-start' : 'flex-end'}>
                        <Flex
                          backgroundColor="$surface2"
                          borderBottomLeftRadius="$rounded20"
                          borderBottomRightRadius="$rounded20"
                          borderTopLeftRadius={message.role === 'assistant' ? '$none' : '$rounded20'}
                          borderTopRightRadius={message.role === 'assistant' ? '$rounded20' : '$none'}
                          p={8}
                        >
                          <Text color={message.role === 'assistant' ? '$neutral1' : '$neutral1'} variant="body1">
                            {message.text}
                          </Text>
                        </Flex>
                      </Flex>
                      {message.role === 'user' && address && (
                        <AccountIcon address={address} avatarUri={avatar} size={24} />
                      )}
                    </Flex>
                    <Flex row flexWrap="wrap" gap="$spacing4">
                      {message.buttons.map((button, buttonIndex) => (
                        <Button key={buttonIndex} theme="tertiary" onPress={(): void => {}}>
                          <Text variant="body3">{button.text}</Text>
                        </Button>
                      ))}
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </ScrollView>
            <Flex
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth="$spacing1"
              mx="$spacing16"
            >
              <Input
                ref={inputRef}
                autoFocus
                backgroundColor="transparent"
                fontSize={fonts.body2.fontSize}
                height="auto"
                pl="$spacing12"
                placeholder="Type here"
                pr="$spacing36"
                py="$spacing8"
                onChangeText={setInput}
                onSubmitEditing={handleSendMessage}
              />
              <Flex position="absolute" right={8} top={8}>
                {isLoading ? (
                  <SpinningLoader color="$accent1" size={28} />
                ) : (
                  <ArrowUpCircle color="$neutral3" size="$icon.28" onPress={handleSendMessage} />
                )}
              </Flex>
            </Flex>
          </Flex>
        </Modal>
      )}
    </>
  )
}
