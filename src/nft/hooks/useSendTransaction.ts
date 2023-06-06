import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { hexStripZeros } from '@ethersproject/bytes'
import { ContractReceipt } from '@ethersproject/contracts'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import ERC721 from '../../abis/erc721.json'
import ERC1155 from '../../abis/erc1155.json'
import CryptoPunksMarket from '../abis/CryptoPunksMarket.json'
import { GenieAsset, RouteResponse, RoutingItem, TxResponse, TxStateType, UpdatedGenieAsset } from '../types'
import { compareAssetsWithTransactionRoute } from '../utils/txRoute/combineItemsWithTxRoute'

interface TxState {
  state: TxStateType
  setState: (state: TxStateType) => void
  txHash: string
  clearTxHash: () => void
  purchasedWithErc20: boolean
  sendTransaction: (
    signer: JsonRpcSigner,
    selectedAssets: UpdatedGenieAsset[],
    transactionData: RouteResponse,
    purchasedWithErc20: boolean
  ) => Promise<TxResponse | undefined>
}

export const useSendTransaction = create<TxState>()(
  devtools(
    (set) => ({
      state: TxStateType.New,
      txHash: '',
      purchasedWithErc20: false,
      clearTxHash: () => set({ txHash: '' }),
      setState: (newState) => set(() => ({ state: newState })),
      sendTransaction: async (signer, selectedAssets, transactionData, purchasedWithErc20) => {
        const address = await signer.getAddress()
        try {
          const txNoGasLimit = {
            to: transactionData.to,
            value: transactionData.valueToSend ? BigNumber.from(transactionData.valueToSend) : undefined,
            data: transactionData.data,
          }

          const gasLimit = (await signer.estimateGas(txNoGasLimit)).mul(105).div(100)
          // tx['gasLimit'] = gasLimit
          const tx = { ...txNoGasLimit, gasLimit } // TODO test this works when firing off tx

          set({ state: TxStateType.Signing })
          const res = await signer.sendTransaction(tx)
          set({ state: TxStateType.Confirming })
          set({ txHash: res.hash })
          set({ purchasedWithErc20 })

          const txReceipt = await res.wait()

          //tx was mined successfully
          if (txReceipt.status === 1) {
            const nftsPurchased = findNFTsPurchased(txReceipt, address, selectedAssets, transactionData.route)
            const nftsNotPurchased = findNFTsNotPurchased(selectedAssets, nftsPurchased)
            set({ state: TxStateType.Success })
            return {
              nftsPurchased,
              nftsNotPurchased,
              txReceipt,
            }
          } else {
            set({ state: TxStateType.Failed })
            return {
              nftsPurchased: [],
              nftsNotPurchased: selectedAssets,
              txReceipt,
            }
          }
        } catch (e) {
          console.log('Error creating multiAssetSwap Transaction', e)
          if (e.code === 4001) {
            set({ state: TxStateType.Denied })
          } else {
            set({ state: TxStateType.Invalid })
          }
          return
        }
      },
    }),
    { name: 'useSendTransactionState' }
  )
)

const findNFTsPurchased = (
  txReceipt: ContractReceipt,
  signerAddress: string,
  toBuy: GenieAsset[],
  txRoute: RoutingItem[]
): UpdatedGenieAsset[] => {
  if (!txReceipt.logs) {
    return []
  }
  const erc721Interface = new Interface(ERC721)
  const erc1155Interface = new Interface(ERC1155)
  const cryptopunksMarketInterface = new Interface(CryptoPunksMarket)

  // Find successfully purchased NFTs (and assign to state nftsPurchased) by parsing events
  const transferErc721BuyEvents = txReceipt.logs.filter(
    (x) =>
      x.topics[0] === erc721Interface.getEventTopic('Transfer') &&
      hexStripZeros(x.topics[2]).toLowerCase() === signerAddress.toLowerCase()
  )

  const transferredErc721 = transferErc721BuyEvents.map((x) => ({
    address: x.address,
    tokenId: parseInt(x.topics[3]).toString(),
  }))
  const transferErc1155BuyEvents = txReceipt.logs.filter(
    (x) =>
      x.topics[0] === erc1155Interface.getEventTopic('TransferSingle') &&
      hexStripZeros(x.topics[3]).toLowerCase() === signerAddress.toLowerCase()
  )

  const transferredErc1155 = transferErc1155BuyEvents.map((x) => ({
    address: x.address,
    tokenId: erc1155Interface.parseLog(x).args[3].toString(),
  }))

  // Find transferred CryptoPunks
  const transferCryptopunkEvents = txReceipt.logs.filter(
    (x) =>
      x.topics[0] === cryptopunksMarketInterface.getEventTopic('PunkTransfer') &&
      hexStripZeros(x.topics[2]).toLowerCase() === signerAddress.toLowerCase()
  )
  const transferredCryptopunks = transferCryptopunkEvents.map((x) => ({
    address: x.address,
    tokenId: cryptopunksMarketInterface.parseLog(x).args[2].toString(),
  }))

  const allTransferred = [...transferredErc721, ...transferredErc1155, ...transferredCryptopunks]

  const transferredItems = toBuy.filter((assetToBuy) => {
    return allTransferred.some(
      (purchasedNft) =>
        assetToBuy.address.toLowerCase() === purchasedNft.address.toLowerCase() &&
        parseInt(assetToBuy.tokenId).toString() === purchasedNft.tokenId
    )
  })

  return compareAssetsWithTransactionRoute(transferredItems, txRoute).updatedAssets
}

const findNFTsNotPurchased = (toBuy: GenieAsset[], nftsPurchased: UpdatedGenieAsset[]) => {
  const nftsNotPurchased: Array<UpdatedGenieAsset> = []
  toBuy.forEach((selectedAsset) => {
    const purchasedNft = nftsPurchased.find(
      (x) => x.address.toLowerCase() === selectedAsset.address.toLowerCase() && x.tokenId === selectedAsset.tokenId
    )
    if (!purchasedNft) {
      nftsNotPurchased.push(selectedAsset)
    }
  })
  return nftsNotPurchased
}
