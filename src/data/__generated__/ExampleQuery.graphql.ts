/**
 * @generated SignedSource<<e52dc1e25ea2c742e7df94a12327362b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type ExampleQuery$variables = {};
export type ExampleQuery$data = {
  readonly tokens: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly symbol: string;
  }>;
};
export type ExampleQuery = {
  response: ExampleQuery$data;
  variables: ExampleQuery$variables;
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
    "name": "ExampleQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "ExampleQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "f14d6732aa123ce3149898a022e18989",
    "id": null,
    "metadata": {},
    "name": "ExampleQuery",
    "operationKind": "query",
    "text": "query ExampleQuery {\n  tokens(first: 500) {\n    id\n    name\n    symbol\n  }\n}\n"
  }
};
})();

(node as any).hash = "f76c3ee70d3ac7181bf0b69e5a08bfb5";

export default node;
