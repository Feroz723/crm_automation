import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { OutreachDraft, AIMetadata } from '../types';

/**
 * Generates an AI-powered outreach email draft.
 * Inputs include lead details, AI meta-analysis, and review state.
 */
export async function generateOutreachDraft(
    leadData: {
        fullName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        source?: string;
        message?: string | null;
        intent?: string | null;
        score?: number;
    },
    aiMetadata?: AIMetadata
): Promise<OutreachDraft> {
    const name = leadData.fullName || `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim();

    const contextPrompt = `
Lead Context:
- Name: ${name || 'Prospective Client'}
- Source: ${leadData.source || 'Direct Inquiry'}
- Original Message: ${leadData.message || 'No initial message provided'}
- AI Score: ${leadData.score || 'Not scored'}/100
- AI Intent Level: ${leadData.intent || 'Unknown'}
- AI Reasoning: ${aiMetadata?.scoringReasoning || 'N/A'}

Instruction:
You are a top-performing Sales Development Representative (SDR). Your goal is to write a highly personalized, non-spammy outreach email that references the lead's specific source and message (if available). 

The tone should be consultative and helpful, not pushy. If the lead score is high, be more direct about scheduling a call. If the score is low or intent is unclear, focus on discovery and providing value first.

Respond with ONLY a JSON object:
{
  "email": {
    "subject": "Compelling, short subject line",
    "body": "The full email body. Use [Your Name] and [Your Company] as placeholders.",
    "tone": "formal|friendly|consultative",
    "generatedAt": "ISO timestamp"
  }
}`;

    try {
        const response = await retryWithBackoff(() =>
            getAICompletion(contextPrompt, { maxTokens: 1000, temperature: 0.7 })
        );

        const result = extractJSON<OutreachDraft>(response);

        return {
            email: {
                subject: result.email?.subject || 'Re: Your inquiry',
                body: result.email?.body || 'Hello [Name], thanks for reaching out. How can we help?',
                tone: result.email?.tone || 'consultative',
                generatedAt: new Date().toISOString(),
                status: 'pending'
            }
        };
    } catch (error) {
        console.error('Outreach draft generation failed:', error);

        // Fallback draft
        return {
            email: {
                subject: `Quick question regarding your interest from ${leadData.source || 'our website'}`,
                body: `Hello ${name || 'there'},\n\nI saw you reached out via ${leadData.source || 'our platform'} and wanted to follow up. Do you have 5 minutes this week to discuss your needs?\n\nBest regards,\n[Your Name]`,
                tone: 'consultative',
                generatedAt: new Date().toISOString(),
                status: 'pending'
            }
        };
    }
}
