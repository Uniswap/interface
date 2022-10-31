/**
 * @generated SignedSource<<5f308be395385309c8faac211abf319c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type PortfolioModel_PortfolioQuery$variables = {
  ownerAddress: string;
};
export type PortfolioModel_PortfolioQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly dailyValues: ReadonlyArray<{
      readonly close: number;
      readonly timestamp: number;
    } | null> | null;
    readonly hourlyValues: ReadonlyArray<{
      readonly close: number;
      readonly timestamp: number;
    } | null> | null;
    readonly monthlyValues: ReadonlyArray<{
      readonly close: number;
      readonly timestamp: number;
    } | null> | null;
    readonly tokenBalances: ReadonlyArray<{
      readonly denominatedValue: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly quantity: number | null;
      readonly token: {
        readonly address: string | null;
        readonly chain: Chain;
        readonly decimals: number | null;
        readonly name: string | null;
        readonly symbol: string | null;
      } | null;
      readonly tokenProjectMarket: {
        readonly relativeChange24: {
          readonly value: number;
        } | null;
        readonly tokenProject: {
          readonly logoUrl: string | null;
        };
      } | null;
    } | null> | null;
    readonly weeklyValues: ReadonlyArray<{
      readonly close: number;
      readonly timestamp: number;
    } | null> | null;
    readonly yearlyValues: ReadonlyArray<{
      readonly close: number;
      readonly timestamp: number;
    } | null> | null;
  } | null> | null;
};
export type PortfolioModel_PortfolioQuery = {
  response: PortfolioModel_PortfolioQuery$data;
  variables: PortfolioModel_PortfolioQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "ownerAddress"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "ownerAddresses.0",
        "variableName": "ownerAddress"
      }
    ],
    "kind": "ListValue",
    "name": "ownerAddresses"
  }
],
v2 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "HOUR"
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "timestamp",
  "storageKey": null
},
v4 = {
  "alias": "close",
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v5 = [
  (v3/*: any*/),
  (v4/*: any*/)
],
v6 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v7 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "WEEK"
  }
],
v8 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "MONTH"
  }
],
v9 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "YEAR"
  }
],
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "quantity",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "decimals",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v20 = [
  (v3/*: any*/),
  (v4/*: any*/),
  (v19/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PortfolioModel_PortfolioQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": "hourlyValues",
            "args": (v2/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"HOUR\")"
          },
          {
            "alias": "dailyValues",
            "args": (v6/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"DAY\")"
          },
          {
            "alias": "weeklyValues",
            "args": (v7/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"WEEK\")"
          },
          {
            "alias": "monthlyValues",
            "args": (v8/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"MONTH\")"
          },
          {
            "alias": "yearlyValues",
            "args": (v9/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v5/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"YEAR\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenBalance",
            "kind": "LinkedField",
            "name": "tokenBalances",
            "plural": true,
            "selections": [
              (v10/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "denominatedValue",
                "plural": false,
                "selections": [
                  (v11/*: any*/),
                  (v12/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Token",
                "kind": "LinkedField",
                "name": "token",
                "plural": false,
                "selections": [
                  (v13/*: any*/),
                  (v14/*: any*/),
                  (v15/*: any*/),
                  (v16/*: any*/),
                  (v17/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TokenProjectMarket",
                "kind": "LinkedField",
                "name": "tokenProjectMarket",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "TokenProject",
                    "kind": "LinkedField",
                    "name": "tokenProject",
                    "plural": false,
                    "selections": [
                      (v18/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "relativeChange24",
                    "args": (v6/*: any*/),
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "pricePercentChange",
                    "plural": false,
                    "selections": [
                      (v12/*: any*/)
                    ],
                    "storageKey": "pricePercentChange(duration:\"DAY\")"
                  }
                ],
                "storageKey": null
              }
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
    "name": "PortfolioModel_PortfolioQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": "hourlyValues",
            "args": (v2/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v20/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"HOUR\")"
          },
          {
            "alias": "dailyValues",
            "args": (v6/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v20/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"DAY\")"
          },
          {
            "alias": "weeklyValues",
            "args": (v7/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v20/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"WEEK\")"
          },
          {
            "alias": "monthlyValues",
            "args": (v8/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v20/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"MONTH\")"
          },
          {
            "alias": "yearlyValues",
            "args": (v9/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v20/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"YEAR\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenBalance",
            "kind": "LinkedField",
            "name": "tokenBalances",
            "plural": true,
            "selections": [
              (v10/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "denominatedValue",
                "plural": false,
                "selections": [
                  (v11/*: any*/),
                  (v12/*: any*/),
                  (v19/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Token",
                "kind": "LinkedField",
                "name": "token",
                "plural": false,
                "selections": [
                  (v13/*: any*/),
                  (v14/*: any*/),
                  (v15/*: any*/),
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v19/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TokenProjectMarket",
                "kind": "LinkedField",
                "name": "tokenProjectMarket",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "TokenProject",
                    "kind": "LinkedField",
                    "name": "tokenProject",
                    "plural": false,
                    "selections": [
                      (v18/*: any*/),
                      (v19/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "relativeChange24",
                    "args": (v6/*: any*/),
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "pricePercentChange",
                    "plural": false,
                    "selections": [
                      (v12/*: any*/),
                      (v19/*: any*/)
                    ],
                    "storageKey": "pricePercentChange(duration:\"DAY\")"
                  },
                  (v19/*: any*/)
                ],
                "storageKey": null
              },
              (v19/*: any*/)
            ],
            "storageKey": null
          },
          (v19/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d866913367d9f768e3e9d2fc3a351481",
    "id": null,
    "metadata": {},
    "name": "PortfolioModel_PortfolioQuery",
    "operationKind": "query",
    "text": "query PortfolioModel_PortfolioQuery(\n  $ownerAddress: String!\n) {\n  portfolios(ownerAddresses: [$ownerAddress]) {\n    hourlyValues: tokensTotalDenominatedValueHistory(duration: HOUR) {\n      timestamp\n      close: value\n      id\n    }\n    dailyValues: tokensTotalDenominatedValueHistory(duration: DAY) {\n      timestamp\n      close: value\n      id\n    }\n    weeklyValues: tokensTotalDenominatedValueHistory(duration: WEEK) {\n      timestamp\n      close: value\n      id\n    }\n    monthlyValues: tokensTotalDenominatedValueHistory(duration: MONTH) {\n      timestamp\n      close: value\n      id\n    }\n    yearlyValues: tokensTotalDenominatedValueHistory(duration: YEAR) {\n      timestamp\n      close: value\n      id\n    }\n    tokenBalances {\n      quantity\n      denominatedValue {\n        currency\n        value\n        id\n      }\n      token {\n        chain\n        address\n        name\n        symbol\n        decimals\n        id\n      }\n      tokenProjectMarket {\n        tokenProject {\n          logoUrl\n          id\n        }\n        relativeChange24: pricePercentChange(duration: DAY) {\n          value\n          id\n        }\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "a42e0624be4e78c43a2a826684d9fa80";

export default node;
