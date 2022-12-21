/**
 * @generated SignedSource<<01b647acd67b05a56bd26fe0b8e46d8a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Currency = "ETH" | "USD" | "%future added value";
export type NftMarketplace = "CRYPTOPUNKS" | "FOUNDATION" | "LOOKSRARE" | "NFT20" | "NFTX" | "OPENSEA" | "SUDOSWAP" | "X2Y2" | "%future added value";
export type NftRarityProvider = "RARITY_SNIPER" | "%future added value";
export type NftStandard = "ERC1155" | "ERC721" | "NONCOMPLIANT" | "%future added value";
export type OrderStatus = "CANCELLED" | "EXECUTED" | "EXPIRED" | "VALID" | "%future added value";
export type OrderType = "LISTING" | "OFFER" | "%future added value";
export type DetailsQuery$variables = {
  address: string;
  tokenId: string;
};
export type DetailsQuery$data = {
  readonly nftAssets: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly animationUrl: string | null;
        readonly collection: {
          readonly description: string | null;
          readonly discordUrl: string | null;
          readonly homepageUrl: string | null;
          readonly image: {
            readonly url: string;
          } | null;
          readonly isVerified: boolean | null;
          readonly name: string | null;
          readonly nftContracts: ReadonlyArray<{
            readonly address: string;
            readonly standard: NftStandard | null;
          }> | null;
          readonly numAssets: number | null;
          readonly twitterName: string | null;
        } | null;
        readonly creator: {
          readonly address: string;
          readonly isVerified: boolean | null;
          readonly profileImage: {
            readonly url: string;
          } | null;
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
        readonly traits: ReadonlyArray<{
          readonly name: string | null;
          readonly value: string | null;
        }> | null;
      };
    }>;
  } | null;
};
export type DetailsQuery = {
  response: DetailsQuery$data;
  variables: DetailsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "address"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "tokenId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "address",
    "variableName": "address"
  },
  {
    "fields": [
      {
        "kind": "Literal",
        "name": "listed",
        "value": false
      },
      {
        "items": [
          {
            "kind": "Variable",
            "name": "tokenIds.0",
            "variableName": "tokenId"
          }
        ],
        "kind": "ListValue",
        "name": "tokenIds"
      }
    ],
    "kind": "ObjectValue",
    "name": "filter"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
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
  "name": "ownerAddress",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v6 = [
  (v5/*: any*/)
],
v7 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v6/*: any*/),
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenId",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "animationUrl",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "suspiciousFlag",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "numAssets",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "twitterName",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "discordUrl",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "homepageUrl",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "standard",
  "storageKey": null
},
v19 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
],
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "endAt",
  "storageKey": null
},
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "maker",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "marketplace",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "marketplaceUrl",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "orderHash",
  "storageKey": null
},
v26 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v27 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v28 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "quantity",
  "storageKey": null
},
v29 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "startAt",
  "storageKey": null
},
v30 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v31 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "taker",
  "storageKey": null
},
v32 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "type",
  "storageKey": null
},
v33 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "protocolParameters",
  "storageKey": null
},
v34 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v35 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "provider",
  "storageKey": null
},
v36 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "rank",
  "storageKey": null
},
v37 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "score",
  "storageKey": null
},
v38 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "metadataUrl",
  "storageKey": null
},
v39 = [
  (v5/*: any*/),
  (v2/*: any*/)
],
v40 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v39/*: any*/),
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "DetailsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "NftAssetConnection",
        "kind": "LinkedField",
        "name": "nftAssets",
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
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v7/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "smallImage",
                    "plural": false,
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "originalImage",
                    "plural": false,
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  },
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftProfile",
                    "kind": "LinkedField",
                    "name": "creator",
                    "plural": false,
                    "selections": [
                      (v12/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Image",
                        "kind": "LinkedField",
                        "name": "profileImage",
                        "plural": false,
                        "selections": (v6/*: any*/),
                        "storageKey": null
                      },
                      (v13/*: any*/)
                    ],
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
                      (v3/*: any*/),
                      (v13/*: any*/),
                      (v14/*: any*/),
                      (v15/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v7/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftContract",
                        "kind": "LinkedField",
                        "name": "nftContracts",
                        "plural": true,
                        "selections": [
                          (v12/*: any*/),
                          (v18/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v9/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": (v19/*: any*/),
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
                              (v12/*: any*/),
                              (v20/*: any*/),
                              (v21/*: any*/),
                              (v2/*: any*/),
                              (v22/*: any*/),
                              (v23/*: any*/),
                              (v24/*: any*/),
                              (v25/*: any*/),
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": "Amount",
                                "kind": "LinkedField",
                                "name": "price",
                                "plural": false,
                                "selections": [
                                  (v26/*: any*/),
                                  (v27/*: any*/)
                                ],
                                "storageKey": null
                              },
                              (v28/*: any*/),
                              (v29/*: any*/),
                              (v30/*: any*/),
                              (v31/*: any*/),
                              (v8/*: any*/),
                              (v32/*: any*/),
                              (v33/*: any*/)
                            ],
                            "storageKey": null
                          },
                          (v34/*: any*/)
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
                      (v35/*: any*/),
                      (v36/*: any*/),
                      (v37/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v38/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftAssetTrait",
                    "kind": "LinkedField",
                    "name": "traits",
                    "plural": true,
                    "selections": [
                      (v3/*: any*/),
                      (v27/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
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
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DetailsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "NftAssetConnection",
        "kind": "LinkedField",
        "name": "nftAssets",
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
                  (v2/*: any*/),
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v40/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "smallImage",
                    "plural": false,
                    "selections": (v39/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "originalImage",
                    "plural": false,
                    "selections": (v39/*: any*/),
                    "storageKey": null
                  },
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftProfile",
                    "kind": "LinkedField",
                    "name": "creator",
                    "plural": false,
                    "selections": [
                      (v12/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "Image",
                        "kind": "LinkedField",
                        "name": "profileImage",
                        "plural": false,
                        "selections": (v39/*: any*/),
                        "storageKey": null
                      },
                      (v13/*: any*/),
                      (v2/*: any*/)
                    ],
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
                      (v3/*: any*/),
                      (v13/*: any*/),
                      (v14/*: any*/),
                      (v15/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v40/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftContract",
                        "kind": "LinkedField",
                        "name": "nftContracts",
                        "plural": true,
                        "selections": [
                          (v12/*: any*/),
                          (v18/*: any*/),
                          (v2/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v9/*: any*/),
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": (v19/*: any*/),
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
                              (v12/*: any*/),
                              (v20/*: any*/),
                              (v21/*: any*/),
                              (v2/*: any*/),
                              (v22/*: any*/),
                              (v23/*: any*/),
                              (v24/*: any*/),
                              (v25/*: any*/),
                              {
                                "alias": null,
                                "args": null,
                                "concreteType": "Amount",
                                "kind": "LinkedField",
                                "name": "price",
                                "plural": false,
                                "selections": [
                                  (v26/*: any*/),
                                  (v27/*: any*/),
                                  (v2/*: any*/)
                                ],
                                "storageKey": null
                              },
                              (v28/*: any*/),
                              (v29/*: any*/),
                              (v30/*: any*/),
                              (v31/*: any*/),
                              (v8/*: any*/),
                              (v32/*: any*/),
                              (v33/*: any*/)
                            ],
                            "storageKey": null
                          },
                          (v34/*: any*/)
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
                      (v35/*: any*/),
                      (v36/*: any*/),
                      (v37/*: any*/),
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v38/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftAssetTrait",
                    "kind": "LinkedField",
                    "name": "traits",
                    "plural": true,
                    "selections": [
                      (v3/*: any*/),
                      (v27/*: any*/),
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "614aec51be138a694322837c39c2b19a",
    "id": null,
    "metadata": {},
    "name": "DetailsQuery",
    "operationKind": "query",
    "text": "query DetailsQuery(\n  $address: String!\n  $tokenId: String!\n) {\n  nftAssets(address: $address, filter: {listed: false, tokenIds: [$tokenId]}) {\n    edges {\n      node {\n        id\n        name\n        ownerAddress\n        image {\n          url\n          id\n        }\n        smallImage {\n          url\n          id\n        }\n        originalImage {\n          url\n          id\n        }\n        tokenId\n        description\n        animationUrl\n        suspiciousFlag\n        creator {\n          address\n          profileImage {\n            url\n            id\n          }\n          isVerified\n          id\n        }\n        collection {\n          name\n          isVerified\n          numAssets\n          twitterName\n          discordUrl\n          homepageUrl\n          image {\n            url\n            id\n          }\n          nftContracts {\n            address\n            standard\n            id\n          }\n          description\n          id\n        }\n        listings(first: 1) {\n          edges {\n            node {\n              address\n              createdAt\n              endAt\n              id\n              maker\n              marketplace\n              marketplaceUrl\n              orderHash\n              price {\n                currency\n                value\n                id\n              }\n              quantity\n              startAt\n              status\n              taker\n              tokenId\n              type\n              protocolParameters\n            }\n            cursor\n          }\n        }\n        rarities {\n          provider\n          rank\n          score\n          id\n        }\n        metadataUrl\n        traits {\n          name\n          value\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "71907572f7abd6bed7fde358e2b81be0";

export default node;
