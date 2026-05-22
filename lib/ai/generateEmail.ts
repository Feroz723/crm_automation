import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { EmailGenerationResult, EmailVariant } from '../types';

/**
 * Generates 3 email variants for lead outreach:
 * 1. Initial outreach - personalized introduction
 * 2. Follow-up - contextual follow-up
 * 3. Reactivation - re-engagement for cold leads
 */
export async function generateEmail(leadData: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    message?: string;
    source?: string;
    intent?: string;
}): Promise<EmailGenerationResult> {
    const firstName = leadData.firstName || leadData.fullName?.split(' ')[0] || 'there';

    const prompt = `You are an expert email copywriter for a sales team. Generate 3 professional email variants for this lead.

Lead Information:
- Name: ${firstName}
- Source: ${leadData.source || 'website'}
- Message: ${leadData.message || 'No message provided'}
- Intent: ${leadData.intent || 'medium'}

Generate 3 email variants:

1. INITIAL OUTREACH: First contact email
   - Personalized based on their source and message
   - Professional but friendly tone
   - Clear value proposition
   - Strong call-to-action

2. FOLLOW-UP: Second touchpoint
   - Reference previous email
   - Add additional value
   - Create urgency
   - Easy next step

3. REACTIVATION: For leads gone cold
   - Re-spark interest
   - New angle or value
   - Low-pressure approach
   - Simple engagement ask

Respond with ONLY a JSON object:
{
  "emails": [
    {
      "variant": "initial",
      "subject": "Subject line for initial email",
      "body": "Email body with proper formatting. Use \\n for line breaks."
    },
    {
      "variant": "followup",
      "subject": "Subject line for follow-up",
      "body": "Follow-up email body"
    },
    {
      "variant": "reactivation",
      "subject": "Subject line for reactivation",
      "body": "Reactivation email body"
    }
  ]
}`;

    try {
        const response = await retryWithBackoff(() =>
            getAICompletion(prompt, { maxTokens: 1500, temperature: 0.7 })
        );

        const result = extractJSON<EmailGenerationResult>(response);

        return {
            emails: result.emails || generateFallbackEmails(firstName, leadData),
        };
    } catch (error) {
        console.error('Email generation failed:', error);

        return {
            emails: generateFallbackEmails(firstName, leadData),
        };
    }
}

// Fallback email templates
function generateFallbackEmails(firstName: string, leadData: any): EmailVariant[] {
    return [
        {
            variant: 'initial',
            subject: `Quick question, ${firstName}`,
            body: `Hi ${firstName},\n\nI noticed you recently ${leadData.source === 'website' ? 'visited our website' : 'reached out'} and wanted to personally say hello.\n\nI'd love to learn more about your needs and see if we can help. Do you have 15 minutes this week for a quick call?\n\nLooking forward to connecting!\n\nBest regards`,
        },
        {
            variant: 'followup',
            subject: `Following up - ${firstName}`,
            body: `Hi ${firstName},\n\nI wanted to follow up on my previous email. I understand you're probably busy, but I genuinely believe we could help with ${leadData.message ? 'what you mentioned' : 'your needs'}.\n\nWould you be open to a brief conversation this week?\n\nBest regards`,
        },
        {
            variant: 'reactivation',
            subject: `Checking in, ${firstName}`,
            body: `Hi ${firstName},\n\nIt's been a while since we last connected. I wanted to reach out with some new insights that might be valuable for you.\n\nNo pressure - just wanted to keep you in the loop. Let me know if you'd like to chat!\n\nBest regards`,
        },
    ];
}
