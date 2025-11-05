import { Currency } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Flex, GeneratedIcon, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { BaseModalProps } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { ReportInput } from 'uniswap/src/components/reporting/input'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { isMobileApp, isMobileWeb, isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportOption<T extends string> = {
  title: string
  subtitle?: string
  value: T
}

export type ReportModalProps<T extends string> = {
  modalName: ModalNameType
  icon: GeneratedIcon
  reportOptions: ReportOption<T>[]
  textOptionValue: T
  currency?: Currency
  submitReport: ({ checkedItems, reportText }: { checkedItems: Set<T>; reportText: string }) => void
}

export function ReportTokenModal<T extends string>({
  modalName,
  currency,
  icon: Icon,
  reportOptions,
  textOptionValue,
  isOpen,
  submitReport,
  onClose,
}: ReportModalProps<T> & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const [checkedItems, setCheckedItems] = useState<Set<T>>(new Set())
  const [reportText, setReportText] = useState('')

  const { keyboardHeight } = useBottomSheetSafeKeyboard()

  // Clear form whenever a new currency is selected
  // biome-ignore lint/correctness/useExhaustiveDependencies: we intentionally retrigger on currency change or open/close
  useEffect(() => {
    setCheckedItems(new Set())
    setReportText('')
  }, [currency, isOpen])

  const handleItemPress = useEvent((option: T) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev)
      if (prev.has(option)) {
        newSet.delete(option)
      } else {
        newSet.add(option)
      }
      return newSet
    })
  })

  return (
    <Modal name={modalName} isModalOpen={isOpen} onClose={onClose}>
      <Flex p={isMobileApp ? '$spacing12' : undefined} pb={keyboardHeight}>
        {isWebPlatform && !isMobileWeb && (
          <TouchableArea alignItems="flex-end" role="none" onPress={onClose}>
            <X size="$icon.20" color="$neutral3" />
          </TouchableArea>
        )}
        <Flex gap="$spacing24">
          <Flex centered gap="$spacing16">
            <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
              <Icon size="$icon.24" color="$neutral2" />
            </Flex>
            <Text variant="subheading1">
              {t('reporting.token.report.title.withSymbol', { symbol: currency?.symbol ?? '' })}
            </Text>
          </Flex>
          <Flex gap="$spacing16">
            {reportOptions.map((option: ReportOption<T>) => {
              if (keyboardHeight > 0 && option.value !== textOptionValue) {
                return null
              }
              return (
                <TouchableArea
                  key={option.value}
                  row
                  role="none"
                  alignItems="center"
                  gap="$spacing16"
                  onPress={() => handleItemPress(option.value)}
                >
                  <Checkbox
                    size="$icon.16"
                    checked={checkedItems.has(option.value)}
                    onCheckedChange={isMobileApp ? (): void => handleItemPress(option.value) : undefined}
                  />
                  <Flex gap="$spacing4">
                    <Text variant="body2" color="$neutral1">
                      {option.title}
                    </Text>
                    {option.subtitle && (
                      <Text variant="body3" color="$neutral2">
                        {option.subtitle}
                      </Text>
                    )}
                  </Flex>
                </TouchableArea>
              )
            })}
            {checkedItems.has(textOptionValue) && (
              <ReportInput placeholder={t('reporting.token.report.other.placeholder')} setReportText={setReportText} />
            )}
          </Flex>
          <Flex row>
            <Button
              size="medium"
              emphasis="primary"
              isDisabled={checkedItems.size === 0}
              onPress={() => submitReport({ checkedItems, reportText })}
            >
              {checkedItems.size > 0 ? t('common.submit') : t('reporting.token.report.button.disabled')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
