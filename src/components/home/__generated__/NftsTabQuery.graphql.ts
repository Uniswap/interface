/**
 * @generated SignedSource<<01c5796cea6cc66946360634853aa2fd>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type NftsTabQuery$variables = {
  ownerAddress: string;
};
export type NftsTabQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly nftBalances: ReadonlyArray<{
      readonly ownedAsset: {
        readonly collection: {
          readonly isVerified: boolean | null;
          readonly markets: ReadonlyArray<{
            readonly floorPrice: {
              readonly value: number;
            } | null;
          }> | null;
          readonly name: string | null;
        } | null;
        readonly description: string | null;
        readonly image: {
          readonly url: string;
        } | null;
        readonly name: string | null;
        readonly nftContract: {
          readonly address: string;
        } | null;
        readonly tokenId: string;
      } | null;
    } | null> | null;
    readonly ownerAddress: string;
  } | null> | null;
};
export type NftsTabQuery = {
  response: NftsTabQuery$data;
  variables: NftsTabQuery$variables;
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
  "name": "ownerAddress",
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
  "name": "isVerified",
  "storageKey": null
},
v5 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": [
      "ETH"
    ]
  }
],
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "url",
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
  "name": "address",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "NftsTabQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          (v2/*: any*/),
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
                      (v3/*: any*/),
                      (v4/*: any*/),
                      {
                        "alias": null,
                        "args": (v5/*: any*/),
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
                              (v6/*: any*/)
                            ],
                            "storageKey": null
                          }
                        ],
                        "storageKey": "markets(currencies:[\"ETH\"])"
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "image",
                    "plural": false,
                    "selections": [
                      (v7/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v3/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContract",
                    "plural": false,
                    "selections": [
                      (v10/*: any*/)
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
    "name": "NftsTabQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          (v2/*: any*/),
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
                      (v3/*: any*/),
                      (v4/*: any*/),
                      {
                        "alias": null,
                        "args": (v5/*: any*/),
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
                              (v6/*: any*/),
                              (v11/*: any*/)
                            ],
                            "storageKey": null
                          },
                          (v11/*: any*/)
                        ],
                        "storageKey": "markets(currencies:[\"ETH\"])"
                      },
                      (v11/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Image",
                    "kind": "LinkedField",
                    "name": "image",
                    "plural": false,
                    "selections": [
                      (v7/*: any*/),
                      (v11/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v3/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContract",
                    "plural": false,
                    "selections": [
                      (v10/*: any*/),
                      (v11/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v11/*: any*/)
                ],
                "storageKey": null
              },
              (v11/*: any*/)
            ],
            "storageKey": null
          },
          (v11/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "683e5c1dd55a1cc0f65e3ac799d28c02",
    "id": null,
    "metadata": {},
    "name": "NftsTabQuery",
    "operationKind": "query",
    "text": "query NftsTabQuery(\n  $ownerAddress: String!\n) {\n  portfolios(ownerAddresses: [$ownerAddress]) {\n    ownerAddress\n    nftBalances {\n      ownedAsset {\n        collection {\n          name\n          isVerified\n          markets(currencies: [ETH]) {\n            floorPrice {\n              value\n              id\n            }\n            id\n          }\n          id\n        }\n        image {\n          url\n          id\n        }\n        name\n        tokenId\n        description\n        nftContract {\n          address\n          id\n        }\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "e7522f0d054d46ff283b576e3c2661c0";

export default node;
