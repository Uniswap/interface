import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function SwapFormHeader(): JSX.Element {
  const { t } = useTranslation()
  const { onClose } = useTransactionModalContext()

  return (
    <Flex
      row
      alignItems="center"
      position="relative"
      justifyContent="flex-start"
      mb={isWeb ? '$spacing16' : '$spacing12'}
      mt={isWeb ? '$spacing4' : '$spacing8'}
      pl={isWeb ? '$none' : '$spacing12'}
      testID={TestID.SwapFormHeader}
      height="$spacing32"
    >
      {isWeb && (
        <TouchableArea testID={TestID.SwapSettings} onPress={onClose}>
          <Flex
            centered
            row
            backgroundColor={isWeb ? undefined : '$surface2'}
            borderRadius="$roundedFull"
            px="$spacing4"
            py="$spacing4"
          >
            <X color="$neutral2" size={iconSizes.icon24} />
          </Flex>
        </TouchableArea>
      )}
      <Flex $platform-web={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Text variant="subheading1">{t('swap.form.header')}</Text>
      </Flex>
    </Flex>
  )
}
