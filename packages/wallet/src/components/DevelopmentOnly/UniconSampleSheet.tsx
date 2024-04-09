import { Flex, UniconV2 } from 'ui/src'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ModalName } from 'wallet/src/telemetry/constants'

const generateRandomEthereumAddresses = (numberOfAddresses: number): string[] => {
  const addresses = []
  for (let i = 0; i < numberOfAddresses; i++) {
    const randomHex = [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
    addresses.push(`0x${randomHex}`)
  }
  return addresses
}

export const UniconSampleSheet = ({ onClose }: { onClose: () => void }): JSX.Element => {
  return (
    <BottomSheetModal
      blurredBackground
      backgroundColor="$surface1"
      name={ModalName.UniconsDevModal}
      onClose={onClose}>
      <Flex centered height="100%" width="100%">
        <Flex row alignItems="center" flexWrap="wrap" justifyContent="center" width="100%">
          {generateRandomEthereumAddresses(80).map((address) => {
            return (
              <Flex>
                <UniconV2 key={address} address={address} size={42} />
              </Flex>
            )
          })}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
