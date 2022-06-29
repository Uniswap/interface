/**
 * @generated SignedSource<<fc70008140b9de54c6ba5b828c12a3a7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type GraphQLTokenQuery$variables = {};
export type GraphQLTokenQuery$data = {
  readonly tokens: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly symbol: string;
  }>;
};
export type GraphQLTokenQuery = {
  response: GraphQLTokenQuery$data;
  variables: GraphQLTokenQuery$variables;
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
    "name": "GraphQLTokenQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "GraphQLTokenQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "bdced26c43044ef948caaf1a5b22d20e",
    "id": null,
    "metadata": {},
    "name": "GraphQLTokenQuery",
    "operationKind": "query",
    "text": "query GraphQLTokenQuery {\n  tokens(first: 500) {\n    id\n    name\n    symbol\n  }\n}\n"
  }
};
})();

(node as any).hash = "a08478f6135eabf51ab7cf3d79271bc7";

export default node;
