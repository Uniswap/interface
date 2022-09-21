/**
 * @generated SignedSource<<839b5d4ea40780a1302d31f697029c01>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type TransactionHistoryUpdaterQuery$variables = {
  address: string;
};
export type TransactionHistoryUpdaterQuery$data = {
  readonly assetActivities: ReadonlyArray<{
    readonly timestamp: number;
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
    "name": "address"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "address",
    "variableName": "address"
  },
  {
    "kind": "Literal",
    "name": "page",
    "value": 1
  },
  {
    "kind": "Literal",
    "name": "pageSize",
    "value": 100
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "timestamp",
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
        "concreteType": "AssetActivity",
        "kind": "LinkedField",
        "name": "assetActivities",
        "plural": true,
        "selections": [
          (v2/*: any*/)
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
        "concreteType": "AssetActivity",
        "kind": "LinkedField",
        "name": "assetActivities",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d1a9b5bd923b5894c5e8f83423fb5668",
    "id": null,
    "metadata": {},
    "name": "TransactionHistoryUpdaterQuery",
    "operationKind": "query",
    "text": "query TransactionHistoryUpdaterQuery(\n  $address: String!\n) {\n  assetActivities(address: $address, pageSize: 100, page: 1) {\n    timestamp\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "349de7f8e40654a831c02a83fd926d0b";

export default node;
