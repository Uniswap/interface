/**
 * @generated SignedSource<<f1d9d0efa29d928ab3a010ea404844e6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment, RefetchableFragment } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type NftMarketplace = "CRYPTOPUNKS" | "FOUNDATION" | "LOOKSRARE" | "NFT20" | "NFTX" | "OPENSEA" | "SUDOSWAP" | "X2Y2" | "%future added value";
export type NftStandard = "ERC1155" | "ERC721" | "NONCOMPLIANT" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type NftBalanceQuery_nftBalances$data = {
  readonly nftBalances: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly lastPrice: {
          readonly currency: Currency | null;
          readonly timestamp: number;
          readonly value: number;
        } | null;
        readonly listedMarketplaces: ReadonlyArray<NftMarketplace> | null;
        readonly listingFees: ReadonlyArray<{
          readonly basisPoints: number;
          readonly payoutAddress: string;
        } | null> | null;
        readonly ownedAsset: {
          readonly animationUrl: string | null;
          readonly collection: {
            readonly image: {
              readonly url: string;
            } | null;
            readonly isVerified: boolean | null;
            readonly markets: ReadonlyArray<{
              readonly floorPrice: {
                readonly value: number;
              } | null;
            }> | null;
            readonly name: string | null;
            readonly nftContracts: ReadonlyArray<{
              readonly address: string;
              readonly chain: Chain;
              readonly name: string | null;
              readonly standard: NftStandard | null;
              readonly symbol: string | null;
              readonly totalSupply: number | null;
            }> | null;
          } | null;
          readonly description: string | null;
          readonly flaggedBy: string | null;
          readonly id: string;
          readonly image: {
            readonly url: string;
          } | null;
          readonly listings: {
            readonly edges: ReadonlyArray<{
              readonly node: {
                readonly createdAt: number;
                readonly endAt: number | null;
                readonly marketplace: NftMarketplace;
                readonly price: {
                  readonly currency: Currency | null;
                  readonly value: number;
                };
              };
            }>;
          } | null;
          readonly name: string | null;
          readonly originalImage: {
            readonly url: string;
          } | null;
          readonly ownerAddress: string | null;
          readonly smallImage: {
            readonly url: string;
          } | null;
          readonly suspiciousFlag: boolean | null;
          readonly thumbnail: {
            readonly url: string;
          } | null;
          readonly tokenId: string;
        } | null;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean | null;
      readonly hasPreviousPage: boolean | null;
      readonly startCursor: string | null;
    };
  } | null;
  readonly " $fragmentType": "NftBalanceQuery_nftBalances";
};
export type NftBalanceQuery_nftBalances$key = {
  readonly " $data"?: NftBalanceQuery_nftBalances$data;
  readonly " $fragmentSpreads": FragmentRefs<"NftBalanceQuery_nftBalances">;
};

const node: ReaderFragment = (function(){
var v0 = [
  "nftBalances"
],
v1 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "url",
    "storageKey": null
  }
],
v2 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v1/*: any*/),
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
};
return {
  "argumentDefinitions": [
    {
      "kind": "RootArgument",
      "name": "after"
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
      "name": "ownerAddress"
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
      "operation": require('./NftBalancePaginationQuery.graphql')
    }
  },
  "name": "NftBalanceQuery_nftBalances",
  "selections": [
    {
      "alias": "nftBalances",
      "args": [
        {
          "kind": "Variable",
          "name": "filter",
          "variableName": "filter"
        },
        {
          "kind": "Variable",
          "name": "ownerAddress",
          "variableName": "ownerAddress"
        }
      ],
      "concreteType": "NftBalanceConnection",
      "kind": "LinkedField",
      "name": "__NftBalanceQuery_nftBalances_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "NftBalanceEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "NftBalance",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "NftAsset",
                  "kind": "LinkedField",
                  "name": "ownedAsset",
                  "plural": false,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "id",
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
                      "concreteType": "NftCollection",
                      "kind": "LinkedField",
                      "name": "collection",
                      "plural": false,
                      "selections": [
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "isVerified",
                          "storageKey": null
                        },
                        (v2/*: any*/),
                        (v3/*: any*/),
                        {
                          "alias": null,
                          "args": null,
                          "concreteType": "NftContract",
                          "kind": "LinkedField",
                          "name": "nftContracts",
                          "plural": true,
                          "selections": [
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "address",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "chain",
                              "storageKey": null
                            },
                            (v3/*: any*/),
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "standard",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "symbol",
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "kind": "ScalarField",
                              "name": "totalSupply",
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
                              "name": "currencies",
                              "value": "ETH"
                            }
                          ],
                          "concreteType": "NftCollectionMarket",
                          "kind": "LinkedField",
                          "name": "markets",
                          "plural": true,
                          "selections": [
                            {
                              "alias": null,
                              "args": null,
                              "concreteType": "TimestampedAmount",
                              "kind": "LinkedField",
                              "name": "floorPrice",
                              "plural": false,
                              "selections": [
                                (v4/*: any*/)
                              ],
                              "storageKey": null
                            }
                          ],
                          "storageKey": "markets(currencies:\"ETH\")"
                        }
                      ],
                      "storageKey": null
                    },
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
                      "name": "flaggedBy",
                      "storageKey": null
                    },
                    (v2/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "Image",
                      "kind": "LinkedField",
                      "name": "originalImage",
                      "plural": false,
                      "selections": (v1/*: any*/),
                      "storageKey": null
                    },
                    (v3/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "ownerAddress",
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "Image",
                      "kind": "LinkedField",
                      "name": "smallImage",
                      "plural": false,
                      "selections": (v1/*: any*/),
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
                      "kind": "ScalarField",
                      "name": "tokenId",
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "Image",
                      "kind": "LinkedField",
                      "name": "thumbnail",
                      "plural": false,
                      "selections": (v1/*: any*/),
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
                                {
                                  "alias": null,
                                  "args": null,
                                  "concreteType": "Amount",
                                  "kind": "LinkedField",
                                  "name": "price",
                                  "plural": false,
                                  "selections": [
                                    (v4/*: any*/),
                                    (v5/*: any*/)
                                  ],
                                  "storageKey": null
                                },
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
                                  "name": "marketplace",
                                  "storageKey": null
                                },
                                {
                                  "alias": null,
                                  "args": null,
                                  "kind": "ScalarField",
                                  "name": "endAt",
                                  "storageKey": null
                                }
                              ],
                              "storageKey": null
                            }
                          ],
                          "storageKey": null
                        }
                      ],
                      "storageKey": "listings(first:1)"
                    }
                  ],
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "listedMarketplaces",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "NftFee",
                  "kind": "LinkedField",
                  "name": "listingFees",
                  "plural": true,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "payoutAddress",
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "basisPoints",
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "TimestampedAmount",
                  "kind": "LinkedField",
                  "name": "lastPrice",
                  "plural": false,
                  "selections": [
                    (v5/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "timestamp",
                      "storageKey": null
                    },
                    (v4/*: any*/)
                  ],
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
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "cursor",
              "storageKey": null
            }
          ],
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

(node as any).hash = "51ba85a72e5973ac0faad0e8d2c4b681";

export default node;
