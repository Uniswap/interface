import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { DetailsTab } from '~/features/Toucan/Auction/ActivityTimeline/DetailsTab'
import { HowItWorksTab } from '~/features/Toucan/Auction/ActivityTimeline/SimulationTab/HowItWorksTab'

type DetailsModalTab = 'details' | 'howItWorks'

interface AuctionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: DetailsModalTab
}

export function AuctionDetailsModal({ isOpen, onClose, initialTab = 'details' }: AuctionDetailsModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<DetailsModalTab>(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  return (
    <Modal isModalOpen={isOpen} name={ModalName.Dialog} onClose={onClose} maxWidth={540} padding={0}>
      <Flex backgroundColor="$surface1" overflow="hidden">
        {/* Header */}
        <Flex px="$spacing24" py="$spacing16">
          <Flex row justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderColor="$surface3">
            <Flex row gap="$spacing16">
              <TouchableArea onPress={() => setActiveTab('details')}>
                <Text variant="subheading1" color={activeTab === 'details' ? '$neutral1' : '$neutral2'}>
                  {t('toucan.details.tab.details')}
                </Text>
              </TouchableArea>
              <TouchableArea onPress={() => setActiveTab('howItWorks')}>
                <Text variant="subheading1" color={activeTab === 'howItWorks' ? '$neutral1' : '$neutral2'}>
                  {t('toucan.details.tab.howItWorks')}
                </Text>
              </TouchableArea>
            </Flex>
            <TouchableArea onPress={onClose} p="$spacing8" borderRadius="$rounded8">
              <X size="$icon.24" color="$neutral1" />
            </TouchableArea>
          </Flex>
        </Flex>

        {activeTab === 'details' ? <DetailsTab /> : <HowItWorksTab />}
      </Flex>
    </Modal>
  )
}
