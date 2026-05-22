import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { EnrichmentResult } from '../types';

/**
 * Enriches lead data using AI
 * - Splits full name into first/last name
 * - Predicts missing information
 * - Generates buying intent
 * - Categorizes lead type
 * - Maps interests and pain points
 * - Recommends next action
 */
export async function enrichLead(leadData: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    message?: string;
    source?: string;
}): Promise<EnrichmentResult> {
    const prompt = `You are a lead enrichment AI for a CRM system. Analyze the following lead data and provide enrichment.

Lead Data:
${JSON.stringify(leadData, null, 2)}

Tasks:
1. If fullName is provided but firstName/lastName are missing, split the name intelligently
2. Analyze the message (if provided) to determine:
   - Buying intent (high/medium/low)
   - Lead category (enterprise/smb/individual)
   - Interests and pain points mentioned
   - Urgency level
3. Recommend the next best action for this lead

Respond with ONLY a JSON object in this exact format:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "intent": "high|medium|low",
  "intentReasoning": "detailed explanation for the intent level",
  "category": "enterprise|smb|individual",
  "interests": ["interest1", "interest2"],
  "painPoints": ["pain1", "pain2"],
  "nextAction": "recommended action description",
  "nextActionReasoning": "why this specific action is recommended"
}`;

    try {
        const response = await retryWithBackoff(() =>
            getAICompletion(prompt, { maxTokens: 800, temperature: 0.3 })
        );

        const enrichment = extractJSON<EnrichmentResult>(response);

        // Validate and sanitize
        return {
            firstName: enrichment.firstName || leadData.firstName || null,
            lastName: enrichment.lastName || leadData.lastName || null,
            intent: enrichment.intent || 'medium',
            intentReasoning: enrichment.intentReasoning || 'Intent detected based on message sentiment and urgency',
            category: enrichment.category || 'individual',
            interests: Array.isArray(enrichment.interests) ? enrichment.interests : [],
            painPoints: Array.isArray(enrichment.painPoints) ? enrichment.painPoints : [],
            nextAction: enrichment.nextAction || 'Follow up with initial outreach email',
            nextActionReasoning: enrichment.nextActionReasoning || 'Standard next step for new leads',
        };
    } catch (error) {
        console.error('Lead enrichment failed:', error);

        // Return fallback enrichment
        return {
            firstName: leadData.firstName || leadData.fullName?.split(' ')[0] || null,
            lastName: leadData.lastName || leadData.fullName?.split(' ').slice(1).join(' ') || null,
            intent: 'medium',
            category: 'individual',
            interests: [],
            painPoints: [],
            nextAction: 'Review lead and send initial outreach',
        };
    }
}
