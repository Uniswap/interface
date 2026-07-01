// Injected once into <head> for all AnimatedNumber web instances.
export const ANIMATED_NUMBER_CSS_RULE_ID = '__an_keyframes_v7__'

// --an-slide-pct is set per-digit via inline style.
export const ANIMATED_NUMBER_KEYFRAMES_CSS = `
@keyframes _anEnterUp {
  from { transform: translateY(var(--an-slide-pct, 50%)); opacity: 0; }
  to   { transform: translateY(0);                         opacity: 1; }
}
@keyframes _anExitUp {
  from { transform: translateY(0);                          opacity: 1; }
  to   { transform: translateY(calc(var(--an-slide-pct, 50%) * -1)); opacity: 0; }
}
@keyframes _anEnterDown {
  from { transform: translateY(calc(var(--an-slide-pct, 50%) * -1)); opacity: 0; }
  to   { transform: translateY(0);                                    opacity: 1; }
}
@keyframes _anExitDown {
  from { transform: translateY(0);                         opacity: 1; }
  to   { transform: translateY(var(--an-slide-pct, 50%));  opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  ._anEnterUp,._anExitUp,._anEnterDown,._anExitDown {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`
