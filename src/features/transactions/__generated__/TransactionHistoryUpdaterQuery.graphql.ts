/**
 * @generated SignedSource<<70dd412bfc454363618f513ffa10027e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type TransactionHistoryUpdaterQuery$variables = {
  ownerAddresses: ReadonlyArray<string>;
};
export type TransactionHistoryUpdaterQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly assetActivities: ReadonlyArray<{
      readonly timestamp: number;
    } | null> | null;
    readonly ownerAddress: string;
  } | null> | null;
};
export type TransactionHistoryUpdaterQuery = {
  response: TransactionHistoryUpdaterQuery$data;
  variables: TransactionHistoryUpdaterQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "ownerAddresses"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "ownerAddresses",
    "variableName": "ownerAddresses"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "ownerAddress",
  "storageKey": null
},
v3 = [
  {
    "kind": "Literal",
    "name": "page",
    "value": 1
  },
  {
    "kind": "Literal",
    "name": "pageSize",
    "value": 1
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "timestamp",
  "storageKey": null
},
v5 = {
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
    "name": "TransactionHistoryUpdaterQuery",
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
            "args": (v3/*: any*/),
            "concreteType": "AssetActivity",
            "kind": "LinkedField",
            "name": "assetActivities",
            "plural": true,
            "selections": [
              (v4/*: any*/)
            ],
            "storageKey": "assetActivities(page:1,pageSize:1)"
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
    "name": "TransactionHistoryUpdaterQuery",
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
            "args": (v3/*: any*/),
            "concreteType": "AssetActivity",
            "kind": "LinkedField",
            "name": "assetActivities",
            "plural": true,
            "selections": [
              (v4/*: any*/),
              (v5/*: any*/)
            ],
            "storageKey": "assetActivities(page:1,pageSize:1)"
          },
          (v5/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "320b1cb36d70f6a8376ca73bdebae44e",
    "id": null,
    "metadata": {},
    "name": "TransactionHistoryUpdaterQuery",
    "operationKind": "query",
    "text": "query TransactionHistoryUpdaterQuery(\n  $ownerAddresses: [String!]!\n) {\n  portfolios(ownerAddresses: $ownerAddresses) {\n    ownerAddress\n    assetActivities(pageSize: 1, page: 1) {\n      timestamp\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "e3a38de3c44dc7501aa3170b4c3cd678";

export default node;
