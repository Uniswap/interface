import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { parseEther } from '@ethersproject/units'
import { addressesByNetwork, MakerOrder, signMakerOrder, SupportedChainId } from '@looksrare/sdk'
import { Seaport } from '@opensea/seaport-js'
import { ItemType } from '@opensea/seaport-js/lib/constants'
import { ConsiderationInputItem } from '@opensea/seaport-js/lib/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { createLooksRareOrder } from 'nft/queries/looksRare'
import { LOOKSRARE_MARKETPLACE_CONTRACT_721 } from 'nft/queries/looksRare/constants'
import { PostOpenSeaSellOrder } from 'nft/queries/openSea'
import {
  OPENSEA_DEFAULT_CROSS_CHAIN_CONDUIT_KEY,
  OPENSEA_FEE_ADDRESS,
  OPENSEA_KEY_TO_CONDUIT,
  OPENSEA_SEAPORT_V1_5_CONTRACT,
} from 'nft/queries/openSea/constants'
import { INVERSE_BASIS_POINTS } from 'nft/queries/openSea/constants'
import { getX2Y2OrderId, newX2Y2Order } from 'nft/queries/x2y2'

import ERC721 from '../../abis/erc721.json'
import ERC1155 from '../../abis/erc1155.json'
import { ListingMarket, ListingStatus, WalletAsset } from '../types'
import { createSellOrder, encodeOrder, OfferItem, OrderPayload, signOrderData } from './x2y2'

export const LOOKS_RARE_CREATOR_BASIS_POINTS = 50

export const ListingMarkets: ListingMarket[] = [
  {
    name: 'X2Y2',
    fee: 0.5,
  },
  {
    name: 'OpenSea',
    fee: 2.5,
  },
]

const createConsiderationItem = (basisPoints: string, recipient: string): ConsiderationInputItem => {
  return {
    amount: basisPoints,
    recipient,
  }
}

const getConsiderationItems = (
  asset: WalletAsset,
  price: BigNumber,
  signerAddress: string
): {
  sellerFee: ConsiderationInputItem
  creatorFee?: ConsiderationInputItem
  openSeaFee?: ConsiderationInputItem
} => {
  const creatorFeeBasisPoints = asset?.basisPoints ?? 0
  const openSeaBasisPoints = (ListingMarkets.find((market) => market.name === 'OpenSea')?.fee ?? 0) * 100
  const sellerBasisPoints = INVERSE_BASIS_POINTS - creatorFeeBasisPoints - openSeaBasisPoints

  const creatorFee = price
    .mul(BigNumber.from(creatorFeeBasisPoints))
    .div(BigNumber.from(INVERSE_BASIS_POINTS))
    .toString()
  const sellerFee = price.mul(BigNumber.from(sellerBasisPoints)).div(BigNumber.from(INVERSE_BASIS_POINTS)).toString()
  const openSeaFee = price.mul(BigNumber.from(openSeaBasisPoints)).div(BigNumber.from(INVERSE_BASIS_POINTS)).toString()

  return {
    sellerFee: createConsiderationItem(sellerFee, signerAddress),
    creatorFee:
      creatorFeeBasisPoints > 0
        ? createConsiderationItem(creatorFee, asset?.asset_contract?.payout_address ?? '')
        : undefined,
    openSeaFee: openSeaBasisPoints ? createConsiderationItem(openSeaFee, OPENSEA_FEE_ADDRESS) : undefined,
  }
}

export async function approveCollection(
  operator: string,
  collectionAddress: string,
  signer: Signer,
  setStatus: (newStatus: ListingStatus) => void,
  nftStandard: NftStandard = NftStandard.Erc721
): Promise<void> {
  const contract = new Contract(collectionAddress, nftStandard === NftStandard.Erc721 ? ERC721 : ERC1155, signer)
  const signerAddress = await signer.getAddress()

  try {
    const approved = await contract.isApprovedForAll(signerAddress, operator)
    if (approved) {
      setStatus(ListingStatus.APPROVED)
      return
    }

    setStatus(ListingStatus.SIGNING)
    const approvalTransaction = await contract.setApprovalForAll(operator, true)

    setStatus(ListingStatus.PENDING)
    const tx = await approvalTransaction.wait()

    tx.status === 1 ? setStatus(ListingStatus.APPROVED) : setStatus(ListingStatus.FAILED)
  } catch (error) {
    if (error.code === 4001) setStatus(ListingStatus.REJECTED)
    else setStatus(ListingStatus.FAILED)
  }
}

