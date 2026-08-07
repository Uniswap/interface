import { useAtom } from 'jotai'
import { useNavigate } from 'react-router'
import { BridgedAssetModalAtom } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { BridgedAssetTDPSection } from 'uniswap/src/components/BridgedAsset/BridgedAssetTDPSection'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useModalState } from '~/hooks/useModalState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function BridgedAssetSection({
  currencyInfo,
  isBridgedAsset,
}: {
  currencyInfo: Maybe<CurrencyInfo>
  isBridgedAsset: boolean
}): JSX.Element | null {
  const navigate = useNavigate()
  const { toggleModal, closeModal } = useModalState(ModalName.BridgedAsset)
  const [, setBridgedAssetModal] = useAtom(BridgedAssetModalAtom)
  const { currencyChain, address } = useTDPStore((s) => ({ currencyChain: s.currencyChain, address: s.address }))

  const handlePress = useEvent(() => {
    if (isBridgedAsset && currencyInfo) {
      setBridgedAssetModal({
        currencyInfo0: currencyInfo,
        onContinue: () => {
          // bridged assets are never native, so `address` is always a real token address here
          navigate(`/swap/?chain=${currencyChain.toLowerCase()}&outputCurrency=${address}`)
          closeModal()
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
