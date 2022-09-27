/**
 * @generated SignedSource<<71fc988df468cfc7b25124541906e3e0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type SearchPopularTokensQuery$variables = {};
export type SearchPopularTokensQuery$data = {
  readonly topTokenProjects: ReadonlyArray<{
    readonly logoUrl: string | null;
    readonly tokens: ReadonlyArray<{
      readonly address: string | null;
      readonly chain: Chain;
      readonly name: string | null;
      readonly symbol: string | null;
    }>;
  } | null> | null;
};
export type SearchPopularTokensQuery = {
  response: SearchPopularTokensQuery$data;
  variables: SearchPopularTokensQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "orderBy",
    "value": "VOLUME"
  },
  {
    "kind": "Literal",
    "name": "page",
    "value": 1
  },
  {
    "kind": "Literal",
    "name": "pageSize",
    "value": 3
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
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
  "name": "name",
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
    "name": "SearchPopularTokensQuery",
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
              (v5/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "topTokenProjects(orderBy:\"VOLUME\",page:1,pageSize:3)"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "SearchPopularTokensQuery",
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
              (v5/*: any*/),
              (v6/*: any*/)
            ],
            "storageKey": null
          },
          (v6/*: any*/)
        ],
        "storageKey": "topTokenProjects(orderBy:\"VOLUME\",page:1,pageSize:3)"
      }
    ]
  },
  "params": {
    "cacheID": "77251f89a30b9d80847fa01e03fb4604",
    "id": null,
    "metadata": {},
    "name": "SearchPopularTokensQuery",
    "operationKind": "query",
    "text": "query SearchPopularTokensQuery {\n  topTokenProjects(orderBy: VOLUME, page: 1, pageSize: 3) {\n    logoUrl\n    tokens {\n      chain\n      address\n      name\n      symbol\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "ab16b8f02890a0e23045e2e13f2dc31e";

export default node;
