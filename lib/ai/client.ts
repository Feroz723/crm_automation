import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients
let groqClient: Groq | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

// Groq client singleton
export function getGroqClient(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not set');
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

// Gemini client singleton
export function getGeminiClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        geminiClient = new GoogleGenerativeAI(apiKey);
    }
    return geminiClient;
}

// Unified AI completion with automatic fallback
export async function getAICompletion(
    prompt: string,
    options: {
        maxTokens?: number;
        temperature?: number;
        useGroqFirst?: boolean;
    } = {}
): Promise<string> {
    const {
        maxTokens = 1000,
        temperature = 0.7,
        useGroqFirst = true,
    } = options;

    const errors: Error[] = [];

    // Try Groq first
    if (useGroqFirst) {
        try {
            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-70b-versatile',
                max_tokens: maxTokens,
                temperature,
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
                return content;
            }
            throw new Error('No content in Groq response');
        } catch (error) {
            console.error('Groq API error:', error);
            errors.push(error as Error);
        }
    }

    // Fallback to Gemini
    try {
        const gemini = getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
            return text;
        }
        throw new Error('No content in Gemini response');
    } catch (error) {
        console.error('Gemini API error:', error);
        errors.push(error as Error);
    }

    // If both failed
    throw new Error(
        `All AI providers failed. Errors: ${errors.map(e => e.message).join(', ')}`
    );
}

// Extract JSON from AI response (handles markdown code blocks)
export function extractJSON<T = any>(text: string): T {
    // Try to find JSON in markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
    }

    // Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not extract JSON from AI response');
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}
