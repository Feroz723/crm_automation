/**
 * Standard response for all delivery attempts.
 */
export interface DeliveryResponse {
    success: boolean;
    providerMessageId?: string;
    error?: string;
    timestamp: string;
}

/**
 * Standard payload for outreach delivery.
 */
export interface DeliveryPayload {
    recipient: string;
    subject?: string;
    body: string;
    metadata?: any;
}

/**
 * Interface that all delivery providers (Email, WhatsApp, CRM) must implement.
 */
export interface IDeliveryProvider {
    channel: 'email' | 'whatsapp' | 'crm';
    send(payload: DeliveryPayload): Promise<DeliveryResponse>;
}
