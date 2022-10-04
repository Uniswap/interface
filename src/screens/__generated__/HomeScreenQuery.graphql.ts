/**
 * @generated SignedSource<<b1816468f5ede59783b488015c4060a3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type HomeScreenQuery$variables = {
  owner: string;
};
export type HomeScreenQuery$data = {
  readonly portfolio: {
    readonly " $fragmentSpreads": FragmentRefs<"TotalBalance_portfolio">;
  } | null;
};
export type HomeScreenQuery = {
  response: HomeScreenQuery$data;
  variables: HomeScreenQuery$variables;
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
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "HomeScreenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolio",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TotalBalance_portfolio"
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
    "name": "HomeScreenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolio",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "assetsValueUSD",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "absoluteChange24H",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "relativeChange24H",
            "storageKey": null
          },
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
    "cacheID": "1d5e4b0132125d3162d65a92efecdd8f",
    "id": null,
    "metadata": {},
    "name": "HomeScreenQuery",
    "operationKind": "query",
    "text": "query HomeScreenQuery(\n  $owner: String!\n) {\n  portfolio(ownerAddress: $owner) {\n    ...TotalBalance_portfolio\n    id\n  }\n}\n\nfragment TotalBalance_portfolio on Portfolio {\n  assetsValueUSD\n  absoluteChange24H\n  relativeChange24H\n}\n"
  }
};
})();

(node as any).hash = "e8de5ab88af39edb4159b988447e6ff9";

export default node;
