/**
 * @generated SignedSource<<dd2dd78ae723d35ca26192cc0777e286>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type useAllV3TicksQuery$variables = {
  poolAddress: string;
  skip: number;
};
export type useAllV3TicksQuery$data = {
  readonly ticks: ReadonlyArray<{
    readonly liquidityNet: any;
    readonly price0: any;
    readonly price1: any;
    readonly tick: any;
  }>;
};
export type useAllV3TicksQuery = {
  response: useAllV3TicksQuery$data;
  variables: useAllV3TicksQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "poolAddress"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "skip"
  }
],
v1 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1000
  },
  {
    "kind": "Literal",
    "name": "orderBy",
    "value": "tickIdx"
  },
  {
    "kind": "Variable",
    "name": "skip",
    "variableName": "skip"
  },
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "poolAddress",
        "variableName": "poolAddress"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
v2 = {
  "alias": "tick",
  "args": null,
  "kind": "ScalarField",
  "name": "tickIdx",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "liquidityNet",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "price0",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "price1",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useAllV3TicksQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Tick",
        "kind": "LinkedField",
        "name": "ticks",
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
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useAllV3TicksQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Tick",
        "kind": "LinkedField",
        "name": "ticks",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
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
    "cacheID": "c65fe1a6fefacc9a04413fe4a708a2e0",
    "id": null,
    "metadata": {},
    "name": "useAllV3TicksQuery",
    "operationKind": "query",
    "text": "query useAllV3TicksQuery(\n  $poolAddress: String!\n  $skip: Int!\n) {\n  ticks(first: 1000, skip: $skip, where: {poolAddress: $poolAddress}, orderBy: tickIdx) {\n    tick: tickIdx\n    liquidityNet\n    price0\n    price1\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "b3e474befed1039a956cb18b1a66566f";

export default node;
