/**
 * HubSpot CRM Integration
 * Syncs leads to HubSpot Free CRM
 */

export interface HubSpotContact {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    lead_source?: string;
    lead_score?: number;
    lead_status?: string;
    notes?: string;
}

/**
 * Create or update contact in HubSpot
 */
export async function syncToHubSpot(
    leadData: HubSpotContact
): Promise<{ success: boolean; contactId?: string; error?: string }> {
    const apiKey = process.env.HUBSPOT_API_KEY;

    if (!apiKey) {
        throw new Error('HUBSPOT_API_KEY is not configured');
    }

    try {
        // Check if contact exists
        const existingContact = await searchHubSpotContact(leadData.email);

        if (existingContact) {
            // Update existing contact
            const response = await fetch(
                `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        properties: formatProperties(leadData),
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HubSpot update failed: ${error}`);
            }

            const result = await response.json() as any;
            return { success: true, contactId: result.id };
        } else {
            // Create new contact
            const response = await fetch(
                'https://api.hubapi.com/crm/v3/objects/contacts',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        properties: formatProperties(leadData),
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HubSpot creation failed: ${error}`);
            }

            const result = await response.json() as any;
            return { success: true, contactId: result.id };
        }
    } catch (error: any) {
        console.error('HubSpot sync error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Search for contact by email
 */
async function searchHubSpotContact(
    email: string
): Promise<{ id: string } | null> {
    const apiKey = process.env.HUBSPOT_API_KEY;

    try {
        const response = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts/search`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filterGroups: [
                        {
                            filters: [
                                {
                                    propertyName: 'email',
                                    operator: 'EQ',
                                    value: email,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            return null;
        }

        const result = await response.json() as any;
        return result.results?.[0] || null;
    } catch (error) {
        console.error('HubSpot search error:', error);
        return null;
    }
}

/**
 * Format lead data to HubSpot properties
 */
function formatProperties(leadData: HubSpotContact): Record<string, any> {
    const properties: Record<string, any> = {};

    if (leadData.email) properties.email = leadData.email;
    if (leadData.firstname) properties.firstname = leadData.firstname;
    if (leadData.lastname) properties.lastname = leadData.lastname;
    if (leadData.phone) properties.phone = leadData.phone;
    if (leadData.lead_source) properties.lead_source = leadData.lead_source;
    if (leadData.lead_score) properties.lead_score = leadData.lead_score.toString();
    if (leadData.lead_status) properties.hs_lead_status = leadData.lead_status;
    if (leadData.notes) properties.notes = leadData.notes;

    return properties;
}

/**
 * Retry sync with exponential backoff
 */
export async function syncToHubSpotWithRetry(
    leadData: HubSpotContact,
    maxRetries = 3
): Promise<{ success: boolean; contactId?: string; error?: string }> {
    let lastError: string | undefined;

    for (let i = 0; i < maxRetries; i++) {
        const result = await syncToHubSpot(leadData);

        if (result.success) {
            return result;
        }

        lastError = result.error;

        // Wait before retry (exponential backoff)
        if (i < maxRetries - 1) {
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return { success: false, error: lastError || 'All retry attempts failed' };
}
