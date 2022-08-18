/**
 * @generated SignedSource<<2e9a8e3dfba7c8bede6e3d02f1f92e9c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type TotalBalanceQuery$variables = {
  owner: string;
};
export type TotalBalanceQuery$data = {
  readonly portfolio: {
    readonly absoluteChange24H: number | null;
    readonly assetsValueUSD: number | null;
    readonly relativeChange24H: number | null;
  } | null;
};
export type TotalBalanceQuery = {
  response: TotalBalanceQuery$data;
  variables: TotalBalanceQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "owner"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "ownerAddress",
    "variableName": "owner"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "assetsValueUSD",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "absoluteChange24H",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "relativeChange24H",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TotalBalanceQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolio",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/)
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
    "name": "TotalBalanceQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolio",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
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
    "cacheID": "3ca0a3ad65dcbab759d1096434072d66",
    "id": null,
    "metadata": {},
    "name": "TotalBalanceQuery",
    "operationKind": "query",
    "text": "query TotalBalanceQuery(\n  $owner: String!\n) {\n  portfolio(ownerAddress: $owner) {\n    assetsValueUSD\n    absoluteChange24H\n    relativeChange24H\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "2cbd43f8e1ab35e5ebebe8f62a97f75e";

export default node;
