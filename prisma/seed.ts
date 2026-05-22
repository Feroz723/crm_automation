import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clear existing data
    await prisma.activity.deleteMany({})
    await prisma.webhookLog.deleteMany({})
    await prisma.lead.deleteMany({})

    const leads = [
        {
            fullName: 'John Smith',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            phone: '+1 555-0101',
            source: 'facebook',
            status: 'won',
            score: 85,
            intent: 'high',
            notes: 'Interested in business automation software.',
            aiEnriched: true,
        },
        {
            fullName: 'Sarah Johnson',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.j@techcorp.io',
            phone: '+1 555-0102',
            source: 'google_ads',
            status: 'qualified',
            score: 72,
            intent: 'medium',
            notes: 'Looking for a CRM for a team of 50.',
            aiEnriched: true,
        },
        {
            fullName: 'Michael Chen',
            firstName: 'Michael',
            lastName: 'Chen',
            email: 'm.chen@startup.com',
            phone: '+1 555-0103',
            source: 'website',
            status: 'new',
            score: 45,
            intent: 'low',
            notes: 'Just browsing, but left contact info.',
            aiEnriched: true,
        },
        {
            fullName: 'Elena Rodriguez',
            firstName: 'Elena',
            lastName: 'Rodriguez',
            email: 'elena@marketing-pros.com',
            phone: '+1 555-0104',
            source: 'manual',
            status: 'proposal',
            score: 92,
            intent: 'high',
            notes: 'Met at the conference. Very interested in our enterprise plan.',
            aiEnriched: true,
        },
        {
            fullName: 'David Wilson',
            firstName: 'David',
            lastName: 'Wilson',
            email: 'dwilson@retailers.net',
            phone: '+1 555-0105',
            source: 'whatsapp',
            status: 'contacted',
            score: 60,
            intent: 'medium',
            notes: 'Inquired about integration with Shopify.',
            aiEnriched: true,
        },
        {
            fullName: 'Lisa Zhang',
            firstName: 'Lisa',
            lastName: 'Zhang',
            email: 'lisa@globaltrade.cn',
            phone: '+86 21 1234 5678',
            source: 'google_ads',
            status: 'lost',
            score: 30,
            intent: 'low',
            notes: 'Budget too low for our current offering.',
            aiEnriched: true,
        },
    ]

    for (const leadData of leads) {
        const lead = await prisma.lead.create({
            data: leadData,
        })

        // Add some activities for each lead
        await prisma.activity.create({
            data: {
                leadId: lead.id,
                type: 'enrichment',
                description: `Lead auto-enriched from ${lead.source}. Found LinkedIn profile and company size.`,
                metadata: { score: lead.score, source: lead.source },
            },
        })

        if (lead.status !== 'new') {
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: 'status_change',
                    description: `Status updated to ${lead.status}`,
                    metadata: { from: 'new', to: lead.status },
                },
            })
        }
    }

    console.log('✅ Seeding complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
