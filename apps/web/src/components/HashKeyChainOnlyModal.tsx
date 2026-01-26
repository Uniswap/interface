import useSelectChain from 'hooks/useSelectChain'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface HashKeyChainOnlyModalProps {
  isOpen: boolean
  onClose: () => void
  currentChainId?: UniverseChainId
}

export function HashKeyChainOnlyModal({ isOpen, onClose, currentChainId }: HashKeyChainOnlyModalProps): JSX.Element {
  const { t } = useTranslation()
  const selectChain = useSelectChain()

  const handleSwitchToMainnet = async () => {
    await selectChain(UniverseChainId.HashKey)
    onClose()
  }

  const handleSwitchToTestnet = async () => {
    await selectChain(UniverseChainId.HashKeyTestnet)
    onClose()
  }

  const hashKeyMainnetInfo = getChainInfo(UniverseChainId.HashKey)
  const hashKeyTestnetInfo = getChainInfo(UniverseChainId.HashKeyTestnet)

  return (
    <Modal name={ModalName.ConfirmSwap} isModalOpen={isOpen} onClose={onClose}>
      <Flex gap="$spacing16" p="$padding24" alignItems="center">
        <Flex centered width={64} height={64} borderRadius="$rounded32" backgroundColor="$surface2" mb="$spacing8">
          <AlertTriangleFilled color="$statusWarning" size={32} />
        </Flex>

        <Text variant="subheading1" color="$neutral1" textAlign="center">
          仅支持 HashKey Chain
        </Text>

        <Text variant="body2" color="$neutral2" textAlign="center" lineHeight={20}>
          当前应用仅支持 HashKey Chain 主网和测试网。请切换到以下网络之一：
        </Text>

        <Flex gap="$spacing12" width="100%">
          <Button
            emphasis="primary"
            size="large"
            onPress={handleSwitchToMainnet}
            disabled={currentChainId === UniverseChainId.HashKey}
          >
            切换到 {hashKeyMainnetInfo.label}
          </Button>

          <Button
            emphasis="secondary"
            size="large"
            onPress={handleSwitchToTestnet}
            disabled={currentChainId === UniverseChainId.HashKeyTestnet}
          >
            切换到 {hashKeyTestnetInfo.label}
          </Button>
        </Flex>

        <Button emphasis="tertiary" size="medium" onPress={onClose}>
          稍后
        </Button>
      </Flex>
    </Modal>
  )
}
