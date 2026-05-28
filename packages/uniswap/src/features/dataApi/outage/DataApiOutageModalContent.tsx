import { isWebPlatform } from '@universe/environment'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { CloudSlash } from 'ui/src/components/icons/CloudSlash'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

type DataApiOutageModalContentProps = {
  isOpen: boolean
  lastUpdatedAt: number | undefined
  onClose: () => void
}

export function DataApiOutageModalContent({
  isOpen,
  lastUpdatedAt,
  onClose,
}: DataApiOutageModalContentProps): JSX.Element {
  const { t } = useTranslation()
  const localizedDayjs = useLocalizedDayjs()

  const formattedTime = useMemo(() => {
    if (!lastUpdatedAt) {
      return undefined
    }
    return localizedDayjs(lastUpdatedAt).format('lll')
  }, [lastUpdatedAt, localizedDayjs])

  return (
    <Modal
      isModalOpen={isOpen}
      name={ModalName.DataApiOutage}
      maxWidth={isWebPlatform ? 420 : undefined}
      onClose={onClose}
    >
      {isWebPlatform && (
        <Flex row justifyContent="flex-end">
          <TouchableArea p="$spacing16" onPress={onClose}>
            <X color="$neutral2" size="$icon.24" />
          </TouchableArea>
        </Flex>
      )}
      <Flex
        gap="$spacing16"
        pt={isWebPlatform ? undefined : '$spacing12'}
        px={isWebPlatform ? '$spacing4' : '$spacing24'}
        alignItems="center"
      >
        <Flex
          alignItems="center"
          justifyContent="center"
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          width="$spacing48"
          height="$spacing48"
        >
          <CloudSlash color="$neutral2" size="$icon.24" />
        </Flex>
        <Flex gap="$spacing12" mb="$spacing6" alignItems="center">
          <Text variant="subheading1" textAlign="center">
            {t('dataApi.outage.modal.title')}
          </Text>
          <Text variant="body2" color="$neutral2" textAlign="center">
            {t('dataApi.outage.modal.description')}
          </Text>
          {formattedTime ? (
            <Text variant="body2" color="$neutral2" textAlign="center">
              {t('dataApi.outage.modal.cachedData', { time: formattedTime })}
            </Text>
          ) : null}
        </Flex>
        <Flex row width="100%">
          <Button size={isWebPlatform ? 'small' : 'medium'} emphasis="primary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
