export enum ReportAssetType {
  Token = 'Token',
  NFT = 'NFT',
}

export const ASSET_TO_REPORT_STRING = {
  [ReportAssetType.Token]: 'User reported as a spam token',
  [ReportAssetType.NFT]: 'User reported as a spam NFT',
}
