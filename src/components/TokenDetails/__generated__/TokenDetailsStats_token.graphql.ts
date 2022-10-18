/**
 * @generated SignedSource<<eb06119ce294e2c68de9de2d1641615d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TokenDetailsStats_token$data = {
  readonly market: {
    readonly volume: {
      readonly value: number;
    };
  };
  readonly " $fragmentType": "TokenDetailsStats_token";
} | null;
export type TokenDetailsStats_token$key = {
  readonly " $data"?: TokenDetailsStats_token$data;
  readonly " $fragmentSpreads": FragmentRefs<"TokenDetailsStats_token">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TokenDetailsStats_token",
  "selections": [
    {
      "kind": "RequiredField",
      "field": {
        "alias": null,
        "args": [
          {
            "kind": "Literal",
            "name": "currency",
            "value": "USD"
          }
        ],
        "concreteType": "TokenMarket",
        "kind": "LinkedField",
        "name": "market",
        "plural": false,
        "selections": [
          {
            "kind": "RequiredField",
            "field": {
              "alias": null,
              "args": [
                {
                  "kind": "Literal",
                  "name": "duration",
                  "value": "DAY"
                }
              ],
              "concreteType": "Amount",
              "kind": "LinkedField",
              "name": "volume",
              "plural": false,
              "selections": [
                {
                  "kind": "RequiredField",
                  "field": {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "value",
                    "storageKey": null
                  },
                  "action": "LOG",
                  "path": "market.volume.value"
                }
              ],
              "storageKey": "volume(duration:\"DAY\")"
            },
            "action": "LOG",
            "path": "market.volume"
          }
        ],
        "storageKey": "market(currency:\"USD\")"
      },
      "action": "LOG",
      "path": "market"
    }
  ],
  "type": "Token",
  "abstractKey": null
};

(node as any).hash = "8dcf2f674de90c62c09e4c27089b4ffe";

export default node;
