/**
 * @generated SignedSource<<65e0b4c6dda2b49e5d168ff970a066df>>
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
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type TopTokens_TokensQuery$variables = {
  contracts: ReadonlyArray<ContractInput>;
  duration: HistoryDuration;
};
export type TopTokens_TokensQuery$data = {
  readonly tokens: ReadonlyArray<{
    readonly address: string;
    readonly chain: Chain;
    readonly id: string;
    readonly market: {
      readonly price: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly priceHistory: ReadonlyArray<{
        readonly timestamp: number;
        readonly value: number | null;
      } | null> | null;
      readonly pricePercentChange: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly totalValueLocked: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
    } | null;
    readonly name: string | null;
    readonly project: {
      readonly logoUrl: string | null;
    } | null;
    readonly symbol: string | null;
  } | null> | null;
};
export type TopTokens_TokensQuery = {
  response: TopTokens_TokensQuery$data;
  variables: TopTokens_TokensQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "contracts"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "duration"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "contracts",
    "variableName": "contracts"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v7 = [
  {
    "kind": "Literal",
    "name": "currency",
    "value": "USD"
  }
],
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v10 = [
  (v8/*: any*/),
  (v9/*: any*/)
],
v11 = [
  {
    "kind": "Variable",
    "name": "duration",
    "variableName": "duration"
  }
],
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "timestamp",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
  "storageKey": null
},
v14 = [
  (v8/*: any*/),
  (v9/*: any*/),
  (v2/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TopTokens_TokensQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Token",
        "kind": "LinkedField",
        "name": "tokens",
        "plural": true,
        "selections": [
          {
            "kind": "RequiredField",
            "field": (v2/*: any*/),
            "action": "LOG",
            "path": "tokens.id"
          },
          (v3/*: any*/),
          {
            "kind": "RequiredField",
            "field": (v4/*: any*/),
            "action": "LOG",
            "path": "tokens.chain"
          },
          {
            "kind": "RequiredField",
            "field": (v5/*: any*/),
            "action": "LOG",
            "path": "tokens.address"
          },
          (v6/*: any*/),
          {
            "alias": null,
            "args": (v7/*: any*/),
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
                "selections": (v10/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v11/*: any*/),
                "concreteType": "TimestampedAmount",
                "kind": "LinkedField",
                "name": "priceHistory",
                "plural": true,
                "selections": [
                  (v12/*: any*/),
                  (v8/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v10/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v11/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v10/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v11/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": [
                  (v9/*: any*/),
                  (v8/*: any*/)
                ],
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TopTokens_TokensQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Token",
        "kind": "LinkedField",
        "name": "tokens",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "alias": null,
            "args": (v7/*: any*/),
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
                "args": (v11/*: any*/),
                "concreteType": "TimestampedAmount",
                "kind": "LinkedField",
                "name": "priceHistory",
                "plural": true,
                "selections": [
                  (v12/*: any*/),
                  (v8/*: any*/),
                  (v2/*: any*/)
                ],
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
                "args": (v11/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v14/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v11/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": [
                  (v9/*: any*/),
                  (v8/*: any*/),
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              (v2/*: any*/)
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
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "10c8f882acdd7e012f0e4b7ebb435752",
    "id": null,
    "metadata": {},
    "name": "TopTokens_TokensQuery",
    "operationKind": "query",
    "text": "query TopTokens_TokensQuery(\n  $contracts: [ContractInput!]!\n  $duration: HistoryDuration!\n) {\n  tokens(contracts: $contracts) {\n    id\n    name\n    chain\n    address\n    symbol\n    market(currency: USD) {\n      totalValueLocked {\n        value\n        currency\n        id\n      }\n      priceHistory(duration: $duration) {\n        timestamp\n        value\n        id\n      }\n      price {\n        value\n        currency\n        id\n      }\n      volume(duration: $duration) {\n        value\n        currency\n        id\n      }\n      pricePercentChange(duration: $duration) {\n        currency\n        value\n        id\n      }\n      id\n    }\n    project {\n      logoUrl\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "609b6c7626b8c8b2a911dc52de19babf";

export default node;
