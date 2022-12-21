/**
 * @generated SignedSource<<7b28d0a8fd53402595e2d7cc5031b17a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment, RefetchableFragment } from 'relay-runtime';
export type Currency = "ETH" | "USD" | "%future added value";
export type NftMarketplace = "CRYPTOPUNKS" | "FOUNDATION" | "LOOKSRARE" | "NFT20" | "NFTX" | "OPENSEA" | "SUDOSWAP" | "X2Y2" | "%future added value";
export type NftRarityProvider = "RARITY_SNIPER" | "%future added value";
export type NftStandard = "ERC1155" | "ERC721" | "NONCOMPLIANT" | "%future added value";
export type OrderStatus = "CANCELLED" | "EXECUTED" | "EXPIRED" | "VALID" | "%future added value";
export type OrderType = "LISTING" | "OFFER" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type AssetQuery_nftAssets$data = {
  readonly nftAssets: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly animationUrl: string | null;
        readonly collection: {
          readonly creator: {
            readonly address: string;
            readonly isVerified: boolean | null;
            readonly profileImage: {
              readonly url: string;
            } | null;
          } | null;
          readonly image: {
            readonly url: string;
          } | null;
          readonly isVerified: boolean | null;
          readonly name: string | null;
          readonly nftContracts: ReadonlyArray<{
            readonly address: string;
            readonly standard: NftStandard | null;
          }> | null;
        } | null;
        readonly description: string | null;
        readonly id: string;
        readonly image: {
          readonly url: string;
        } | null;
        readonly listings: {
          readonly edges: ReadonlyArray<{
            readonly cursor: string;
            readonly node: {
              readonly address: string;
              readonly createdAt: number;
              readonly endAt: number | null;
              readonly id: string;
              readonly maker: string;
              readonly marketplace: NftMarketplace;
              readonly marketplaceUrl: string;
              readonly orderHash: string | null;
              readonly price: {
                readonly currency: Currency | null;
                readonly value: number;
              };
              readonly protocolParameters: any | null;
              readonly quantity: number;
              readonly startAt: number;
              readonly status: OrderStatus;
              readonly taker: string | null;
              readonly tokenId: string | null;
              readonly type: OrderType;
            };
          }>;
        } | null;
        readonly metadataUrl: string | null;
        readonly name: string | null;
        readonly originalImage: {
          readonly url: string;
        } | null;
        readonly ownerAddress: string | null;
        readonly rarities: ReadonlyArray<{
          readonly provider: NftRarityProvider | null;
          readonly rank: number | null;
          readonly score: number | null;
        }> | null;
        readonly smallImage: {
          readonly url: string;
        } | null;
        readonly suspiciousFlag: boolean | null;
        readonly tokenId: string;
      };
    }>;
    readonly totalCount: number | null;
  } | null;
  readonly " $fragmentType": "AssetQuery_nftAssets";
};
export type AssetQuery_nftAssets$key = {
  readonly " $data"?: AssetQuery_nftAssets$data;
  readonly " $fragmentSpreads": FragmentRefs<"AssetQuery_nftAssets">;
};

const node: ReaderFragment = (function(){
var v0 = [
  "nftAssets"
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "url",
    "storageKey": null
  }
],
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v3/*: any*/),
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenId",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
};
return {
  "argumentDefinitions": [
    {
      "kind": "RootArgument",
      "name": "address"
    },
    {
      "kind": "RootArgument",
      "name": "after"
    },
    {
      "kind": "RootArgument",
      "name": "asc"
    },
    {
      "kind": "RootArgument",
      "name": "before"
    },
    {
      "kind": "RootArgument",
      "name": "filter"
    },
    {
      "kind": "RootArgument",
      "name": "first"
    },
    {
      "kind": "RootArgument",
      "name": "last"
    },
    {
      "kind": "RootArgument",
      "name": "orderBy"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": null,
        "cursor": null,
        "direction": "bidirectional",
        "path": (v0/*: any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "first",
          "cursor": "after"
        },
        "backward": {
          "count": "last",
          "cursor": "before"
        },
        "path": (v0/*: any*/)
      },
      "fragmentPathInResult": [],
      "operation": require('./AssetPaginationQuery.graphql')
    }
  },
  "name": "AssetQuery_nftAssets",
  "selections": [
    {
      "alias": "nftAssets",
      "args": [
        {
          "kind": "Variable",
          "name": "address",
          "variableName": "address"
        },
        {
          "kind": "Variable",
          "name": "asc",
          "variableName": "asc"
        },
        {
          "kind": "Variable",
          "name": "filter",
          "variableName": "filter"
        },
        {
          "kind": "Variable",
          "name": "orderBy",
          "variableName": "orderBy"
        }
      ],
      "concreteType": "NftAssetConnection",
      "kind": "LinkedField",
      "name": "__AssetQuery_nftAssets_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "NftAssetEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "NftAsset",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                (v1/*: any*/),
                (v2/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "ownerAddress",
                  "storageKey": null
                },
                (v4/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "Image",
                  "kind": "LinkedField",
                  "name": "smallImage",
                  "plural": false,
                  "selections": (v3/*: any*/),
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "Image",
                  "kind": "LinkedField",
                  "name": "originalImage",
                  "plural": false,
                  "selections": (v3/*: any*/),
                  "storageKey": null
                },
                (v5/*: any*/),
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "description",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "animationUrl",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "suspiciousFlag",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "NftCollection",
                  "kind": "LinkedField",
                  "name": "collection",
                  "plural": false,
                  "selections": [
                    (v2/*: any*/),
                    (v6/*: any*/),
                    (v4/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "NftProfile",
                      "kind": "LinkedField",
                      "name": "creator",
                      "plural": false,
                      "selections": [
                        (v7/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "concreteType": "Image",
                          "kind": "LinkedField",
                          "name": "profileImage",
                          "plural": false,
                          "selections": (v3/*: any*/),
                          "storageKey": null
                        },
                        (v6/*: any*/)
                      ],
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "NftContract",
                      "kind": "LinkedField",
                      "name": "nftContracts",
                      "plural": true,
                      "selections": [
                        (v7/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "standard",
                          "storageKey": null
                        }
                      ],
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": [
                    {
                      "kind": "Literal",
                      "name": "first",
                      "value": 1
                    }
                  ],
                  "concreteType": "NftOrderConnection",
                  "kind": "LinkedField",
                  "name": "listings",
                  "plural": false,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "NftOrderEdge",
                      "kind": "LinkedField",
                      "name": "edges",
                      "plural": true,
                      "selections": [
                        {
                          "alias": null,
                          "args": null,
                          "concreteType": "NftOrder",
                          "kind": "LinkedField",
                          "name": "node",
                          "plural": false,
                          "selections": [
                            (v7/*: any*/),
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "createdAt",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "endAt",
                              "storageKey": null
                            },
                            (v1/*: any*/),
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "maker",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "marketplace",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "marketplaceUrl",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "orderHash",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "concreteType": "Amount",
                              "kind": "LinkedField",
                              "name": "price",
                              "plural": false,
                              "selections": [
                                {
                                  "alias": null,
                                  "args": null,
                                  "kind": "ScalarField",
                                  "name": "currency",
                                  "storageKey": null
                                },
                                {
                                  "alias": null,
                                  "args": null,
                                  "kind": "ScalarField",
                                  "name": "value",
                                  "storageKey": null
                                }
                              ],
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "quantity",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "startAt",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "status",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "taker",
                              "storageKey": null
                            },
                            (v5/*: any*/),
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "type",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "protocolParameters",
                              "storageKey": null
                            }
                          ],
                          "storageKey": null
                        },
                        (v8/*: any*/)
                      ],
                      "storageKey": null
                    }
                  ],
                  "storageKey": "listings(first:1)"
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "NftAssetRarity",
                  "kind": "LinkedField",
                  "name": "rarities",
                  "plural": true,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "provider",
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "rank",
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "score",
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "metadataUrl",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "__typename",
                  "storageKey": null
                }
              ],
              "storageKey": null
            },
            (v8/*: any*/)
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "totalCount",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "PageInfo",
          "kind": "LinkedField",
          "name": "pageInfo",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "endCursor",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "hasNextPage",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "hasPreviousPage",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "startCursor",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Query",
  "abstractKey": null
};
})();

(node as any).hash = "f6406d94b8b7549bb491fc4490cbc136";

export default node;
