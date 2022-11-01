/**
 * @generated SignedSource<<f8d0f35ebe8f40789cabfd492b0ff579>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type NftStandard = "ERC1155" | "ERC721" | "NONCOMPLIANT" | "%future added value";
export type hooksNftQuery$variables = {
  ownerAddress: string;
};
export type hooksNftQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly nftBalances: ReadonlyArray<{
      readonly ownedAsset: {
        readonly collection: {
          readonly collectionId: string;
          readonly description: string | null;
          readonly image: {
            readonly url: string;
          } | null;
          readonly isVerified: boolean | null;
          readonly markets: ReadonlyArray<{
            readonly floorPrice: {
              readonly value: number;
            } | null;
            readonly owners: number | null;
            readonly totalVolume: {
              readonly value: number;
            } | null;
            readonly volume24h: {
              readonly value: number;
            } | null;
          }> | null;
          readonly name: string | null;
          readonly numAssets: number | null;
        };
        readonly creator: {
          readonly address: string;
          readonly username: string | null;
        } | null;
        readonly description: string | null;
        readonly image: {
          readonly url: string;
        } | null;
        readonly name: string | null;
        readonly nftContract: {
          readonly address: string;
          readonly chain: Chain;
          readonly standard: NftStandard | null;
        };
        readonly thumbnail: {
          readonly url: string;
        } | null;
        readonly tokenId: string;
      } | null;
    } | null> | null;
  } | null> | null;
};
export type hooksNftQuery = {
  response: hooksNftQuery$data;
  variables: hooksNftQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "ownerAddress"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "ownerAddresses.0",
        "variableName": "ownerAddress"
      }
    ],
    "kind": "ListValue",
    "name": "ownerAddresses"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "collectionId",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
  "storageKey": null
},
v5 = [
  (v4/*: any*/)
],
v6 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v5/*: any*/),
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "numAssets",
  "storageKey": null
},
v10 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": [
      "USD"
    ]
  }
],
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v12 = [
  (v11/*: any*/)
],
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "owners",
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
  "name": "tokenId",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "username",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v20 = [
  (v4/*: any*/),
  (v19/*: any*/)
],
v21 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v20/*: any*/),
  "storageKey": null
},
v22 = [
  (v11/*: any*/),
  (v19/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "hooksNftQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "NftBalance",
            "kind": "LinkedField",
            "name": "nftBalances",
            "plural": true,
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
                    "kind": "RequiredField",
                    "field": {
                      "alias": null,
                      "args": null,
                      "concreteType": "NftCollection",
                      "kind": "LinkedField",
                      "name": "collection",
                      "plural": false,
                      "selections": [
                        {
                          "kind": "RequiredField",
                          "field": (v2/*: any*/),
                          "action": "LOG",
                          "path": "portfolios.nftBalances.ownedAsset.collection.collectionId"
                        },
                        (v3/*: any*/),
                        (v6/*: any*/),
                        (v7/*: any*/),
                        (v8/*: any*/),
                        (v9/*: any*/),
                        {
                          "alias": null,
                          "args": (v10/*: any*/),
                          "concreteType": "NftCollectionMarket",
                          "kind": "LinkedField",
                          "name": "markets",
                          "plural": true,
                          "selections": [
                            {
                              "alias": null,
                              "args": null,
                              "concreteType": "Amount",
                              "kind": "LinkedField",
                              "name": "floorPrice",
                              "plural": false,
                              "selections": (v12/*: any*/),
                              "storageKey": null
                            },
                            (v13/*: any*/),
                            {
                              "alias": null,
                              "args": null,
                              "concreteType": "Amount",
                              "kind": "LinkedField",
                              "name": "volume24h",
                              "plural": false,
                              "selections": (v12/*: any*/),
                              "storageKey": null
                            },
                            {
                              "alias": null,
                              "args": null,
                              "concreteType": "Amount",
                              "kind": "LinkedField",
                              "name": "totalVolume",
                              "plural": false,
                              "selections": (v12/*: any*/),
                              "storageKey": null
                            }
                          ],
                          "storageKey": "markets(currencies:[\"USD\"])"
                        }
                      ],
                      "storageKey": null
                    },
                    "action": "LOG",
                    "path": "portfolios.nftBalances.ownedAsset.collection"
                  },
                  (v3/*: any*/),
                  (v6/*: any*/),
                  (v8/*: any*/),
                  {
                    "kind": "RequiredField",
                    "field": {
                      "alias": null,
                      "args": null,
                      "concreteType": "NftContract",
                      "kind": "LinkedField",
                      "name": "nftContract",
                      "plural": false,
                      "selections": [
                        {
                          "kind": "RequiredField",
                          "field": (v14/*: any*/),
                          "action": "LOG",
                          "path": "portfolios.nftBalances.ownedAsset.nftContract.address"
                        },
                        {
                          "kind": "RequiredField",
                          "field": (v15/*: any*/),
                          "action": "LOG",
                          "path": "portfolios.nftBalances.ownedAsset.nftContract.chain"
                        },
                        (v16/*: any*/)
                      ],
                      "storageKey": null
                    },
                    "action": "LOG",
                    "path": "portfolios.nftBalances.ownedAsset.nftContract"
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "thumbnail",
                    "plural": false,
                    "selections": (v5/*: any*/),
                    "storageKey": null
                  },
                  {
                    "kind": "RequiredField",
                    "field": (v17/*: any*/),
                    "action": "LOG",
                    "path": "portfolios.nftBalances.ownedAsset.tokenId"
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftProfile",
                    "kind": "LinkedField",
                    "name": "creator",
                    "plural": false,
                    "selections": [
                      (v14/*: any*/),
                      (v18/*: any*/)
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
    "name": "hooksNftQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "NftBalance",
            "kind": "LinkedField",
            "name": "nftBalances",
            "plural": true,
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
                    "concreteType": "NftCollection",
                    "kind": "LinkedField",
                    "name": "collection",
                    "plural": false,
                    "selections": [
                      (v2/*: any*/),
                      (v3/*: any*/),
                      (v21/*: any*/),
                      (v7/*: any*/),
                      (v8/*: any*/),
                      (v9/*: any*/),
                      {
                        "alias": null,
                        "args": (v10/*: any*/),
                        "concreteType": "NftCollectionMarket",
                        "kind": "LinkedField",
                        "name": "markets",
                        "plural": true,
                        "selections": [
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Amount",
                            "kind": "LinkedField",
                            "name": "floorPrice",
                            "plural": false,
                            "selections": (v22/*: any*/),
                            "storageKey": null
                          },
                          (v13/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Amount",
                            "kind": "LinkedField",
                            "name": "volume24h",
                            "plural": false,
                            "selections": (v22/*: any*/),
                            "storageKey": null
                          },
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Amount",
                            "kind": "LinkedField",
                            "name": "totalVolume",
                            "plural": false,
                            "selections": (v22/*: any*/),
                            "storageKey": null
                          },
                          (v19/*: any*/)
                        ],
                        "storageKey": "markets(currencies:[\"USD\"])"
                      },
                      (v19/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v3/*: any*/),
                  (v21/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContract",
                    "plural": false,
                    "selections": [
                      (v14/*: any*/),
                      (v15/*: any*/),
                      (v16/*: any*/),
                      (v19/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "thumbnail",
                    "plural": false,
                    "selections": (v20/*: any*/),
                    "storageKey": null
                  },
                  (v17/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftProfile",
                    "kind": "LinkedField",
                    "name": "creator",
                    "plural": false,
                    "selections": [
                      (v14/*: any*/),
                      (v18/*: any*/),
                      (v19/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v19/*: any*/)
                ],
                "storageKey": null
              },
              (v19/*: any*/)
            ],
            "storageKey": null
          },
          (v19/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "cca1610fd1a3cdd42bf3139fb49e9f1d",
    "id": null,
    "metadata": {},
    "name": "hooksNftQuery",
    "operationKind": "query",
    "text": "query hooksNftQuery(\n  $ownerAddress: String!\n) {\n  portfolios(ownerAddresses: [$ownerAddress]) {\n    nftBalances {\n      ownedAsset {\n        collection {\n          collectionId\n          description\n          image {\n            url\n            id\n          }\n          isVerified\n          name\n          numAssets\n          markets(currencies: [USD]) {\n            floorPrice {\n              value\n              id\n            }\n            owners\n            volume24h {\n              value\n              id\n            }\n            totalVolume {\n              value\n              id\n            }\n            id\n          }\n          id\n        }\n        description\n        image {\n          url\n          id\n        }\n        name\n        nftContract {\n          address\n          chain\n          standard\n          id\n        }\n        thumbnail {\n          url\n          id\n        }\n        tokenId\n        creator {\n          address\n          username\n          id\n        }\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "5dd77b10b0b825cff247d991e021517a";

export default node;
