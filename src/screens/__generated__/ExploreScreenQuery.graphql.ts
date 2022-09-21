/**
 * @generated SignedSource<<c077f3b757ece2aa14b60b0aab7a28f3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ExploreScreenQuery$variables = {};
export type ExploreScreenQuery$data = {
  readonly popularTokens: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<"SearchEmptySection_popularTokens">;
  } | null> | null;
};
export type ExploreScreenQuery = {
  response: ExploreScreenQuery$data;
  variables: ExploreScreenQuery$variables;
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
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "ExploreScreenQuery",
    "selections": [
      {
        "alias": "popularTokens",
        "args": (v0/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "SearchEmptySection_popularTokens"
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
    "name": "ExploreScreenQuery",
    "selections": [
      {
        "alias": "popularTokens",
        "args": (v0/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "logoUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "chain",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "address",
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
              },
              (v1/*: any*/)
            ],
            "storageKey": null
          },
          (v1/*: any*/)
        ],
        "storageKey": "topTokenProjects(orderBy:\"VOLUME\",page:1,pageSize:3)"
      }
    ]
  },
  "params": {
    "cacheID": "d7c0d2e064273867cae07afc91a24379",
    "id": null,
    "metadata": {},
    "name": "ExploreScreenQuery",
    "operationKind": "query",
    "text": "query ExploreScreenQuery {\n  popularTokens: topTokenProjects(orderBy: VOLUME, page: 1, pageSize: 3) {\n    ...SearchEmptySection_popularTokens\n    id\n  }\n}\n\nfragment SearchEmptySection_popularTokens on TokenProject {\n  logoUrl\n  tokens {\n    chain\n    address\n    name\n    symbol\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "4581006c5b449b794c9cf03fcfaba684";

export default node;
