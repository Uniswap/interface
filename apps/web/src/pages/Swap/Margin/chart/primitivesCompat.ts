// Series-primitive type seam. lightweight-charts v5 renames these interfaces (ISeriesPrimitive*
// → IPrimitive*); routing every primitive's imports through here isolates that rename to one file.
// CanvasRenderingTarget2D is unaffected and imported from `fancy-canvas` directly at use sites.
export type {
  ISeriesPrimitive,
  IPrimitivePaneView as ISeriesPrimitivePaneView,
  IPrimitivePaneRenderer as ISeriesPrimitivePaneRenderer,
} from 'lightweight-charts'
