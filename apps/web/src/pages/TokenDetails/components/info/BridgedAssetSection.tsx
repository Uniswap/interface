import { useAtom } from 'jotai'
import { useNavigate } from 'react-router'
import { BridgedAssetModalAtom } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { BridgedAssetTDPSection } from 'uniswap/src/components/BridgedAsset/BridgedAssetTDPSection'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { TokenQueryData } from '~/appGraphql/data/Token'
import { useModalState } from '~/hooks/useModalState'

export function BridgedAssetSection({
  tokenQueryData,
  currencyInfo,
  isBridgedAsset,
}: {
  tokenQueryData: Maybe<TokenQueryData>
  currencyInfo: Maybe<CurrencyInfo>
  isBridgedAsset: boolean
}): JSX.Element | null {
  const navigate = useNavigate()
  const { toggleModal, closeModal } = useModalState(ModalName.BridgedAsset)
  const [, setBridgedAssetModal] = useAtom(BridgedAssetModalAtom)

  const handlePress = useEvent(() => {
    if (isBridgedAsset && currencyInfo) {
      setBridgedAssetModal({
        currencyInfo0: currencyInfo,
        onContinue: () => {
          if (tokenQueryData) {
            navigate(`/swap/?chain=${tokenQueryData.chain.toLowerCase()}&outputCurrency=${tokenQueryData.address}`)
            closeModal()
          } else {
            logger.debug('BridgedAssetSection', 'handlePress', 'No token query data for bridged asset')
          }
        },
      })
      toggleModal()
    }
  })

  if (!isBridgedAsset || !currencyInfo) {
    return null
  }

  return <BridgedAssetTDPSection currencyInfo={currencyInfo} onPress={handlePress} />
}
