/**
 * @generated SignedSource<<287888bdcc60cb8aa61c3dcb312fe80f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type topTokensQuery$variables = {};
export type topTokensQuery$data = {
  readonly topTokenProjects: ReadonlyArray<{
    readonly name: string | null;
    readonly tokens: ReadonlyArray<{
      readonly address: string | null;
      readonly chain: Chain;
      readonly decimals: number | null;
      readonly name: string | null;
      readonly symbol: string | null;
    }>;
  } | null> | null;
};
export type topTokensQuery = {
  response: topTokensQuery$data;
  variables: topTokensQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "orderBy",
    "value": "MARKET_CAP"
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
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "decimals",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "topTokensQuery",
    "selections": [
      {
        "alias": null,
        "args": (v0/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v1/*: any*/),
              (v5/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "topTokenProjects(orderBy:\"MARKET_CAP\",page:1,pageSize:100)"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "topTokensQuery",
    "selections": [
      {
        "alias": null,
        "args": (v0/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v1/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/)
            ],
            "storageKey": null
          },
          (v6/*: any*/)
        ],
        "storageKey": "topTokenProjects(orderBy:\"MARKET_CAP\",page:1,pageSize:100)"
      }
    ]
  },
  "params": {
    "cacheID": "55bed639d86d03e894b6600c90bd0598",
    "id": null,
    "metadata": {},
    "name": "topTokensQuery",
    "operationKind": "query",
    "text": "query topTokensQuery {\n  topTokenProjects(orderBy: MARKET_CAP, page: 1, pageSize: 100) {\n    name\n    tokens {\n      chain\n      address\n      decimals\n      name\n      symbol\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "b7b7380bfaf61cd64a560e6a46d478c8";

export default node;
