# Ruflo Plan: Accessibility Fixes

## Scope
Address accessibility (specifically motion sensitivity) concerns raised in the GStack review.

## Plan
1. **`NeuralPulse.tsx`**: Update animation settings to respect `prefers-reduced-motion` using media queries or component props.
2. **Global Audit**: Check `WebOSShell.tsx` and `AIBrain.tsx` for other critical animations.
3. **Action**: Implement CSS and component-level motion reduction.
4. **Review**: Verify with `npx tsc`.
5. **Commit**: Finalize with `DECISIONS.md` update.
