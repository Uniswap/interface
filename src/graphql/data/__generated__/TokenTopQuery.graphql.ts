/**
 * @generated SignedSource<<7aa77d8c04d20a9e285b229baa803466>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type HistoryDuration = "DAY" | "HOUR" | "MAX" | "MONTH" | "WEEK" | "YEAR" | "%future added value";
export type TokenTopQuery$variables = {
  duration: HistoryDuration;
  page: number;
};
export type TokenTopQuery$data = {
  readonly topTokenProjects: ReadonlyArray<{
    readonly description: string | null;
    readonly homepageUrl: string | null;
    readonly markets: ReadonlyArray<{
      readonly fullyDilutedMarketCap: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly marketCap: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly price: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly priceHigh52W: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly priceLow52W: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly pricePercentChange1M: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly pricePercentChange1W: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly pricePercentChange1Y: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly pricePercentChange24h: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume1D: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume1M: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume1W: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume1Y: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
    } | null> | null;
    readonly name: string | null;
    readonly prices: ReadonlyArray<{
      readonly " $fragmentSpreads": FragmentRefs<"TokenPrices">;
    } | null> | null;
    readonly tokens: ReadonlyArray<{
      readonly address: string | null;
      readonly chain: Chain;
      readonly symbol: string | null;
    }>;
    readonly twitterName: string | null;
  } | null> | null;
};
export type TokenTopQuery = {
  response: TokenTopQuery$data;
  variables: TokenTopQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "duration"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "page"
},
v2 = [
  {
    "kind": "Literal",
    "name": "currency",
    "value": "USD"
  },
  {
    "kind": "Literal",
    "name": "orderBy",
    "value": "MARKET_CAP"
  },
  {
    "kind": "Variable",
    "name": "page",
    "variableName": "page"
  },
  {
    "kind": "Literal",
    "name": "pageSize",
    "value": 20
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "homepageUrl",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "twitterName",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v10 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": [
      "USD"
    ]
  }
],
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v13 = [
  (v11/*: any*/),
  (v12/*: any*/)
],
v14 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v15 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "WEEK"
  }
],
v16 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "MONTH"
  }
],
v17 = {
  "kind": "Literal",
  "name": "duration",
  "value": "YEAR"
},
v18 = [
  (v17/*: any*/)
],
v19 = [
  (v12/*: any*/),
  (v11/*: any*/)
],
v20 = [
  (v17/*: any*/),
  {
    "kind": "Literal",
    "name": "highLow",
    "value": "HIGH"
  }
],
v21 = [
  (v17/*: any*/),
  {
    "kind": "Literal",
    "name": "highLow",
    "value": "LOW"
  }
],
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v23 = [
  (v11/*: any*/),
  (v12/*: any*/),
  (v22/*: any*/)
],
v24 = [
  (v12/*: any*/),
  (v11/*: any*/),
  (v22/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TokenTopQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": "prices",
            "args": (v10/*: any*/),
            "concreteType": "TokenProjectMarket",
            "kind": "LinkedField",
            "name": "markets",
            "plural": true,
            "selections": [
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "TokenPrices"
              }
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          {
            "alias": null,
            "args": (v10/*: any*/),
            "concreteType": "TokenProjectMarket",
            "kind": "LinkedField",
            "name": "markets",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume1D",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "volume1W",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": "volume(duration:\"WEEK\")"
              },
              {
                "alias": "volume1M",
                "args": (v16/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": "volume(duration:\"MONTH\")"
              },
              {
                "alias": "volume1Y",
                "args": (v18/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": "volume(duration:\"YEAR\")"
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange24h",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": null
              },
              {
                "alias": "pricePercentChange1W",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"WEEK\")"
              },
              {
                "alias": "pricePercentChange1M",
                "args": (v16/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"MONTH\")"
              },
              {
                "alias": "pricePercentChange1Y",
                "args": (v18/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"YEAR\")"
              },
              {
                "alias": "priceHigh52W",
                "args": (v20/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": (v21/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v13/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              }
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
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
    "name": "TokenTopQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v22/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": "prices",
            "args": (v10/*: any*/),
            "concreteType": "TokenProjectMarket",
            "kind": "LinkedField",
            "name": "markets",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": [
                  {
                    "kind": "Variable",
                    "name": "duration",
                    "variableName": "duration"
                  }
                ],
                "concreteType": "TimestampedAmount",
                "kind": "LinkedField",
                "name": "priceHistory",
                "plural": true,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "timestamp",
                    "storageKey": null
                  },
                  (v11/*: any*/),
                  (v22/*: any*/)
                ],
                "storageKey": null
              },
              (v22/*: any*/)
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          {
            "alias": null,
            "args": (v10/*: any*/),
            "concreteType": "TokenProjectMarket",
            "kind": "LinkedField",
            "name": "markets",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume1D",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "volume1W",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": "volume(duration:\"WEEK\")"
              },
              {
                "alias": "volume1M",
                "args": (v16/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": "volume(duration:\"MONTH\")"
              },
              {
                "alias": "volume1Y",
                "args": (v18/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": "volume(duration:\"YEAR\")"
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange24h",
                "plural": false,
                "selections": (v24/*: any*/),
                "storageKey": null
              },
              {
                "alias": "pricePercentChange1W",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v24/*: any*/),
                "storageKey": "pricePercentChange(duration:\"WEEK\")"
              },
              {
                "alias": "pricePercentChange1M",
                "args": (v16/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v24/*: any*/),
                "storageKey": "pricePercentChange(duration:\"MONTH\")"
              },
              {
                "alias": "pricePercentChange1Y",
                "args": (v18/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v24/*: any*/),
                "storageKey": "pricePercentChange(duration:\"YEAR\")"
              },
              {
                "alias": "priceHigh52W",
                "args": (v20/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": (v21/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v23/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              },
              (v22/*: any*/)
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          (v22/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "fae835083112be8df71fc251b3547fb7",
    "id": null,
    "metadata": {},
    "name": "TokenTopQuery",
    "operationKind": "query",
    "text": "query TokenTopQuery(\n  $page: Int!\n  $duration: HistoryDuration!\n) {\n  topTokenProjects(orderBy: MARKET_CAP, pageSize: 20, currency: USD, page: $page) {\n    description\n    homepageUrl\n    twitterName\n    name\n    tokens {\n      chain\n      address\n      symbol\n      id\n    }\n    prices: markets(currencies: [USD]) {\n      ...TokenPrices\n      id\n    }\n    markets(currencies: [USD]) {\n      price {\n        value\n        currency\n        id\n      }\n      marketCap {\n        value\n        currency\n        id\n      }\n      fullyDilutedMarketCap {\n        value\n        currency\n        id\n      }\n      volume1D: volume(duration: DAY) {\n        value\n        currency\n        id\n      }\n      volume1W: volume(duration: WEEK) {\n        value\n        currency\n        id\n      }\n      volume1M: volume(duration: MONTH) {\n        value\n        currency\n        id\n      }\n      volume1Y: volume(duration: YEAR) {\n        value\n        currency\n        id\n      }\n      pricePercentChange24h {\n        currency\n        value\n        id\n      }\n      pricePercentChange1W: pricePercentChange(duration: WEEK) {\n        currency\n        value\n        id\n      }\n      pricePercentChange1M: pricePercentChange(duration: MONTH) {\n        currency\n        value\n        id\n      }\n      pricePercentChange1Y: pricePercentChange(duration: YEAR) {\n        currency\n        value\n        id\n      }\n      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {\n        value\n        currency\n        id\n      }\n      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {\n        value\n        currency\n        id\n      }\n      id\n    }\n    id\n  }\n}\n\nfragment TokenPrices on TokenProjectMarket {\n  priceHistory(duration: $duration) {\n    timestamp\n    value\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "5fd6aaee7e09d7cee2bb126cd160ef0b";

export default node;
