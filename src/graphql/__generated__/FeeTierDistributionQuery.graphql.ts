/**
 * @generated SignedSource<<5761481cf3bba524864626a7f965c0d7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type FeeTierDistributionQuery$variables = {
  token0: string;
  token1: string;
};
export type FeeTierDistributionQuery$data = {
  readonly _meta: {
    readonly block: {
      readonly number: number;
    };
  } | null;
  readonly asToken0: ReadonlyArray<{
    readonly feeTier: any;
    readonly totalValueLockedToken0: any;
    readonly totalValueLockedToken1: any;
  }>;
  readonly asToken1: ReadonlyArray<{
    readonly feeTier: any;
    readonly totalValueLockedToken0: any;
    readonly totalValueLockedToken1: any;
  }>;
};
export type FeeTierDistributionQuery = {
  response: FeeTierDistributionQuery$data;
  variables: FeeTierDistributionQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "token0"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "token1"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "concreteType": "_Meta_",
  "kind": "LinkedField",
  "name": "_meta",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "_Block_",
      "kind": "LinkedField",
      "name": "block",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "number",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v2 = {
  "kind": "Literal",
  "name": "orderBy",
  "value": "totalValueLockedToken0"
},
v3 = {
  "kind": "Literal",
  "name": "orderDirection",
  "value": "desc"
},
v4 = [
  (v2/*: any*/),
  (v3/*: any*/),
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "token0",
        "variableName": "token0"
      },
      {
        "kind": "Variable",
        "name": "token1",
        "variableName": "token1"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "feeTier",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalValueLockedToken0",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalValueLockedToken1",
  "storageKey": null
},
v8 = [
  (v5/*: any*/),
  (v6/*: any*/),
  (v7/*: any*/)
],
v9 = [
  (v2/*: any*/),
  (v3/*: any*/),
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "token0",
        "variableName": "token1"
      },
      {
        "kind": "Variable",
        "name": "token1",
        "variableName": "token0"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
v10 = [
  (v5/*: any*/),
  (v6/*: any*/),
  (v7/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "id",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "FeeTierDistributionQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": "asToken0",
        "args": (v4/*: any*/),
        "concreteType": "Pool",
        "kind": "LinkedField",
        "name": "pools",
        "plural": true,
        "selections": (v8/*: any*/),
        "storageKey": null
      },
      {
        "alias": "asToken1",
        "args": (v9/*: any*/),
        "concreteType": "Pool",
        "kind": "LinkedField",
        "name": "pools",
        "plural": true,
        "selections": (v8/*: any*/),
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
    "name": "FeeTierDistributionQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": "asToken0",
        "args": (v4/*: any*/),
        "concreteType": "Pool",
        "kind": "LinkedField",
        "name": "pools",
        "plural": true,
        "selections": (v10/*: any*/),
        "storageKey": null
      },
      {
        "alias": "asToken1",
        "args": (v9/*: any*/),
        "concreteType": "Pool",
        "kind": "LinkedField",
        "name": "pools",
        "plural": true,
        "selections": (v10/*: any*/),
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d989fcfb8fc9ef13bdc6de811e574284",
    "id": null,
    "metadata": {},
    "name": "FeeTierDistributionQuery",
    "operationKind": "query",
    "text": "query FeeTierDistributionQuery(\n  $token0: String!\n  $token1: String!\n) {\n  _meta {\n    block {\n      number\n    }\n  }\n  asToken0: pools(orderBy: totalValueLockedToken0, orderDirection: desc, where: {token0: $token0, token1: $token1}) {\n    feeTier\n    totalValueLockedToken0\n    totalValueLockedToken1\n    id\n  }\n  asToken1: pools(orderBy: totalValueLockedToken0, orderDirection: desc, where: {token0: $token1, token1: $token0}) {\n    feeTier\n    totalValueLockedToken0\n    totalValueLockedToken1\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "ac9cd4bfdc24db90dbb2bf8a7508009f";

export default node;
