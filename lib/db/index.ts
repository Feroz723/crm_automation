import { PrismaClient } from '@prisma/client'

// PrismaClient singleton for optimal connection management
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const basePrisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma

/**
 * Resolves the current organization context.
 */
async function getTenantContext() {
    return 'global-demo-org';
}

/**
 * Tenant-Aware Prisma Client (Extended)
 * Automatically injects orgId into all queries.
 */
export const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }: { model: string, operation: string, args: any, query: any }) {
                // Models that are global or system-scoped and do NOT have an orgId
                const globalModels = ['WebhookLog', 'IntegrationToken', 'User', 'Organization'];

                if (globalModels.includes(model)) {
                    return query(args);
                }

                const orgId = await getTenantContext();

                if (!orgId) {
                    throw new Error(`[TENANT_ISOLATION] Denied: No orgId resolved for ${model}.${operation}`);
                }

                // Inject orgId into 'where' for read/update/delete operations
                if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                    args.where = { ...args.where, orgId };
                }

                // Inject orgId into 'data' for create/upsert operations
                if (['create', 'createMany', 'upsert'].includes(operation)) {
                    if (operation === 'upsert') {
                        args.create = { ...args.create, orgId };
                        args.update = { ...args.update, orgId };
                    } else if (operation === 'createMany') {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((item: any) => ({ ...item, orgId }));
                        }
                    } else {
                        args.data = { ...args.data, orgId };
                    }
                }

                return query(args);
            },
        },
    },
}) as any;

export default prisma;
