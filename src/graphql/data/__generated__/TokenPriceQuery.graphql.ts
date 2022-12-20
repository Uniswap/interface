/**
 * @generated SignedSource<<652046307aa915557ea261dce230f759>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type HistoryDuration = "DAY" | "HOUR" | "MAX" | "MONTH" | "WEEK" | "YEAR" | "%future added value";
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type TokenPriceQuery$variables = {
  contract: ContractInput;
  duration: HistoryDuration;
};
export type TokenPriceQuery$data = {
  readonly tokens: ReadonlyArray<{
    readonly market: {
      readonly price: {
        readonly value: number;
      } | null;
      readonly priceHistory: ReadonlyArray<{
        readonly timestamp: number;
        readonly value: number;
      } | null> | null;
    };
  } | null> | null;
};
export type TokenPriceQuery = {
  response: TokenPriceQuery$data;
  variables: TokenPriceQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "contract"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "duration"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "contracts.0",
        "variableName": "contract"
      }
    ],
    "kind": "ListValue",
    "name": "contracts"
  }
],
v2 = [
  {
    "kind": "Literal",
    "name": "currency",
    "value": "USD"
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v4 = [
  {
    "kind": "Variable",
    "name": "duration",
    "variableName": "duration"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "timestamp",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TokenPriceQuery",
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
            "field": {
              "alias": null,
              "args": (v2/*: any*/),
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
                  "name": "price",
                  "plural": false,
                  "selections": [
                    {
                      "kind": "RequiredField",
                      "field": (v3/*: any*/),
                      "action": "LOG",
                      "path": "tokens.market.price.value"
                    }
                  ],
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": (v4/*: any*/),
                  "concreteType": "TimestampedAmount",
                  "kind": "LinkedField",
                  "name": "priceHistory",
                  "plural": true,
                  "selections": [
                    {
                      "kind": "RequiredField",
                      "field": (v5/*: any*/),
                      "action": "LOG",
                      "path": "tokens.market.priceHistory.timestamp"
                    },
                    {
                      "kind": "RequiredField",
                      "field": (v3/*: any*/),
                      "action": "LOG",
                      "path": "tokens.market.priceHistory.value"
                    }
                  ],
                  "storageKey": null
                }
              ],
              "storageKey": "market(currency:\"USD\")"
            },
            "action": "LOG",
            "path": "tokens.market"
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
    "name": "TokenPriceQuery",
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
            "alias": null,
            "args": (v2/*: any*/),
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
                "name": "price",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  (v6/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": (v4/*: any*/),
                "concreteType": "TimestampedAmount",
                "kind": "LinkedField",
                "name": "priceHistory",
                "plural": true,
                "selections": [
                  (v5/*: any*/),
                  (v3/*: any*/),
                  (v6/*: any*/)
                ],
                "storageKey": null
              },
              (v6/*: any*/)
            ],
            "storageKey": "market(currency:\"USD\")"
          },
          (v6/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "57d6ad1f08cbca6e18ae3b0c24927301",
    "id": null,
    "metadata": {},
    "name": "TokenPriceQuery",
    "operationKind": "query",
    "text": "query TokenPriceQuery(\n  $contract: ContractInput!\n  $duration: HistoryDuration!\n) {\n  tokens(contracts: [$contract]) {\n    market(currency: USD) {\n      price {\n        value\n        id\n      }\n      priceHistory(duration: $duration) {\n        timestamp\n        value\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "47f1f49f7d0ace05e64ff5bec4cf4d35";

export default node;
