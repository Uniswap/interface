/**
 * @generated SignedSource<<3ef41f7cc8acbe80900145f0a3ac3160>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type AppTokenQuery$variables = {};
export type AppTokenQuery$data = {
  readonly tokens: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly symbol: string;
  }>;
};
export type AppTokenQuery = {
  response: AppTokenQuery$data;
  variables: AppTokenQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Literal",
        "name": "first",
        "value": 500
      }
    ],
    "concreteType": "Token",
    "kind": "LinkedField",
    "name": "tokens",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "name",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "symbol",
        "storageKey": null
      }
    ],
    "storageKey": "tokens(first:500)"
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "AppTokenQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AppTokenQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "6d6c7e5b7c610884d041e935b5864f75",
    "id": null,
    "metadata": {},
    "name": "AppTokenQuery",
    "operationKind": "query",
    "text": "query AppTokenQuery {\n  tokens(first: 500) {\n    id\n    name\n    symbol\n  }\n}\n"
  }
};
})();

(node as any).hash = "f858a4582d53c47b0388b7518bdfdd2f";

export default node;
