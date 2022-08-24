import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import {
  selectRecipient,
  toggleShowRecipientSelector,
} from 'src/features/transactions/transactionState/transactionState'
import { toSupportedChainId } from 'src/utils/chainId'

interface CreateInputAssetParams {
  assetType?: AssetType
  inputAsset: NullUndefined<NFTAsset.Asset | Currency>
}

export interface InputAssetInfo {
  currencyIn: Currency | undefined
  chainId: ChainId | undefined
  nftIn: NFTAsset.Asset | undefined
}

export const createOnToggleShowRecipientSelector = (dispatch: React.Dispatch<AnyAction>) => () =>
  dispatch(toggleShowRecipientSelector)

export const createOnSelectRecipient = (dispatch: React.Dispatch<AnyAction>) => {
  return (recipient: Address) => {
    createOnToggleShowRecipientSelector(dispatch)()
    dispatch(selectRecipient({ recipient }))
  }
}

export const createInputAssetInfo = ({
  assetType,
  inputAsset,
}: CreateInputAssetParams): InputAssetInfo => {
  const nftIn =
    assetType === AssetType.ERC721 || assetType === AssetType.ERC1155
      ? (inputAsset as NFTAsset.Asset)
      : undefined
  const currencyIn = assetType && !nftIn ? (inputAsset as Currency) : undefined
  const chainId = toSupportedChainId(inputAsset?.chainId) ?? undefined
  return { currencyIn, nftIn, chainId }
}
