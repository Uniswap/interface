import { BigNumber } from '@ethersproject/bignumber'
import type { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ConsiderationInputItem } from '@opensea/seaport-js/lib/types'
import {
  INVERSE_BASIS_POINTS,
  OPENSEA_CROSS_CHAIN_CONDUIT,
  OPENSEA_DEFAULT_FEE,
  OPENSEA_FEE_ADDRESS,
} from 'nft/queries/openSea'
import { AssetRow, CollectionRow, ListingMarket, ListingRow, ListingStatus, WalletAsset } from 'nft/types'
import { approveCollection, signListing } from 'nft/utils/listNfts'
import { Dispatch } from 'react'

export const updateStatus = ({
  listing,
  newStatus,
  rows,
  setRows,
  callback,
}: {
  listing: AssetRow
  newStatus: ListingStatus
  rows: AssetRow[]
  setRows: Dispatch<AssetRow[]>
  callback?: () => Promise<void>
}) => {
  const rowsCopy = [...rows]
  const index = rows.findIndex((n) => n === listing)
  listing.status = newStatus
  if (callback) listing.callback = callback
  rowsCopy[index] = listing
  setRows(rowsCopy)
}

export async function approveCollectionRow(
  collectionRow: CollectionRow,
  collectionsRequiringApproval: CollectionRow[],
  setCollectionsRequiringApproval: Dispatch<CollectionRow[]>,
  signer: JsonRpcSigner,
  looksRareAddress: string,
  pauseAllRows: () => void
) {
  updateStatus({
    listing: collectionRow,
    newStatus: ListingStatus.SIGNING,
    rows: collectionsRequiringApproval,
    setRows: setCollectionsRequiringApproval as Dispatch<AssetRow[]>,
    callback: () =>
      approveCollectionRow(
        collectionRow,
        collectionsRequiringApproval,
        setCollectionsRequiringApproval,
        signer,
        looksRareAddress,
        pauseAllRows
      ),
  })
  const { marketplace, collectionAddress } = collectionRow
  const spender =
    marketplace.name === 'OpenSea'
      ? OPENSEA_CROSS_CHAIN_CONDUIT
      : marketplace.name === 'Rarible'
      ? process.env.REACT_APP_LOOKSRARE_MARKETPLACE_CONTRACT
      : marketplace.name === 'X2Y2'
      ? process.env.REACT_APP_X2Y2_TRANSFER_CONTRACT
      : looksRareAddress
  await approveCollection(spender ?? '', collectionAddress, signer, (newStatus: ListingStatus) =>
    updateStatus({
      listing: collectionRow,
      newStatus,
      rows: collectionsRequiringApproval,
      setRows: setCollectionsRequiringApproval as Dispatch<AssetRow[]>,
    })
  )
  if (collectionRow.status === ListingStatus.REJECTED || collectionRow.status === ListingStatus.FAILED) pauseAllRows()
}

export async function signListingRow(
  listing: ListingRow,
  listings: ListingRow[],
  setListings: Dispatch<ListingRow[]>,
  signer: JsonRpcSigner,
  provider: Web3Provider,
  getLooksRareNonce: () => number,
  setLooksRareNonce: (nonce: number) => void,
  pauseAllRows: () => void
) {
  const looksRareNonce = getLooksRareNonce()
  updateStatus({
    listing,
    newStatus: ListingStatus.SIGNING,
    rows: listings,
    setRows: setListings as Dispatch<AssetRow[]>,
    callback: () => {
      return signListingRow(
        listing,
        listings,
        setListings,
        signer,
        provider,
        getLooksRareNonce,
        setLooksRareNonce,
        pauseAllRows
      )
    },
  })
  const { asset, marketplace } = listing
  const res = await signListing(marketplace, asset, signer, provider, looksRareNonce, (newStatus: ListingStatus) =>
    updateStatus({
      listing,
      newStatus,
      rows: listings,
      setRows: setListings as Dispatch<AssetRow[]>,
    })
  )
  if (listing.status === ListingStatus.REJECTED) pauseAllRows()
  else {
    res && listing.marketplace.name === 'LooksRare' && setLooksRareNonce(looksRareNonce + 1)
    const newStatus = res ? ListingStatus.APPROVED : ListingStatus.FAILED
    updateStatus({
      listing,
      newStatus,
      rows: listings,
      setRows: setListings as Dispatch<AssetRow[]>,
    })
  }
}

export const getTotalEthValue = (sellAssets: WalletAsset[]) => {
  const total = sellAssets.reduce((total, asset: WalletAsset) => {
    if (asset.newListings?.length) {
      const maxListing = asset.newListings.reduce((a, b) => ((a.price ?? 0) > (b.price ?? 0) ? a : b))
      return (
        total +
        (maxListing.price ?? 0) -
        (maxListing.price ?? 0) * (maxListing.marketplace.fee / 100 + asset.creatorPercentage)
      )
    }
    return total
  }, 0)
  return total ? Math.round(total * 100 + Number.EPSILON) / 100 : 0
}

