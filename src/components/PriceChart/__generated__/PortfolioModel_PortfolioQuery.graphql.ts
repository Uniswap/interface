/**
 * @generated SignedSource<<ebc97d253eda6172520bd16a21ecdb61>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type PortfolioModel_PortfolioQuery$variables = {
  ownerAddress: string;
};
export type PortfolioModel_PortfolioQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly dailyValues: ReadonlyArray<{
      readonly close: number | null;
      readonly timestamp: number;
    } | null> | null;
    readonly hourlyValues: ReadonlyArray<{
      readonly close: number | null;
      readonly timestamp: number;
    } | null> | null;
    readonly monthlyValues: ReadonlyArray<{
      readonly close: number | null;
      readonly timestamp: number;
    } | null> | null;
    readonly weeklyValues: ReadonlyArray<{
      readonly close: number | null;
      readonly timestamp: number;
    } | null> | null;
    readonly yearlyValues: ReadonlyArray<{
      readonly close: number | null;
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
  "name": "id",
  "storageKey": null
},
v11 = [
  (v3/*: any*/),
  (v4/*: any*/),
  (v10/*: any*/)
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
            "selections": (v11/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"HOUR\")"
          },
          {
            "alias": "dailyValues",
            "args": (v6/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v11/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"DAY\")"
          },
          {
            "alias": "weeklyValues",
            "args": (v7/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v11/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"WEEK\")"
          },
          {
            "alias": "monthlyValues",
            "args": (v8/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v11/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"MONTH\")"
          },
          {
            "alias": "yearlyValues",
            "args": (v9/*: any*/),
            "concreteType": "TimestampedAmount",
            "kind": "LinkedField",
            "name": "tokensTotalDenominatedValueHistory",
            "plural": true,
            "selections": (v11/*: any*/),
            "storageKey": "tokensTotalDenominatedValueHistory(duration:\"YEAR\")"
          },
          (v10/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "eda9fd00be7b66834cfe676bfe06d799",
    "id": null,
    "metadata": {},
    "name": "PortfolioModel_PortfolioQuery",
    "operationKind": "query",
    "text": "query PortfolioModel_PortfolioQuery(\n  $ownerAddress: String!\n) {\n  portfolios(ownerAddresses: [$ownerAddress]) {\n    hourlyValues: tokensTotalDenominatedValueHistory(duration: HOUR) {\n      timestamp\n      close: value\n      id\n    }\n    dailyValues: tokensTotalDenominatedValueHistory(duration: DAY) {\n      timestamp\n      close: value\n      id\n    }\n    weeklyValues: tokensTotalDenominatedValueHistory(duration: WEEK) {\n      timestamp\n      close: value\n      id\n    }\n    monthlyValues: tokensTotalDenominatedValueHistory(duration: MONTH) {\n      timestamp\n      close: value\n      id\n    }\n    yearlyValues: tokensTotalDenominatedValueHistory(duration: YEAR) {\n      timestamp\n      close: value\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "08a514c8f5a5cd0ff8344e2bfe7e8bc1";

export default node;
