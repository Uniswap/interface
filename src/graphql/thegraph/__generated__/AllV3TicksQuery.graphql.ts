/**
 * @generated SignedSource<<0becdf63598262462f6fa0cabb891ad0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type AllV3TicksQuery$variables = {
  poolAddress: string;
  skip: number;
};
export type AllV3TicksQuery$data = {
  readonly ticks: ReadonlyArray<{
    readonly liquidityNet: any;
    readonly price0: any;
    readonly price1: any;
    readonly tick: any;
  }>;
};
export type AllV3TicksQuery = {
  response: AllV3TicksQuery$data;
  variables: AllV3TicksQuery$variables;
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
    "name": "AllV3TicksQuery",
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
    "name": "AllV3TicksQuery",
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
    "cacheID": "9f2d65b1e565e3d0ecbe7b1f908ebc83",
    "id": null,
    "metadata": {},
    "name": "AllV3TicksQuery",
    "operationKind": "query",
    "text": "query AllV3TicksQuery(\n  $poolAddress: String!\n  $skip: Int!\n) {\n  ticks(first: 1000, skip: $skip, where: {poolAddress: $poolAddress}, orderBy: tickIdx) {\n    tick: tickIdx\n    liquidityNet\n    price0\n    price1\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "82709c11c929a8eb6caf2ab1df2b99cc";

export default node;
