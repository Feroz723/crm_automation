# n8n Integration Guide for AI Lead Gen CRM

## Overview

This guide explains how to set up n8n workflows to automatically capture leads from Facebook Lead Ads, Google Ads, and other sources, then send them to your CRM platform.

## Prerequisites

- n8n instance (cloud or self-hosted)
- Integration token from your CRM dashboard
- Webhook URL: `https://your-domain.vercel.app/api/leads`

## Step 1: Generate Integration Token

1. Go to `/dashboard/settings` in your CRM
2. Click "Generate Integration Token"
3. Copy the token (starts with `int_`)
4. Save it securely

## Step 2: Create n8n Workflow

### Facebook Lead Ads → CRM

**Workflow Structure:**
```
Facebook Lead Ads Trigger → Transform Data → HTTP Request (POST to CRM) → Google Sheets Backup (optional)
```

**Detailed Steps:**

1. **Add Facebook Lead Ads Trigger**
   - Node: `Facebook Lead Ads`
   - Select your Facebook page
   - Choose the lead form
   - Test to ensure connection works

2. **Transform Data Node**
   - Node: `Set`
   - Map fields:
     - `full_name` → `{{ $json.field_data.full_name }}`
     - `email` → `{{ $json.field_data.email }}`
     - `phone` → `{{ $json.field_data.phone }}`
     - `message` → `{{ $json.field_data.message }}`
     - `source` → `facebook`

3. **HTTP Request to CRM**
   - Node: `HTTP Request`
   - Method: `POST`
   - URL: `https://your-domain.vercel.app/api/leads`
   - Headers:
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer int_your_token_here"
     }
     ```
   - Body:
     ```json
     {
       "source": "{{ $json.source }}",
       "full_name": "{{ $json.full_name }}",
       "email": "{{ $json.email }}",
       "phone": "{{ $json.phone }}",
       "message": "{{ $json.message }}"
     }
     ```

4. **Google Sheets Backup (Optional)**
   - Node: `Google Sheets`
   - Operation: `Append Row`
   - Add columns: Name, Email, Phone, Message, Timestamp

5. **Error Handling**
   - Add `If` node to check HTTP response status
   - If error, send notification to Slack/Email
   - Add retry logic for failed requests

### Google Ads Lead Form Extension → CRM

**Workflow Structure:**
```
Webhook Trigger → Transform Data → HTTP Request (POST to CRM) → Error Handler
```

**Steps:**

1. **Webhook Trigger**
   - Node: `Webhook`
   - Method: `POST`
   - Path: `/google-ads-leads`
   - Copy webhook URL

2. **Configure Google Ads**
   - In Google Ads, go to Lead Form Extension settings
   - Add webhook URL from n8n
   - Map form fields

3. **Transform Data**
   - Node: `Set`
   - Map Google Ads fields to CRM format:
     - `firstName` + `lastName` → `full_name`
     - `email` → `email`
     - `phoneNumber` → `phone`
  - `source` → `google_ads`

4. **HTTP Request**
   - Same as Facebook setup above

### Website Contact Form → CRM

**Simple Setup:**

1. **Webhook Trigger**
   - Create webhook endpoint in n8n
   - Copy URL

2. **Add to your website form**
   ```javascript
   fetch('https://your-n8n-webhook-url', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       source: 'website',
       full_name: formData.name,
       email: formData.email,
       phone: formData.phone,
       message: formData.message
     })
   })
   ```

3. **Forward to CRM**
   - Use HTTP Request node as shown above

## Sample Payloads

### Facebook Lead Ads Payload
```json
{
  "field_data": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "message": "I'm interested in your services",
    "company": "Acme Inc"
  },
  "created_time": "2024-01-15T10:30:00Z",
  "id": "123456789",
  "ad_id": "987654321",
  "form_id": "456789123"
}
```

### Google Ads Payload
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phoneNumber": "+9876543210",
  "answers": [
    {
      "questionText": "What service are you interested in?",
      "answerText": "Digital Marketing"
    }
  ],
  "gclidIdentifier": "gclid_abc123",
  "formSubmissionTime": "2024-01-15T11:00:00Z"
}
```

### Expected CRM Format
```json
{
  "source": "facebook|google_ads|website|manual|whatsapp",
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Lead message or inquiry"
}
```

## Authentication

All requests to the CRM API must include the integration token:

```http
POST /api/leads
Authorization: Bearer int_your_token_here
Content-Type: application/json
```

## Error Handling

**Common Errors:**

1. **400 Bad Request**: Missing required fields (source)
   - Fix: Ensure `source` field is included

2. **401 Unauthorized**: Invalid or missing token
   - Fix: Check token in Authorization header

3. **500 Server Error**: CRM processing error
   - Fix: Check webhook logs in dashboard

**Retry Logic in n8n:**

Add this to HTTP Request node settings:
- Max retries: 3
- Retry on: HTTP Status 500, 502, 503, 504
- Retry interval: 1000ms (exponential backoff)

## Testing

1. **Test Facebook Trigger**: Submit a test lead through Facebook Lead Ads
2. **Check n8n Execution**: View workflow execution in n8n
3. **Verify CRM**: Check `/dashboard/leads` for new lead
4. **Check Logs**: View `/dashboard/logs` for webhook activity

## Advanced: Bulk Import

To import existing leads:

1. **Google Sheets Node**
   - Read all rows from spreadsheet

2. **Loop Over Rows**
   - Use `Split In Batches` node

3. **HTTP Request**
   - POST each lead to `/api/leads`
   - Add 500ms delay between requests

## Monitoring

Set up monitoring in n8n:

1. **On Error**: Send Slack/Email notification
2. **Daily Summary**: Count of leads processed
3. **Failed Requests**: Log to separate sheet for review

## Best Practices

1. **Use Environment Variables**: Store token and URLs in n8n environment
2. **Add Logging**: Use `Set` nodes to log intermediate data
3. **Test Thoroughly**: Use n8n's manual execution for testing
4. **Handle Duplicates**: CRM will handle duplicate emails automatically
5. **Data Validation**: Use `If` nodes to validate required fields before sending

## Support

If you encounter issues:
- Check `/dashboard/logs` for webhook errors
- Review n8n execution logs
- Ensure webhook URL is accessible
- Verify integration token is active

---

For more integrations, see:
- `facebook_integration.md`
- `google_ads_integration.md`
- `hubspot_integration.md`
