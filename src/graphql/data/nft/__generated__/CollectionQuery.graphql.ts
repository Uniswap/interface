/**
 * @generated SignedSource<<4cb65ade38e2fc5aba6816e5d790b8ee>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type NftMarketplace = "CRYPTOPUNKS" | "FOUNDATION" | "LOOKSRARE" | "NFT20" | "NFTX" | "OPENSEA" | "SUDOSWAP" | "X2Y2" | "%future added value";
export type NftStandard = "ERC1155" | "ERC721" | "NONCOMPLIANT" | "%future added value";
export type CollectionQuery$variables = {
  addresses: ReadonlyArray<string>;
};
export type CollectionQuery$data = {
  readonly nftCollections: {
    readonly edges: ReadonlyArray<{
      readonly cursor: string;
      readonly node: {
        readonly bannerImage: {
          readonly url: string;
        } | null;
        readonly collectionId: string;
        readonly description: string | null;
        readonly discordUrl: string | null;
        readonly homepageUrl: string | null;
        readonly image: {
          readonly url: string;
        } | null;
        readonly instagramName: string | null;
        readonly isVerified: boolean | null;
        readonly markets: ReadonlyArray<{
          readonly floorPrice: {
            readonly currency: Currency | null;
            readonly value: number;
          } | null;
          readonly floorPricePercentChange: {
            readonly currency: Currency | null;
            readonly value: number;
          } | null;
          readonly listings: {
            readonly value: number;
          } | null;
          readonly marketplaces: ReadonlyArray<{
            readonly floorPrice: number | null;
            readonly listings: number | null;
            readonly marketplace: NftMarketplace | null;
          }> | null;
          readonly owners: number | null;
          readonly totalVolume: {
            readonly currency: Currency | null;
            readonly value: number;
          } | null;
          readonly volume: {
            readonly currency: Currency | null;
            readonly value: number;
          } | null;
          readonly volumePercentChange: {
            readonly currency: Currency | null;
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
        readonly numAssets: number | null;
        readonly traits: ReadonlyArray<{
          readonly name: string | null;
          readonly stats: ReadonlyArray<{
            readonly assets: number | null;
            readonly listings: number | null;
            readonly name: string | null;
            readonly value: string | null;
          }> | null;
          readonly values: ReadonlyArray<string> | null;
        }> | null;
        readonly twitterName: string | null;
      };
    }>;
    readonly pageInfo: {
      readonly endCursor: string | null;
      readonly hasNextPage: boolean | null;
      readonly hasPreviousPage: boolean | null;
      readonly startCursor: string | null;
    };
  } | null;
};
export type CollectionQuery = {
  response: CollectionQuery$data;
  variables: CollectionQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "addresses"
  }
],
v1 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "addresses",
        "variableName": "addresses"
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
  "name": "cursor",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v4 = [
  (v3/*: any*/)
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "collectionId",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "discordUrl",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "homepageUrl",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "instagramName",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "numAssets",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "twitterName",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "standard",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalSupply",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "values",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "assets",
  "storageKey": null
},
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "listings",
  "storageKey": null
},
v23 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": "ETH"
  }
],
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "owners",
  "storageKey": null
},
v26 = [
  (v20/*: any*/),
  (v24/*: any*/)
],
v27 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v28 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "marketplace",
  "storageKey": null
},
v29 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "floorPrice",
  "storageKey": null
},
v30 = {
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
},
v31 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v32 = [
  (v3/*: any*/),
  (v31/*: any*/)
],
v33 = [
  (v20/*: any*/),
  (v24/*: any*/),
  (v31/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CollectionQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "NftCollectionConnection",
        "kind": "LinkedField",
        "name": "nftCollections",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "NftCollectionEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "NftCollection",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "bannerImage",
                    "plural": false,
                    "selections": (v4/*: any*/),
                    "storageKey": null
                  },
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "image",
                    "plural": false,
                    "selections": (v4/*: any*/),
                    "storageKey": null
                  },
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  (v12/*: any*/),
                  (v13/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContracts",
                    "plural": true,
                    "selections": [
                      (v14/*: any*/),
                      (v15/*: any*/),
                      (v11/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v18/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftCollectionTrait",
                    "kind": "LinkedField",
                    "name": "traits",
                    "plural": true,
                    "selections": [
                      (v11/*: any*/),
                      (v19/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftCollectionTraitStats",
                        "kind": "LinkedField",
                        "name": "stats",
                        "plural": true,
                        "selections": [
                          (v11/*: any*/),
                          (v20/*: any*/),
                          (v21/*: any*/),
                          (v22/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": (v23/*: any*/),
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
                          (v24/*: any*/),
                          (v20/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v25/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "totalVolume",
                        "plural": false,
                        "selections": (v26/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "listings",
                        "plural": false,
                        "selections": [
                          (v20/*: any*/)
                        ],
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v27/*: any*/),
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "volume",
                        "plural": false,
                        "selections": (v26/*: any*/),
                        "storageKey": "volume(duration:\"DAY\")"
                      },
                      {
                        "alias": null,
                        "args": (v27/*: any*/),
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "volumePercentChange",
                        "plural": false,
                        "selections": (v26/*: any*/),
                        "storageKey": "volumePercentChange(duration:\"DAY\")"
                      },
                      {
                        "alias": null,
                        "args": (v27/*: any*/),
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "floorPricePercentChange",
                        "plural": false,
                        "selections": (v26/*: any*/),
                        "storageKey": "floorPricePercentChange(duration:\"DAY\")"
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftCollectionMarketplace",
                        "kind": "LinkedField",
                        "name": "marketplaces",
                        "plural": true,
                        "selections": [
                          (v28/*: any*/),
                          (v22/*: any*/),
                          (v29/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": "markets(currencies:\"ETH\")"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v30/*: any*/)
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
    "name": "CollectionQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "NftCollectionConnection",
        "kind": "LinkedField",
        "name": "nftCollections",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "NftCollectionEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "NftCollection",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "bannerImage",
                    "plural": false,
                    "selections": (v32/*: any*/),
                    "storageKey": null
                  },
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "image",
                    "plural": false,
                    "selections": (v32/*: any*/),
                    "storageKey": null
                  },
                  (v9/*: any*/),
                  (v10/*: any*/),
                  (v11/*: any*/),
                  (v12/*: any*/),
                  (v13/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContracts",
                    "plural": true,
                    "selections": [
                      (v14/*: any*/),
                      (v15/*: any*/),
                      (v11/*: any*/),
                      (v16/*: any*/),
                      (v17/*: any*/),
                      (v18/*: any*/),
                      (v31/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftCollectionTrait",
                    "kind": "LinkedField",
                    "name": "traits",
                    "plural": true,
                    "selections": [
                      (v11/*: any*/),
                      (v19/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftCollectionTraitStats",
                        "kind": "LinkedField",
                        "name": "stats",
                        "plural": true,
                        "selections": [
                          (v11/*: any*/),
                          (v20/*: any*/),
                          (v21/*: any*/),
                          (v22/*: any*/),
                          (v31/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v31/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": (v23/*: any*/),
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
                          (v24/*: any*/),
                          (v20/*: any*/),
                          (v31/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v25/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "totalVolume",
                        "plural": false,
                        "selections": (v33/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "listings",
                        "plural": false,
                        "selections": [
                          (v20/*: any*/),
                          (v31/*: any*/)
                        ],
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": (v27/*: any*/),
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "volume",
                        "plural": false,
                        "selections": (v33/*: any*/),
                        "storageKey": "volume(duration:\"DAY\")"
                      },
                      {
                        "alias": null,
                        "args": (v27/*: any*/),
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "volumePercentChange",
                        "plural": false,
                        "selections": (v33/*: any*/),
                        "storageKey": "volumePercentChange(duration:\"DAY\")"
                      },
                      {
                        "alias": null,
                        "args": (v27/*: any*/),
                        "concreteType": "TimestampedAmount",
                        "kind": "LinkedField",
                        "name": "floorPricePercentChange",
                        "plural": false,
                        "selections": (v33/*: any*/),
                        "storageKey": "floorPricePercentChange(duration:\"DAY\")"
                      },
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftCollectionMarketplace",
                        "kind": "LinkedField",
                        "name": "marketplaces",
                        "plural": true,
                        "selections": [
                          (v28/*: any*/),
                          (v22/*: any*/),
                          (v29/*: any*/),
                          (v31/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v31/*: any*/)
                    ],
                    "storageKey": "markets(currencies:\"ETH\")"
                  },
                  (v31/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          (v30/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "c86c5cc75669b51469ee70eb1759b687",
    "id": null,
    "metadata": {},
    "name": "CollectionQuery",
    "operationKind": "query",
    "text": "query CollectionQuery(\n  $addresses: [String!]!\n) {\n  nftCollections(filter: {addresses: $addresses}) {\n    edges {\n      cursor\n      node {\n        bannerImage {\n          url\n          id\n        }\n        collectionId\n        description\n        discordUrl\n        homepageUrl\n        image {\n          url\n          id\n        }\n        instagramName\n        isVerified\n        name\n        numAssets\n        twitterName\n        nftContracts {\n          address\n          chain\n          name\n          standard\n          symbol\n          totalSupply\n          id\n        }\n        traits {\n          name\n          values\n          stats {\n            name\n            value\n            assets\n            listings\n            id\n          }\n          id\n        }\n        markets(currencies: ETH) {\n          floorPrice {\n            currency\n            value\n            id\n          }\n          owners\n          totalVolume {\n            value\n            currency\n            id\n          }\n          listings {\n            value\n            id\n          }\n          volume(duration: DAY) {\n            value\n            currency\n            id\n          }\n          volumePercentChange(duration: DAY) {\n            value\n            currency\n            id\n          }\n          floorPricePercentChange(duration: DAY) {\n            value\n            currency\n            id\n          }\n          marketplaces {\n            marketplace\n            listings\n            floorPrice\n            id\n          }\n          id\n        }\n        id\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "4c0e5aa05e2013b0902d0b7f22c18f0b";

export default node;
