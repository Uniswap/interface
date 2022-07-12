/**
 * @generated SignedSource<<ce1253f93eb42fc6989c83f6ca323e5b>>
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
    "cacheID": "c6db95acf19b84ebe5b3f1f6f851cc84",
    "id": null,
    "metadata": {},
    "name": "TotalBalanceQuery",
    "operationKind": "query",
    "text": "query TotalBalanceQuery(\n  $owner: String!\n) {\n  portfolio(ownerAddress: $owner) {\n    relativeChange24H\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "8d1854c8840d3185730ff934b61a3da9";

export default node;
