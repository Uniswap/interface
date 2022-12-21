/**
 * @generated SignedSource<<dc1991496a8771135eeb8d740526198b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type TokenRowQuery$variables = {
  contract: ContractInput;
};
export type TokenRowQuery$data = {
  readonly tokenProjects: ReadonlyArray<{
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
    } | null> | null;
  } | null> | null;
};
export type TokenRowQuery = {
  response: TokenRowQuery$data;
  variables: TokenRowQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "contract"
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
    "name": "currencies",
    "value": [
      "USD"
    ]
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
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
    "value": "HOUR"
  }
],
v7 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v8 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "WEEK"
  }
],
v9 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "MONTH"
  }
],
v10 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "YEAR"
  }
],
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v12 = [
  (v3/*: any*/),
  (v4/*: any*/),
  (v11/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TokenRowQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "tokenProjects",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": (v2/*: any*/),
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
                "selections": (v5/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume1H",
                "args": (v6/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": "volume(duration:\"HOUR\")"
              },
              {
                "alias": "volume1D",
                "args": (v7/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "volume1W",
                "args": (v8/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": "volume(duration:\"WEEK\")"
              },
              {
                "alias": "volume1M",
                "args": (v9/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": "volume(duration:\"MONTH\")"
              },
              {
                "alias": "volume1Y",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": "volume(duration:\"YEAR\")"
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
    "name": "TokenRowQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "tokenProjects",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": (v2/*: any*/),
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
                "selections": (v12/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume1H",
                "args": (v6/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": "volume(duration:\"HOUR\")"
              },
              {
                "alias": "volume1D",
                "args": (v7/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "volume1W",
                "args": (v8/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": "volume(duration:\"WEEK\")"
              },
              {
                "alias": "volume1M",
                "args": (v9/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": "volume(duration:\"MONTH\")"
              },
              {
                "alias": "volume1Y",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v12/*: any*/),
                "storageKey": "volume(duration:\"YEAR\")"
              },
              (v11/*: any*/)
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          (v11/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "137a87da1d5dcbb3b47e251a570a990c",
    "id": null,
    "metadata": {},
    "name": "TokenRowQuery",
    "operationKind": "query",
    "text": "query TokenRowQuery(\n  $contract: ContractInput!\n) {\n  tokenProjects(contracts: [$contract]) {\n    markets(currencies: [USD]) {\n      price {\n        value\n        currency\n        id\n      }\n      marketCap {\n        value\n        currency\n        id\n      }\n      fullyDilutedMarketCap {\n        value\n        currency\n        id\n      }\n      volume1H: volume(duration: HOUR) {\n        value\n        currency\n        id\n      }\n      volume1D: volume(duration: DAY) {\n        value\n        currency\n        id\n      }\n      volume1W: volume(duration: WEEK) {\n        value\n        currency\n        id\n      }\n      volume1M: volume(duration: MONTH) {\n        value\n        currency\n        id\n      }\n      volume1Y: volume(duration: YEAR) {\n        value\n        currency\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "ec9ac25a0fc7bb72451814c7b7db5307";

export default node;
