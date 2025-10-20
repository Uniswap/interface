import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWebPlatform } from 'utilities/src/platform'

export const SwapFormHeader = (): JSX.Element => {
  const { t } = useTranslation()
  const { onClose } = useTransactionModalContext()

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="flex-start"
      mb="$spacing16"
      mt="$spacing4"
      testID={TestID.SwapFormHeader}
    >
      <TouchableArea testID={TestID.SwapSettings} onPress={onClose}>
        <Flex
          centered
          row
          backgroundColor={isWebPlatform ? undefined : '$surface2'}
          borderRadius="$roundedFull"
          px="$spacing4"
          py="$spacing4"
        >
          <X color="$neutral2" size="$icon.24" />
        </Flex>
      </TouchableArea>
      <Flex position="absolute" left="50%" transform="translateX(-50%)">
        <Text variant="subheading1">{t('swap.form.header')}</Text>
      </Flex>
    </Flex>
  )
}
