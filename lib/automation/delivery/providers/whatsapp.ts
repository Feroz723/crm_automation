import { IDeliveryProvider, DeliveryPayload, DeliveryResponse } from '../types';

/**
 * Stubbed WhatsApp Delivery Provider.
 * This is 100% internal and performs NO network calls.
 */
export class WhatsAppProvider implements IDeliveryProvider {
    channel: 'whatsapp' = 'whatsapp';

    async send(payload: DeliveryPayload): Promise<DeliveryResponse> {
        console.log(`[STUB-PROVIDER] WhatsApp would be sent to ${payload.recipient} via Twilio.`);
        console.log(`[STUB-PROVIDER] Body: ${payload.body.substring(0, 50)}...`);

        return {
            success: true,
            providerMessageId: `msg_wa_${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString()
        };
    }
}
