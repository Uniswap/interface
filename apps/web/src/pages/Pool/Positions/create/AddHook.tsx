import { AdvancedButton } from 'pages/Pool/Positions/create/shared'
import { useState } from 'react'
import { Button } from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout/Flex'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useTranslation } from 'uniswap/src/i18n'

export function AddHook() {
  const { t } = useTranslation()

  const [hookInputEnabled, setHookInputEnabled] = useState(false)
  const [hookAddress, setHookAddress] = useState('')

  const handleToggleHookInput = () => {
    setHookInputEnabled((prev) => !prev)
    setHookAddress('')
  }

  if (hookInputEnabled) {
    return (
      <Flex row gap="$spacing4">
        <TextInput
          autoFocus
          placeholder="Enter hook address"
          autoCapitalize="none"
          color="$neutral1"
          fontFamily="$subHeading"
          fontSize={fonts.body2.fontSize}
          fontWeight={fonts.body2.fontWeight}
          lineHeight={24}
          maxLength={42}
          numberOfLines={1}
          px="$spacing16"
          py={5}
          returnKeyType="done"
          width="100%"
          borderWidth={1.5}
          borderColor="$neutral3"
          borderRadius="$rounded12"
          focusStyle={{
            borderColor: '$neutral3',
          }}
          hoverStyle={{
            borderColor: '$neutral3',
          }}
          value={hookAddress}
          onChangeText={(text: string) => setHookAddress(text)}
        />
        <Button theme="secondary" py="$spacing8" px="$spacing12" borderWidth={0} onPress={handleToggleHookInput}>
          <X size="$icon.20" color="$neutral1" />
        </Button>
      </Flex>
    )
  }

  return (
    <AdvancedButton
      title={t('position.addHook')}
      Icon={DocumentList}
      onPress={handleToggleHookInput}
      tooltipText={t('position.addHook.tooltip')}
    />
  )
}
