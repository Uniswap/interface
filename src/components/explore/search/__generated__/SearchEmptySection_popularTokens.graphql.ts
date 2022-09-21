/**
 * @generated SignedSource<<5b8cc093eff860d67263de5e61a6e5b4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type SearchEmptySection_popularTokens$data = ReadonlyArray<{
  readonly logoUrl: string | null;
  readonly tokens: ReadonlyArray<{
    readonly address: string | null;
    readonly chain: Chain;
    readonly name: string | null;
    readonly symbol: string | null;
  }>;
  readonly " $fragmentType": "SearchEmptySection_popularTokens";
}>;
export type SearchEmptySection_popularTokens$key = ReadonlyArray<{
  readonly " $data"?: SearchEmptySection_popularTokens$data;
  readonly " $fragmentSpreads": FragmentRefs<"SearchEmptySection_popularTokens">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "SearchEmptySection_popularTokens",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "logoUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Token",
      "kind": "LinkedField",
      "name": "tokens",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "chain",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "address",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "symbol",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "TokenProject",
  "abstractKey": null
};

(node as any).hash = "def3e1e00bfc31d4029caeda3f9a4df8";

export default node;
