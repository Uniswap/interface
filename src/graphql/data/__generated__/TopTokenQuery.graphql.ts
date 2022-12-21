/**
 * @generated SignedSource<<7efa70367eff21d597d6b255c2e782c2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type TopTokenQuery$variables = {
  page: number;
};
export type TopTokenQuery$data = {
  readonly topTokenProjects: ReadonlyArray<{
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
      readonly pricePercentChange1H: {
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
      readonly pricePercentChangeAll: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume1D: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume1H: {
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
      readonly volumeAll: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
    } | null> | null;
    readonly name: string | null;
    readonly tokens: ReadonlyArray<{
      readonly address: string | null;
      readonly chain: Chain;
      readonly symbol: string | null;
    }>;
  } | null> | null;
};
export type TopTokenQuery = {
  response: TopTokenQuery$data;
  variables: TopTokenQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "page"
  }
],
v1 = [
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
    "value": 100
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v6 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": [
      "USD"
    ]
  }
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v9 = [
  (v7/*: any*/),
  (v8/*: any*/)
],
v10 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "HOUR"
  }
],
v11 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v12 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "WEEK"
  }
],
v13 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "MONTH"
  }
],
v14 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "YEAR"
  }
],
v15 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "MAX"
  }
],
v16 = [
  (v8/*: any*/),
  (v7/*: any*/)
],
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v18 = [
  (v7/*: any*/),
  (v8/*: any*/),
  (v17/*: any*/)
],
v19 = [
  (v8/*: any*/),
  (v7/*: any*/),
  (v17/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TopTokenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v6/*: any*/),
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
                "selections": (v9/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume1H",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"HOUR\")"
              },
              {
                "alias": "volume1D",
                "args": (v11/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "volume1W",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"WEEK\")"
              },
              {
                "alias": "volume1M",
                "args": (v13/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"MONTH\")"
              },
              {
                "alias": "volume1Y",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"YEAR\")"
              },
              {
                "alias": "volumeAll",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"MAX\")"
              },
              {
                "alias": "pricePercentChange1H",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v16/*: any*/),
                "storageKey": "pricePercentChange(duration:\"HOUR\")"
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange24h",
                "plural": false,
                "selections": (v16/*: any*/),
                "storageKey": null
              },
              {
                "alias": "pricePercentChange1W",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v16/*: any*/),
                "storageKey": "pricePercentChange(duration:\"WEEK\")"
              },
              {
                "alias": "pricePercentChange1M",
                "args": (v13/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v16/*: any*/),
                "storageKey": "pricePercentChange(duration:\"MONTH\")"
              },
              {
                "alias": "pricePercentChange1Y",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v16/*: any*/),
                "storageKey": "pricePercentChange(duration:\"YEAR\")"
              },
              {
                "alias": "pricePercentChangeAll",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v16/*: any*/),
                "storageKey": "pricePercentChange(duration:\"MAX\")"
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TopTokenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "topTokenProjects",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v17/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v6/*: any*/),
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
                "selections": (v18/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume1H",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": "volume(duration:\"HOUR\")"
              },
              {
                "alias": "volume1D",
                "args": (v11/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "volume1W",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": "volume(duration:\"WEEK\")"
              },
              {
                "alias": "volume1M",
                "args": (v13/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": "volume(duration:\"MONTH\")"
              },
              {
                "alias": "volume1Y",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": "volume(duration:\"YEAR\")"
              },
              {
                "alias": "volumeAll",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v18/*: any*/),
                "storageKey": "volume(duration:\"MAX\")"
              },
              {
                "alias": "pricePercentChange1H",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"HOUR\")"
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
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"WEEK\")"
              },
              {
                "alias": "pricePercentChange1M",
                "args": (v13/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"MONTH\")"
              },
              {
                "alias": "pricePercentChange1Y",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"YEAR\")"
              },
              {
                "alias": "pricePercentChangeAll",
                "args": (v15/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "pricePercentChange(duration:\"MAX\")"
              },
              (v17/*: any*/)
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          (v17/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "5da995aaabc418c9bf31b10229138069",
    "id": null,
    "metadata": {},
    "name": "TopTokenQuery",
    "operationKind": "query",
    "text": "query TopTokenQuery(\n  $page: Int!\n) {\n  topTokenProjects(orderBy: MARKET_CAP, pageSize: 100, currency: USD, page: $page) {\n    name\n    tokens {\n      chain\n      address\n      symbol\n      id\n    }\n    markets(currencies: [USD]) {\n      price {\n        value\n        currency\n        id\n      }\n      marketCap {\n        value\n        currency\n        id\n      }\n      fullyDilutedMarketCap {\n        value\n        currency\n        id\n      }\n      volume1H: volume(duration: HOUR) {\n        value\n        currency\n        id\n      }\n      volume1D: volume(duration: DAY) {\n        value\n        currency\n        id\n      }\n      volume1W: volume(duration: WEEK) {\n        value\n        currency\n        id\n      }\n      volume1M: volume(duration: MONTH) {\n        value\n        currency\n        id\n      }\n      volume1Y: volume(duration: YEAR) {\n        value\n        currency\n        id\n      }\n      volumeAll: volume(duration: MAX) {\n        value\n        currency\n        id\n      }\n      pricePercentChange1H: pricePercentChange(duration: HOUR) {\n        currency\n        value\n        id\n      }\n      pricePercentChange24h {\n        currency\n        value\n        id\n      }\n      pricePercentChange1W: pricePercentChange(duration: WEEK) {\n        currency\n        value\n        id\n      }\n      pricePercentChange1M: pricePercentChange(duration: MONTH) {\n        currency\n        value\n        id\n      }\n      pricePercentChange1Y: pricePercentChange(duration: YEAR) {\n        currency\n        value\n        id\n      }\n      pricePercentChangeAll: pricePercentChange(duration: MAX) {\n        currency\n        value\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "79e58c6a1c4c90740f7f01997ff176a1";

export default node;
