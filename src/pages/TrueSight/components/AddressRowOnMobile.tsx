import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import { Flex } from 'rebass'

import ModalContractAddress from 'components/ModalContractAddress'
import { NETWORKS_INFO, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { FieldName, FieldValue } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import getShortenAddress from 'utils/getShortenAddress'

type Props = {
  platforms: Map<string, string>
}

const AddressRowOnMobile: React.FC<Props> = ({ platforms }) => {
  const defaultNetwork: string = platforms.size ? platforms.keys().next().value : ''
  const defaultAddress = defaultNetwork ? platforms.get(defaultNetwork) ?? '' : ''

  const [isCopied, setCopied] = useCopyClipboard()
  const toggleContractAddressModal = useToggleModal(ApplicationModal.CONTRACT_ADDRESS)

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(defaultAddress)
  }

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center" onClick={toggleContractAddressModal}>
        <FieldName>
          <Trans>Contract Address</Trans>
          <ChevronDown size={16} style={{ marginLeft: '4px' }} />
        </FieldName>
        <FieldValue>
          <img
            src={NETWORKS_INFO[TRUESIGHT_NETWORK_TO_CHAINID[defaultNetwork] || ChainId.MAINNET].icon}
            alt="Network"
            style={{ minWidth: '16px', width: '16px', marginRight: '6px' }}
          />
          <Flex alignItems="center" onClick={onCopy}>
            <div style={{ width: '90px' }}>{getShortenAddress(defaultAddress)}</div>
            {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
          </Flex>
        </FieldValue>
      </Flex>
      <ModalContractAddress platforms={platforms} />
    </>
  )
}

export default AddressRowOnMobile
