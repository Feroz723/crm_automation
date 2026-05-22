import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { LeadSummaryResult } from '../types';

/**
 * Generates comprehensive AI-powered lead summary with:
 * - Executive summary
 * - Urgency assessment
 * - Potential objections
 * - Sales strategy
 * - Timeline prediction
 * - Key talking points
 */
export async function generateLeadSummary(leadData: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    source?: string;
    message?: string;
    intent?: string;
    score?: number;
}): Promise<LeadSummaryResult> {
    const name = leadData.fullName || `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim();

    const prompt = `You are a sales intelligence AI. Create a comprehensive lead summary for the sales team.

Lead Profile:
- Name: ${name || 'Unknown'}
- Email: ${leadData.email || 'Not provided'}
- Phone: ${leadData.phone || 'Not provided'}
- Source: ${leadData.source || 'Unknown'}
- Message: ${leadData.message || 'No message provided'}
- Intent Level: ${leadData.intent || 'Unknown'}
- Lead Score: ${leadData.score || 'Not scored'}/100

Create a sales summary with actionable insights.

Respond with ONLY a JSON object:
{
  "summary": "2-3 sentence executive summary of this lead",
  "urgency": "hot|warm|cold",
  "objections": ["potential objection 1", "potential objection 2"],
  "strategy": "Recommended sales approach and strategy",
  "timeline": "Expected timeline for conversion (e.g. '2-3 weeks', '1 month')",
  "talkingPoints": ["key point 1", "key point 2", "key point 3"]
}`;

    try {
        const response = await retryWithBackoff(() =>
            getAICompletion(prompt, { maxTokens: 800, temperature: 0.5 })
        );

        const summary = extractJSON<LeadSummaryResult>(response);

        return {
            summary: summary.summary || `Lead from ${leadData.source || 'unknown source'}`,
            urgency: summary.urgency || 'warm',
            objections: Array.isArray(summary.objections) ? summary.objections : [],
            strategy: summary.strategy || 'Standard follow-up process',
            timeline: summary.timeline || 'Unknown',
            talkingPoints: Array.isArray(summary.talkingPoints) ? summary.talkingPoints : [],
        };
    } catch (error) {
        console.error('Lead summary generation failed:', error);

        // Fallback summary
        const urgency = (leadData.score || 0) > 70 ? 'hot' : (leadData.score || 0) > 40 ? 'warm' : 'cold';

        return {
            summary: `${name || 'Lead'} from ${leadData.source || 'unknown source'}. ${leadData.message ? 'Has expressed interest.' : 'Awaiting contact.'}`,
            urgency,
            objections: ['May need more information', 'Budget concerns possible'],
            strategy: 'Initial outreach to understand needs and qualify',
            timeline: urgency === 'hot' ? '1-2 weeks' : '2-4 weeks',
            talkingPoints: [
                'Understand their current situation',
                'Identify pain points',
                'Present relevant solutions',
            ],
        };
    }
}
