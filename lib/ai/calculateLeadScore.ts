import { getAICompletion, extractJSON, retryWithBackoff } from './client';
import type { ScoringResult } from '../types';

/**
 * Calculates intelligent lead score (0-100) using AI
 * Analyzes:
 * - Source quality
 * - Contact information completeness
 * - Message content for urgency and budget signals
 * - Industry indicators
 * - Spam detection
 */
export async function calculateLeadScore(
    leadData: {
        source?: string;
        email?: string;
        phone?: string;
        message?: string;
        fullName?: string;
        firstName?: string;
        lastName?: string;
    },
    historicalContext?: Array<{
        status: string;
        score: number;
        source: string;
        message?: string;
    }>
): Promise<ScoringResult> {
    const contextPrompt = historicalContext && historicalContext.length > 0
        ? `\nHistorical Context (Examples of past outcomes):\n${JSON.stringify(historicalContext, null, 2)}\nUse these examples to calibrate your scoring logic. For example, if many 'won' leads came from a specific source, weight that source higher.`
        : '';

    const prompt = `You are an expert lead scoring AI. Analyze the lead data below and assign a score (0-100) and confidence (0-1).${contextPrompt}

Lead Data:
${JSON.stringify(leadData, null, 2)}

Scoring Criteria:
1. Source Quality (0-25): Evaluate the likelihood of conversion based on the acquisition channel.
2. Contact Completeness (0-25): Reward for having email, phone, and full name.
3. Message Quality (0-30): Look for business needs, budget mention, and urgency.
4. Professionalism (0-20): Check domain quality and data clarity.

Respond with ONLY a JSON object:
{
  "score": 75,
  "confidence": 0.9,
  "reasoning": "A detailed explanation of why this lead received this score.",
  "factors": {
    "sourceQuality": 20,
    "contactCompleteness": 20,
    "messageQuality": 25,
    "urgencySignals": 10
  }
}`;

    try {
        const response = await retryWithBackoff(() =>
            getAICompletion(prompt, { maxTokens: 500, temperature: 0.2 })
        );

        const result = extractJSON<ScoringResult>(response);

        // Ensure score is within 0-100
        const score = Math.max(0, Math.min(100, result.score || 50));

        return {
            score,
            confidence: result.confidence || 0.8,
            reasoning: result.reasoning || 'Score calculated based on lead quality factors',
            factors: result.factors || {
                sourceQuality: 15,
                contactCompleteness: 15,
                messageQuality: 15,
                urgencySignals: 5,
            },
        };
    } catch (error) {
        console.error('Lead scoring failed:', error);

        // Fallback: simple rule-based scoring
        let score = 50; // baseline

        // Source quality
        if (leadData.source === 'facebook' || leadData.source === 'google_ads') score += 20;
        else if (leadData.source === 'website') score += 15;
        else if (leadData.source === 'whatsapp') score += 15;

        // Contact completeness
        if (leadData.email) score += 10;
        if (leadData.phone) score += 5;
        if (leadData.firstName && leadData.lastName) score += 10;

        return {
            score: Math.max(0, Math.min(100, score)),
            reasoning: 'Fallback scoring based on basic rules',
            factors: {
                sourceQuality: 15,
                contactCompleteness: 15,
                messageQuality: 10,
                urgencySignals: 5,
            },
        };
    }
}
