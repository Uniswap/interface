/**
 * @generated SignedSource<<60585ea3d2381886b33facb1f93e3f59>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type NftAssetSortableField = "PRICE" | "RARITY" | "%future added value";
export type NftMarketplace = "CRYPTOPUNKS" | "FOUNDATION" | "LOOKSRARE" | "NFT20" | "NFTX" | "OPENSEA" | "SUDOSWAP" | "X2Y2" | "%future added value";
export type NftAssetsFilterInput = {
  listed?: boolean | null;
  marketplaces?: ReadonlyArray<NftMarketplace> | null;
  maxPrice?: string | null;
  minPrice?: string | null;
  tokenIds?: ReadonlyArray<string> | null;
  tokenSearchQuery?: string | null;
  traits?: ReadonlyArray<NftAssetTraitInput> | null;
};
export type NftAssetTraitInput = {
  name: string;
  values: ReadonlyArray<string>;
};
export type AssetQuery$variables = {
  address: string;
  after?: string | null;
  asc?: boolean | null;
  before?: string | null;
  filter?: NftAssetsFilterInput | null;
  first?: number | null;
  last?: number | null;
  orderBy?: NftAssetSortableField | null;
};
export type AssetQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"AssetQuery_nftAssets">;
};
export type AssetQuery = {
  response: AssetQuery$data;
  variables: AssetQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "address"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "after"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "asc"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "before"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "filter"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v6 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "last"
},
v7 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "orderBy"
},
v8 = [
  {
    "kind": "Variable",
    "name": "address",
    "variableName": "address"
  },
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Variable",
    "name": "asc",
    "variableName": "asc"
  },
  {
    "kind": "Variable",
    "name": "before",
    "variableName": "before"
  },
  {
    "kind": "Variable",
    "name": "filter",
    "variableName": "filter"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  },
  {
    "kind": "Variable",
    "name": "last",
    "variableName": "last"
  },
  {
    "kind": "Variable",
    "name": "orderBy",
    "variableName": "orderBy"
  }
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v11 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "url",
    "storageKey": null
  },
  (v9/*: any*/)
],
v12 = {
  "alias": null,
  "args": null,
  "concreteType": "Image",
  "kind": "LinkedField",
  "name": "image",
  "plural": false,
  "selections": (v11/*: any*/),
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenId",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "AssetQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "AssetQuery_nftAssets"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v7/*: any*/),
      (v2/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      (v1/*: any*/),
      (v6/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Operation",
    "name": "AssetQuery",
    "selections": [
      {
        "alias": null,
        "args": (v8/*: any*/),
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
                  (v9/*: any*/),
                  (v10/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "ownerAddress",
                    "storageKey": null
                  },
                  (v12/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "smallImage",
                    "plural": false,
                    "selections": (v11/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "originalImage",
                    "plural": false,
                    "selections": (v11/*: any*/),
                    "storageKey": null
                  },
                  (v13/*: any*/),
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
                      (v10/*: any*/),
                      (v14/*: any*/),
                      (v12/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftProfile",
                        "kind": "LinkedField",
                        "name": "creator",
                        "plural": false,
                        "selections": [
                          (v15/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Image",
                            "kind": "LinkedField",
                            "name": "profileImage",
                            "plural": false,
                            "selections": (v11/*: any*/),
                            "storageKey": null
                          },
                          (v14/*: any*/),
                          (v9/*: any*/)
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
                          (v15/*: any*/),
                          {
                            "alias": null,
                            "args": null,
                            "kind": "ScalarField",
                            "name": "standard",
                            "storageKey": null
                          },
                          (v9/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v9/*: any*/)
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
                              (v15/*: any*/),
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
                              (v9/*: any*/),
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
                                  },
                                  (v9/*: any*/)
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
                              (v13/*: any*/),
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
                          (v16/*: any*/)
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
                      },
                      (v9/*: any*/)
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
              (v16/*: any*/)
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
      },
      {
        "alias": null,
        "args": (v8/*: any*/),
        "filters": [
          "address",
          "orderBy",
          "asc",
          "filter"
        ],
        "handle": "connection",
        "key": "AssetQuery_nftAssets",
        "kind": "LinkedHandle",
        "name": "nftAssets"
      }
    ]
  },
  "params": {
    "cacheID": "8e5edc9cf886fdfa82b8ad8ea0117f2c",
    "id": null,
    "metadata": {},
    "name": "AssetQuery",
    "operationKind": "query",
    "text": "query AssetQuery(\n  $address: String!\n  $orderBy: NftAssetSortableField\n  $asc: Boolean\n  $filter: NftAssetsFilterInput\n  $first: Int\n  $after: String\n  $last: Int\n  $before: String\n) {\n  ...AssetQuery_nftAssets\n}\n\nfragment AssetQuery_nftAssets on Query {\n  nftAssets(address: $address, orderBy: $orderBy, asc: $asc, filter: $filter, first: $first, after: $after, last: $last, before: $before) {\n    edges {\n      node {\n        id\n        name\n        ownerAddress\n        image {\n          url\n          id\n        }\n        smallImage {\n          url\n          id\n        }\n        originalImage {\n          url\n          id\n        }\n        tokenId\n        description\n        animationUrl\n        suspiciousFlag\n        collection {\n          name\n          isVerified\n          image {\n            url\n            id\n          }\n          creator {\n            address\n            profileImage {\n              url\n              id\n            }\n            isVerified\n            id\n          }\n          nftContracts {\n            address\n            standard\n            id\n          }\n          id\n        }\n        listings(first: 1) {\n          edges {\n            node {\n              address\n              createdAt\n              endAt\n              id\n              maker\n              marketplace\n              marketplaceUrl\n              orderHash\n              price {\n                currency\n                value\n                id\n              }\n              quantity\n              startAt\n              status\n              taker\n              tokenId\n              type\n              protocolParameters\n            }\n            cursor\n          }\n        }\n        rarities {\n          provider\n          rank\n          score\n          id\n        }\n        metadataUrl\n        __typename\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n      hasPreviousPage\n      startCursor\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "0fc1ce2d80317f61262116984e6aeb1a";

export default node;
