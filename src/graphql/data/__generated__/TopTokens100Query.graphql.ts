/**
 * @generated SignedSource<<fbd2b0a52494c0399a7fc092b98c2c65>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type HistoryDuration = "DAY" | "HOUR" | "MAX" | "MONTH" | "WEEK" | "YEAR" | "%future added value";
export type TopTokens100Query$variables = {
  chain: Chain;
  duration: HistoryDuration;
};
export type TopTokens100Query$data = {
  readonly topTokens: ReadonlyArray<{
    readonly address: string;
    readonly chain: Chain;
    readonly id: string;
    readonly market: {
      readonly price: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly pricePercentChange: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly totalValueLocked: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly volume: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
    } | null;
    readonly name: string | null;
    readonly project: {
      readonly logoUrl: string | null;
    } | null;
    readonly symbol: string | null;
  } | null> | null;
};
export type TopTokens100Query = {
  response: TopTokens100Query$data;
  variables: TopTokens100Query$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "chain"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "duration"
},
v2 = [
  {
    "kind": "Variable",
    "name": "chain",
    "variableName": "chain"
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
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
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
  "name": "chain",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v8 = [
  {
    "kind": "Literal",
    "name": "currency",
    "value": "USD"
  }
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v11 = [
  (v9/*: any*/),
  (v10/*: any*/)
],
v12 = [
  {
    "kind": "Variable",
    "name": "duration",
    "variableName": "duration"
  }
],
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
  "storageKey": null
},
v14 = [
  (v9/*: any*/),
  (v10/*: any*/),
  (v3/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TopTokens100Query",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "Token",
        "kind": "LinkedField",
        "name": "topTokens",
        "plural": true,
        "selections": [
          {
            "kind": "RequiredField",
            "field": (v3/*: any*/),
            "action": "LOG",
            "path": "topTokens.id"
          },
          (v4/*: any*/),
          {
            "kind": "RequiredField",
            "field": (v5/*: any*/),
            "action": "LOG",
            "path": "topTokens.chain"
          },
          {
            "kind": "RequiredField",
            "field": (v6/*: any*/),
            "action": "LOG",
            "path": "topTokens.address"
          },
          (v7/*: any*/),
          {
            "alias": null,
            "args": (v8/*: any*/),
            "concreteType": "TokenMarket",
            "kind": "LinkedField",
            "name": "market",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "totalValueLocked",
                "plural": false,
                "selections": (v11/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v11/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": [
                  (v10/*: any*/),
                  (v9/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v11/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": "market(currency:\"USD\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenProject",
            "kind": "LinkedField",
            "name": "project",
            "plural": false,
            "selections": [
              (v13/*: any*/)
            ],
            "storageKey": null
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
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TopTokens100Query",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "Token",
        "kind": "LinkedField",
        "name": "topTokens",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          {
            "alias": null,
            "args": (v8/*: any*/),
            "concreteType": "TokenMarket",
            "kind": "LinkedField",
            "name": "market",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "totalValueLocked",
                "plural": false,
                "selections": (v14/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v14/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": [
                  (v10/*: any*/),
                  (v9/*: any*/),
                  (v3/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v14/*: any*/),
                "storageKey": null
              },
              (v3/*: any*/)
            ],
            "storageKey": "market(currency:\"USD\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenProject",
            "kind": "LinkedField",
            "name": "project",
            "plural": false,
            "selections": [
              (v13/*: any*/),
              (v3/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "7eca410bcfbc06385de3498ded3a9f34",
    "id": null,
    "metadata": {},
    "name": "TopTokens100Query",
    "operationKind": "query",
    "text": "query TopTokens100Query(\n  $duration: HistoryDuration!\n  $chain: Chain!\n) {\n  topTokens(pageSize: 100, page: 1, chain: $chain) {\n    id\n    name\n    chain\n    address\n    symbol\n    market(currency: USD) {\n      totalValueLocked {\n        value\n        currency\n        id\n      }\n      price {\n        value\n        currency\n        id\n      }\n      pricePercentChange(duration: $duration) {\n        currency\n        value\n        id\n      }\n      volume(duration: $duration) {\n        value\n        currency\n        id\n      }\n      id\n    }\n    project {\n      logoUrl\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2a5802d51b430b2b9812ad0971b5b59b";

export default node;
