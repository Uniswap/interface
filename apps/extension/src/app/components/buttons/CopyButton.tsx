import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, Text, TouchableArea } from 'ui/src'
import { Check, CopySheets } from 'ui/src/components/icons'
import { iconSizes, zIndexes } from 'ui/src/theme'

export function CopyButton({ onCopyPress }: { onCopyPress: () => Promise<void> }): JSX.Element {
  const { t } = useTranslation()

  const [valueCopied, setValueCopied] = useState(false)

  const onPress = async (): Promise<void> => {
    await onCopyPress()
    setValueCopied(true)
  }

  return (
    <Flex row gap="$spacing24">
      <TouchableArea borderRadius="$rounded20" zIndex={zIndexes.fixed} onPress={onCopyPress}>
        <Flex
          row
          alignItems="center"
          backgroundColor="$surface1"
          borderColor={valueCopied ? '$statusSuccess' : '$surface3'}
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          gap="$spacing4"
          justifyContent="center"
          paddingEnd="$spacing16"
          px="$spacing8"
          py="$spacing8"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 0 }}
          shadowOpacity={0.1}
          shadowRadius={4}
          // fixed width means no resize on the animation to copied
          width={84}
          onPress={onPress}
        >
          <AnimatePresence exitBeforeEnter initial={false}>
            {/* note there's various x/y adjustments here due to visual imbalance of icons/text */}
            <Flex
              key={valueCopied ? 'copy' : 'copied'}
              row
              alignItems="center"
              animateEnterExit="fadeInDownOutDown"
              animation="100ms"
              gap="$spacing8"
              justifyContent="center"
              // copied check icon is less wide, content needs to move left to balance
              x={valueCopied ? -1 : 0}
            >
              {valueCopied ? (
                // check icon is a bit smaller and to the right
                <Check color="$statusSuccess" size={iconSizes.icon12 + 2} x={2} />
              ) : (
                <CopySheets color="$neutral2" size="$icon.12" />
              )}
              <Text
                color={valueCopied ? '$statusSuccess' : '$neutral2'}
                cursor="pointer"
                flexShrink={1}
                variant="buttonLabel3"
                x={valueCopied ? -2 : 0}
                y={0.5}
              >
                {valueCopied ? t('common.button.copied') : t('common.button.copy')}
              </Text>
            </Flex>
          </AnimatePresence>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