export async function signListing(
  marketplace: ListingMarket,
  asset: WalletAsset,
  signer: JsonRpcSigner,
  provider: Web3Provider,
  looksRareNonce = 0,
  setStatus: (newStatus: ListingStatus) => void
): Promise<boolean> {
  const seaport = new Seaport(provider, {
    conduitKeyToConduit: OPENSEA_KEY_TO_CONDUIT,
    overrides: {
      defaultConduitKey: OPENSEA_DEFAULT_CROSS_CHAIN_CONDUIT_KEY,
    },
    seaportVersion: '1.5',
  })

  const signerAddress = await signer.getAddress()
  const listingPrice = asset.newListings?.find((listing) => listing.marketplace.name === marketplace.name)?.price
  if (!listingPrice || !asset.expirationTime || !asset.asset_contract.address || !asset.tokenId) return false
  switch (marketplace.name) {
    case 'OpenSea':
      try {
        const listingInWei = parseEther(`${listingPrice}`)
        const { sellerFee, creatorFee, openSeaFee } = getConsiderationItems(asset, listingInWei, signerAddress)
        const considerationItems = [sellerFee, creatorFee, openSeaFee].filter(
          (item): item is ConsiderationInputItem => item !== undefined
        )

        const { executeAllActions } = await seaport.createOrder(
          {
            offer: [
              {
                itemType: asset.asset_contract.tokenType === NftStandard.Erc721 ? ItemType.ERC721 : ItemType.ERC1155,
                token: asset.asset_contract.address,
                identifier: asset.tokenId,
                amount: '1',
              },
            ],
            consideration: considerationItems,
            endTime: asset.expirationTime.toString(),
            zone: ZERO_ADDRESS,
            allowPartialFills: true,
          },
          signerAddress
        )

        const order = await executeAllActions()
        const seaportV15Order = { ...order, protocol_address: OPENSEA_SEAPORT_V1_5_CONTRACT }
        setStatus(ListingStatus.PENDING)
        const res = await PostOpenSeaSellOrder(seaportV15Order)
        res ? setStatus(ListingStatus.APPROVED) : setStatus(ListingStatus.FAILED)
        return res
      } catch (error) {
        if (error.code === 4001) setStatus(ListingStatus.REJECTED)
        else setStatus(ListingStatus.FAILED)
        return false
      }
    case 'LooksRare': {
      const addresses = addressesByNetwork[SupportedChainId.MAINNET]
      const currentTime = Math.round(Date.now() / 1000)
      const makerOrder: MakerOrder = {
        // true --> ask / false --> bid
        isOrderAsk: true,
        // signer address of the maker order
        signer: signerAddress,
        // collection address
        collection: asset.asset_contract.address,
        // Price in WEI
        price: parseEther(listingPrice.toString()),
        // Token ID
        tokenId: BigNumber.from(asset.tokenId),
        // amount of tokens to sell/purchase (must be 1 for ERC721, 1+ for ERC1155)
        amount: BigNumber.from(1),
        // strategy for trade execution (e.g., DutchAuction, StandardSaleForFixedPrice), see addresses in the SDK
        strategy: addresses.STRATEGY_STANDARD_SALE,
        // currency address
        currency: addresses.WETH,
        // order nonce (must be unique unless new maker order is meant to override existing one e.g., lower ask price)
        nonce: BigNumber.from(looksRareNonce),
        // startTime timestamp in seconds
        startTime: BigNumber.from(currentTime),
        // endTime timestamp in seconds
        endTime: BigNumber.from(asset.expirationTime),
        // minimum ratio to be received by the user (per 10000)
        // As of 11.10.22 LooksRare charges 1.5% + 0.5% if there's creator royalties set https://docs.looksrare.org/blog/looksrare-offers-zero-royalty-trading-shares-protocol-fees-with-creators-instead
        minPercentageToAsk: BigNumber.from(10000)
          .sub(BigNumber.from(150 + (asset.basisPoints ? 50 : 0)))
          .toNumber(),
        // params (e.g., price, target account for private sale)
        params: [],
      }

      try {
        const signatureHash = await signMakerOrder(
          signer,
          SupportedChainId.MAINNET,
          makerOrder,
          LOOKSRARE_MARKETPLACE_CONTRACT_721
        )
        setStatus(ListingStatus.PENDING)
        const payload = {
          signature: signatureHash,
          tokenId: asset.tokenId,
          collection: asset.asset_contract.address,
          strategy: addresses.STRATEGY_STANDARD_SALE,
          currency: addresses.WETH,
          signer: signerAddress,
          isOrderAsk: true,
          nonce: looksRareNonce,
          amount: 1,
          price: parseEther(listingPrice.toString()).toString(),
          startTime: currentTime,
          endTime: asset.expirationTime,
          minPercentageToAsk: 10000 - (150 + (asset.basisPoints ? 50 : 0)),
          params: [],
        }
        const res = await createLooksRareOrder(payload)
        res ? setStatus(ListingStatus.APPROVED) : setStatus(ListingStatus.FAILED)
        return res
      } catch (error) {
        if (error.code === 4001) setStatus(ListingStatus.REJECTED)
        else setStatus(ListingStatus.FAILED)
        return false
      }
    }
    case 'X2Y2': {
      const orderItem: OfferItem = {
        price: parseEther(listingPrice.toString()),
        tokens: [
          {
            token: asset.asset_contract.address,
            tokenId: BigNumber.from(asset.tokenId),
            amount: 1,
          },
        ],
      }
      const order = createSellOrder(signerAddress, asset.expirationTime, [orderItem], asset.asset_contract.tokenType)
      try {
        const prevOrderId = await getX2Y2OrderId(asset.asset_contract.address, asset.tokenId)
        await signOrderData(provider, order)
        const payload: OrderPayload = {
          order: encodeOrder(order),
          isBundle: false,
          bundleName: '',
          bundleDesc: '',
          orderIds: prevOrderId ? [prevOrderId] : [],
          changePrice: Boolean(prevOrderId),
          isCollection: false,
        }
        setStatus(ListingStatus.PENDING)
        // call server api
        const resp = await newX2Y2Order(payload)
        resp ? setStatus(ListingStatus.APPROVED) : setStatus(ListingStatus.FAILED)
        return resp
      } catch (error) {
        if (error.code === 4001) setStatus(ListingStatus.REJECTED)
        else setStatus(ListingStatus.FAILED)
        return false
      }
    }
    default:
      return false
  }
}
