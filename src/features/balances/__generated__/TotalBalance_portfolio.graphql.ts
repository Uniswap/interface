/**
 * @generated SignedSource<<7eca4cddfad9815c002906b77dc71a28>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TotalBalance_portfolio$data = {
  readonly absoluteChange24H: number | null;
  readonly assetsValueUSD: number | null;
  readonly relativeChange24H: number | null;
  readonly " $fragmentType": "TotalBalance_portfolio";
};
export type TotalBalance_portfolio$key = {
  readonly " $data"?: TotalBalance_portfolio$data;
  readonly " $fragmentSpreads": FragmentRefs<"TotalBalance_portfolio">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TotalBalance_portfolio",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "assetsValueUSD",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "absoluteChange24H",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "relativeChange24H",
      "storageKey": null
    }
  ],
  "type": "Portfolio",
  "abstractKey": null
};

(node as any).hash = "8249c9594ed2d20657eff87ae9a8d087";

export default node;
