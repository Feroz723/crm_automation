import { prisma } from '../../db';

/**
 * Increments the rate limit counter for a given organization and window (HOUR, DAY).
 * Uses a "lazy reset" strategy: if the current window has passed, the counter is reset.
 * Ensures concurrency safety via Prisma transactions and atomic updates.
 */
export async function incrementRateLimit(orgId: string, window: 'HOUR' | 'DAY') {
    const now = new Date();

    // Determine the window start time
    const windowStart = new Date(now);
    if (window === 'HOUR') {
        windowStart.setMinutes(0, 0, 0);
    } else {
        windowStart.setHours(0, 0, 0, 0);
    }

    try {
        await (prisma as any).$transaction(async (tx: any) => {
            // Find the limit record
            const limit = await tx.rateLimit.findUnique({
                where: { orgId_window: { orgId, window } }
            });

            if (!limit) {
                // Initialize if not exists
                await tx.rateLimit.create({
                    data: {
                        orgId,
                        window,
                        maxCount: window === 'HOUR' ? 50 : 500, // Default caps
                        currentCount: 1,
                        lastReset: now
                    }
                });
                return;
            }

            // Check if we need to reset the window
            const lastReset = new Date(limit.lastReset);
            if (lastReset < windowStart) {
                // Reset the window
                await tx.rateLimit.update({
                    where: { id: limit.id },
                    data: {
                        currentCount: 1,
                        lastReset: now
                    }
                });
            } else {
                // Atomic increment
                await tx.rateLimit.update({
                    where: { id: limit.id },
                    data: {
                        currentCount: { increment: 1 }
                    }
                });
            }
        });
    } catch (error) {
        console.error(`[RATE_LIMIT] Failed to increment ${window} limit for org ${orgId}:`, error);
        // We log but don't throw, as the execution already happened by the time this is called
        // or the check should have handled it.
    }
}