export const getListings = (sellAssets: WalletAsset[]): [CollectionRow[], ListingRow[]] => {
  const newCollectionsToApprove: CollectionRow[] = []

  const newListings: ListingRow[] = []
  sellAssets.forEach((asset) => {
    asset.marketplaces?.forEach((marketplace: ListingMarket) => {
      const newListing = {
        images: [asset.image_preview_url, marketplace.icon],
        name: asset.name || `#${asset.tokenId}`,
        status: ListingStatus.DEFINED,
        asset,
        marketplace,
      }
      newListings.push(newListing)
      if (
        !newCollectionsToApprove.some(
          (collectionRow: CollectionRow) =>
            collectionRow.collectionAddress === asset.asset_contract.address &&
            collectionRow.marketplace.name === marketplace.name
        )
      ) {
        const newCollectionRow = {
          images: [asset.asset_contract.image_url, marketplace.icon],
          name: asset.asset_contract.name,
          status: ListingStatus.DEFINED,
          collectionAddress: asset.asset_contract.address,
          marketplace,
        }
        newCollectionsToApprove.push(newCollectionRow)
      }
    })
  })
  return [newCollectionsToApprove, newListings]
}

export type ListingState = {
  allListingsPending: boolean
  allListingsDefined: boolean
  allListingsApproved: boolean
  allCollectionsPending: boolean
  allCollectionsDefined: boolean
  anyActiveSigning: boolean
  anyActiveFailures: boolean
  anyActiveRejections: boolean
  anyPaused: boolean
}

export const getListingState = (
  collectionsRequiringApproval: CollectionRow[],
  listings: ListingRow[]
): ListingState => {
  let allListingsPending = true
  let allListingsDefined = true
  let allListingsApproved = true
  let allCollectionsPending = true
  let allCollectionsDefined = true
  let anyActiveSigning = false
  let anyActiveFailures = false
  let anyActiveRejections = false
  let anyPaused = false

  if (collectionsRequiringApproval.length === 0) {
    allCollectionsDefined = allCollectionsPending = false
  }
  for (const collection of collectionsRequiringApproval) {
    if (collection.status !== ListingStatus.PENDING) allCollectionsPending = false
    if (collection.status !== ListingStatus.DEFINED) allCollectionsDefined = false
    if (collection.status === ListingStatus.SIGNING) anyActiveSigning = true
    else if (collection.status === ListingStatus.FAILED) anyActiveFailures = true
    else if (collection.status === ListingStatus.REJECTED) anyActiveRejections = true
    else if (collection.status === ListingStatus.PAUSED) anyPaused = true
  }

  if (listings.length === 0) {
    allListingsApproved = allListingsDefined = allListingsPending = false
  }
  for (const listing of listings) {
    if (listing.status !== ListingStatus.PENDING) allListingsPending = false
    if (listing.status !== ListingStatus.DEFINED) allListingsDefined = false
    if (listing.status !== ListingStatus.APPROVED) allListingsApproved = false
    if (listing.status === ListingStatus.SIGNING) anyActiveSigning = true
    else if (listing.status === ListingStatus.FAILED) anyActiveFailures = true
    else if (listing.status === ListingStatus.REJECTED) anyActiveRejections = true
    else if (listing.status === ListingStatus.PAUSED) anyPaused = true
  }
  return {
    allListingsPending,
    allListingsDefined,
    allListingsApproved,
    allCollectionsPending,
    allCollectionsDefined,
    anyActiveSigning,
    anyActiveFailures,
    anyActiveRejections,
    anyPaused,
  }
}

export const verifyStatus = (status: ListingStatus) => {
  return status !== ListingStatus.PAUSED && status !== ListingStatus.APPROVED
}

export const pauseRow = (row: AssetRow, rows: AssetRow[], setRows: Dispatch<AssetRow[]>) => {
  if (row.status === ListingStatus.PENDING || row.status === ListingStatus.DEFINED)
    updateStatus({
      listing: row,
      newStatus: ListingStatus.PAUSED,
      rows,
      setRows,
    })
}

export const resetRow = (row: AssetRow, rows: AssetRow[], setRows: Dispatch<AssetRow[]>) => {
  if (
    row.status === ListingStatus.PAUSED ||
    row.status === ListingStatus.FAILED ||
    row.status === ListingStatus.REJECTED
  )
    updateStatus({
      listing: row,
      newStatus: ListingStatus.DEFINED,
      rows,
      setRows,
    })
}

const createConsiderationItem = (basisPoints: string, recipient: string): ConsiderationInputItem => {
  return {
    amount: basisPoints,
    recipient,
  }
}

export const getConsiderationItems = (
  asset: WalletAsset,
  price: BigNumber,
  signerAddress: string
): {
  sellerFee: ConsiderationInputItem
  openseaFee: ConsiderationInputItem
  creatorFee?: ConsiderationInputItem
} => {
  const openSeaBasisPoints = OPENSEA_DEFAULT_FEE * INVERSE_BASIS_POINTS
  const creatorFeeBasisPoints = asset.creatorPercentage * INVERSE_BASIS_POINTS
  const sellerBasisPoints = INVERSE_BASIS_POINTS - openSeaBasisPoints - creatorFeeBasisPoints

  const openseaFee = price.mul(BigNumber.from(openSeaBasisPoints)).div(BigNumber.from(INVERSE_BASIS_POINTS)).toString()
  const creatorFee = price
    .mul(BigNumber.from(creatorFeeBasisPoints))
    .div(BigNumber.from(INVERSE_BASIS_POINTS))
    .toString()
  const sellerFee = price.mul(BigNumber.from(sellerBasisPoints)).div(BigNumber.from(INVERSE_BASIS_POINTS)).toString()

  return {
    sellerFee: createConsiderationItem(sellerFee, signerAddress),
    openseaFee: createConsiderationItem(openseaFee, OPENSEA_FEE_ADDRESS),
    creatorFee:
      creatorFeeBasisPoints > 0 ? createConsiderationItem(creatorFee, asset.asset_contract.payout_address) : undefined,
  }
}
