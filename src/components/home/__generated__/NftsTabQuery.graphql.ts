/**
 * @generated SignedSource<<694efe17f9f90c8e4fe949805e8c744b>>
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
    readonly id: string;
    readonly nftBalances: ReadonlyArray<{
      readonly ownedAsset: {
        readonly collection: {
          readonly isVerified: boolean | null;
          readonly name: string | null;
        } | null;
        readonly description: string | null;
        readonly id: string;
        readonly name: string | null;
        readonly nftContract: {
          readonly address: string | null;
        } | null;
        readonly smallImageUrl: string | null;
        readonly tokenId: string | null;
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
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "ownerAddress",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "isVerified",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "smallImageUrl",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenId",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
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
          (v3/*: any*/),
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
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftCollection",
                    "kind": "LinkedField",
                    "name": "collection",
                    "plural": false,
                    "selections": [
                      (v4/*: any*/),
                      (v5/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v6/*: any*/),
                  (v4/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContract",
                    "plural": false,
                    "selections": [
                      (v9/*: any*/)
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
          (v3/*: any*/),
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
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftCollection",
                    "kind": "LinkedField",
                    "name": "collection",
                    "plural": false,
                    "selections": [
                      (v4/*: any*/),
                      (v5/*: any*/),
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v6/*: any*/),
                  (v4/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftContract",
                    "kind": "LinkedField",
                    "name": "nftContract",
                    "plural": false,
                    "selections": [
                      (v9/*: any*/),
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "38accc44d2aacdde8c9e59a98227440c",
    "id": null,
    "metadata": {},
    "name": "NftsTabQuery",
    "operationKind": "query",
    "text": "query NftsTabQuery(\n  $ownerAddress: String!\n) {\n  portfolios(ownerAddresses: [$ownerAddress]) {\n    id\n    ownerAddress\n    nftBalances {\n      ownedAsset {\n        id\n        collection {\n          name\n          isVerified\n          id\n        }\n        smallImageUrl\n        name\n        tokenId\n        description\n        nftContract {\n          address\n          id\n        }\n      }\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e39cc8fd1da25b474c7a069c4b07134b";

export default node;
