import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useNavigate } from 'react-router'
import { BridgedAssetModalAtom } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { BridgedAssetTDPSection } from 'uniswap/src/components/BridgedAsset/BridgedAssetTDPSection'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function BridgedAssetSection(): JSX.Element | null {
  const { tokenQuery } = useTDPContext()
  const tokenQueryData = tokenQuery.data?.token
  const chainId = fromGraphQLChain(tokenQueryData?.chain)
  const currencyInfo = useCurrencyInfo(
    chainId && tokenQueryData?.address ? buildCurrencyId(chainId, tokenQueryData.address) : undefined,
  )
  const navigate = useNavigate()
  const { toggleModal, closeModal } = useModalState(ModalName.BridgedAsset)
  const [, setBridgedAssetModal] = useAtom(BridgedAssetModalAtom)

  const isBridgedAsset = currencyInfo && Boolean(currencyInfo.isBridged)
  const handlePress = useEvent(() => {
    if (isBridgedAsset) {
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

  if (!isBridgedAsset) {
    return null
  }

  return <BridgedAssetTDPSection currencyInfo={currencyInfo} onPress={handlePress} />
}
