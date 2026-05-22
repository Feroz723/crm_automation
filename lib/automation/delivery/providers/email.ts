import { IDeliveryProvider, DeliveryPayload, DeliveryResponse } from '../types';

/**
 * Stubbed Email Delivery Provider.
 * This is 100% internal and performs NO network calls.
 */
export class EmailProvider implements IDeliveryProvider {
    channel: 'email' = 'email';

    async send(payload: DeliveryPayload): Promise<DeliveryResponse> {
        console.log(`[STUB-PROVIDER] Email would be sent to ${payload.recipient} via SendGrid/Postmark.`);
        console.log(`[STUB-PROVIDER] Subject: ${payload.subject}`);

        return {
            success: true,
            providerMessageId: `msg_email_${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString()
        };
    }
}
