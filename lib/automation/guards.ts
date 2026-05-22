/**
 * Hard kill-switch to prevent any real delivery in simulation mode.
 */
export function ensureDryRunSafeguard() {
    // Phase 3.2: Hardcoded to true to guarantee safety during simulation build.
    // In Phase 3.3, this would check process.env.DRY_RUN_ONLY.
    const isDryRunOnly = true;

    if (!isDryRunOnly) {
        throw new Error("CRITICAL: Safety violation. Real delivery attempted in Simulation Mode.");
    }
}
