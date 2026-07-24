import { isAndroid, isMobileApp, isMobileWeb, isWebPlatform } from '@universe/environment'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Flex, GeneratedIcon, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { ReportInput } from 'uniswap/src/components/reporting/input'
import { ReportModalContent } from 'uniswap/src/components/reporting/ReportModalContent'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

const ANDROID_SNAP_POINTS = ['70%', '100%']

export type ReportOption<T extends string> = {
  title: string
  subtitle?: string
  value: T
  /** Shows a text input below the checkbox when this option is selected */
  additionalTextInput?: boolean
  /** Overrides the default placeholder text for the text input */
  inputPlaceholderOverride?: string
}

export type ReportModalProps<T extends string> = {
  modalName: ModalNameType
  modalTitle: string
  icon: GeneratedIcon
  reportOptions: ReportOption<T>[]
  submitReport: ({ checkedItems, reportTexts }: { checkedItems: Set<T>; reportTexts: Map<T, string> }) => void
}

export function ReportModal<T extends string>({
  modalName,
  modalTitle,
  icon: Icon,
  reportOptions,
  isOpen,
  submitReport,
  onClose,
}: ReportModalProps<T> & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const [checkedItems, setCheckedItems] = useState<Set<T>>(new Set())
  const [reportTexts, setReportTexts] = useState<Map<T, string>>(new Map())

  const { keyboardHeight } = useBottomSheetSafeKeyboard()

  // Clear form whenever a new currency is selected
  useEffect(() => {
    setCheckedItems(new Set())
    setReportTexts(new Map())
  }, [isOpen])

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
    // Clear any associated text when an option is unchecked
    setReportTexts((prevTexts) => {
      if (!prevTexts.has(option)) {
        return prevTexts
      }
      const newMap = new Map(prevTexts)
      newMap.delete(option)
      return newMap
    })
  })

  return (
    <Modal
      name={modalName}
      isModalOpen={isOpen}
      overrideInnerContainer={isMobileApp}
      snapPoints={isAndroid ? ANDROID_SNAP_POINTS : undefined}
      onClose={onClose}
    >
      <ReportModalContent keyboardHeight={keyboardHeight}>
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
            <Text variant="subheading1">{modalTitle}</Text>
          </Flex>
          <Flex gap="$spacing16">
            {reportOptions.map((option: ReportOption<T>) => {
              if (keyboardHeight > 0 && !(option.additionalTextInput && checkedItems.has(option.value))) {
                return null
              }
              return (
                <Flex key={option.value} gap="$spacing16">
                  <TouchableArea
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
                    <Flex fill gap="$spacing4">
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
                  {option.additionalTextInput && checkedItems.has(option.value) && (
                    <ReportInput
                      placeholder={option.inputPlaceholderOverride ?? t('reporting.token.report.other.placeholder')}
                      setReportText={(text) => {
                        setReportTexts((prev) => new Map(prev).set(option.value, text))
                      }}
                    />
                  )}
                </Flex>
              )
            })}
          </Flex>
          <Flex row>
            <Button
              size="medium"
              emphasis="primary"
              disabled={checkedItems.size === 0}
              onPress={() => {
                const sanitizedTexts = new Map<T, string>()
                for (const [key, value] of reportTexts) {
                  const trimmed = value.trim()
                  if (trimmed) {
                    sanitizedTexts.set(key, trimmed)
                  }
                }
                submitReport({ checkedItems, reportTexts: sanitizedTexts })
              }}
            >
              {checkedItems.size > 0 ? t('common.submit') : t('reporting.token.report.button.disabled')}
            </Button>
          </Flex>
        </Flex>
      </ReportModalContent>
    </Modal>
  )
}
