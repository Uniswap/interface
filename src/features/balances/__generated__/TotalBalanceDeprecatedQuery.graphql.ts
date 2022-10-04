/**
 * @generated SignedSource<<f43714af19affe988665db645d317cb5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type TotalBalanceDeprecatedQuery$variables = {
  owner: string;
};
export type TotalBalanceDeprecatedQuery$data = {
  readonly portfolio: {
    readonly absoluteChange24H: number | null;
    readonly assetsValueUSD: number | null;
    readonly relativeChange24H: number | null;
  } | null;
};
export type TotalBalanceDeprecatedQuery = {
  response: TotalBalanceDeprecatedQuery$data;
  variables: TotalBalanceDeprecatedQuery$variables;
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
    "name": "TotalBalanceDeprecatedQuery",
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
    "name": "TotalBalanceDeprecatedQuery",
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
    "cacheID": "8cc8bac34e0ba3cabab9e6f2595c57f7",
    "id": null,
    "metadata": {},
    "name": "TotalBalanceDeprecatedQuery",
    "operationKind": "query",
    "text": "query TotalBalanceDeprecatedQuery(\n  $owner: String!\n) {\n  portfolio(ownerAddress: $owner) {\n    assetsValueUSD\n    absoluteChange24H\n    relativeChange24H\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "174642c36d8d76394cab40ea3ea2d3f7";

export default node;
