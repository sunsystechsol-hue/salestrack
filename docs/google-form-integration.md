# Google Form → SalesTrack CRM Integration Guide & Verification Report

This document details the architecture, configuration, field normalization fix, troubleshooting history, and end-to-end verification of the **Google Form → Google Apps Script → ngrok Webhook → SalesTrack Backend API → PostgreSQL Database → CRM Lead Directory** integration.

---

## 1. Overview

The Google Form integration allows prospective student enquiries submitted via a Google Form to be ingested automatically into the **KaushalSaathi Task, Lead & Sales Performance Tracker (SalesTrack)** CRM database in real-time. Ingested leads are created with `source = "Google Form"` and initial status `NEW`, making them immediately available in the SalesTrack Lead Directory for assignment by Managers and Admins.

---

## 2. Objective

The objective of this integration is to automate lead entry, eliminate manual data copying, sanitize and normalize submitted form fields, securely authenticate webhook submissions, and establish end-to-end traceability from form submission to CRM management.

---

## 3. Integration Architecture / Data Flow

```text
Google Form (User submits enquiry)
       ↓
Apps Script onFormSubmit Trigger (Extracts & normalizes form response items)
       ↓
ngrok HTTPS Tunnel (Exposes local development server to public HTTPS)
       ↓
SalesTrack Backend API (POST /api/integrations/google-form)
       ↓
Webhook Secret Authentication & Validation (X-Webhook-Secret & Zod Schema)
       ↓
PostgreSQL Database (Lead created with source="Google Form", status="NEW")
       ↓
SalesTrack CRM Lead Directory (Visible in UI as Unassigned Lead)
```

---

## 4. Google Form Configuration

The Google Form collects five fields from prospective applicants:

| Form Field | Field Type | Validation | Expected Key |
|---|---|---|---|
| **Name** | Short answer | Required | Prospect full name |
| **Phone** | Short answer | Required | Prospect contact phone number |
| **Email** | Short answer | Optional | Prospect email address |
| **Course** | Short answer / Dropdown | Optional | Interested course/program |
| **City** | Short answer | Optional | Prospect city location |

---

## 5. Google Apps Script Implementation

The Google Apps Script is configured with an `onFormSubmit` trigger processing the Google Form submit event object (`e.response`) and extracting question items via `getItemResponses()`.

### Apps Script Code Snippet

```javascript
// Google Apps Script snippet for SalesTrack CRM Webhook Ingestion

const WEBHOOK_URL = "https://<your-ngrok-subdomain>.ngrok-free.app/api/integrations/google-form";
const WEBHOOK_SECRET = "<YOUR_WEBHOOK_SECRET_HERE>"; // Must match GOOGLE_FORM_WEBHOOK_SECRET in backend/.env

function onFormSubmit(e) {
  try {
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    const rawData = {};
    for (let i = 0; i < itemResponses.length; i++) {
      const itemResponse = itemResponses[i];
      // CRITICAL FIX: Normalize question title by trimming whitespace
      const question = itemResponse.getItem().getTitle().trim();
      const answer = itemResponse.getResponse();
      rawData[question] = answer;
    }

    const payload = {
      formResponseId: response.getId(),
      name: rawData["Name"] || "",
      phone: rawData["Phone"] || "",
      email: rawData["Email"] || "",
      course: rawData["Course"] || "",
      city: rawData["City"] || ""
    };

    // Fallback if respondent email is captured automatically by Google Forms
    if (!payload.email && response.getRespondentEmail()) {
      payload.email = response.getRespondentEmail();
    }

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-Webhook-Secret": WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Webhook Response Code: " + res.getResponseCode());
    Logger.log("Webhook Response Body: " + res.getContentText());
  } catch (err) {
    Logger.log("Webhook Error: " + err.toString());
  }
}
```

---

## 6. Field Mapping & Normalization Fix

### Problem Identified During Integration Testing
During initial integration testing, form submissions failed backend validation with:
- `name cannot be empty`
- `phone cannot be empty`

### Root Cause Analysis
Inspection revealed that the question titles created in the Google Form contained trailing whitespace (e.g. `"Name "`, `"Phone "`, `"Email "`, `"Course "`, `"City "`).

When Apps Script extracted titles using:
```javascript
const question = itemResponse.getItem().getTitle();
```
The resulting object keys included trailing spaces:
```javascript
{
  "Name ": "K Manoj",
  "Phone ": "9110884143"
}
```
Attempting to access `rawData["Name"]` returned `undefined`, causing the Apps Script to fallback to empty strings (`""`) and triggering HTTP 400 validation errors on the backend.

### The Fix
The title extraction was updated to normalize and trim whitespace:
```javascript
const question = itemResponse.getItem().getTitle().trim();
```

After applying `.trim()`, question titles were correctly normalized to `"Name"`, `"Phone"`, `"Email"`, `"Course"`, and `"City"`.

---

## 7. Webhook Configuration

- **Endpoint URL**: `POST /api/integrations/google-form` (tunneled locally via ngrok for testing)
- **Header**: `X-Webhook-Secret: <YOUR_WEBHOOK_SECRET_HERE>`
- **Content-Type**: `application/json`

---

## 8. Troubleshooting and Error History

The troubleshooting sequence encountered during live end-to-end integration testing:

1. **Step 1 — HTTP 401 Unauthorized**:
   - *Symptom*: Initial webhook invocation returned `HTTP 401 Unauthorized`.
   - *Cause*: Webhook secret header `X-Webhook-Secret` was missing or mismatched.
   - *Fix*: Configured matching secret in Apps Script headers.

2. **Step 2 — HTTP 400 Bad Request**:
   - *Symptom*: Webhook returned `HTTP 400 Bad Request`.
   - *Backend Details*: `name cannot be empty`, `phone cannot be empty`.
   - *Cause*: Trailing whitespace in Google Form question titles (`"Name "`, `"Phone "`).

3. **Step 3 — Field Normalization Fix**:
   - *Fix*: Applied `.trim()` to `itemResponse.getItem().getTitle().trim()`.

4. **Step 4 — Final Successful Test**:
   - *Result*: Webhook returned `HTTP 201 Created` (`"Lead created successfully"`).

---

## 9. Final Successful Test

### Form Submission Test Data
- **Name**: `K Manoj`
- **Phone**: `9110884143`
- **Email**: `test@gmail.com`
- **Course**: `python`
- **City**: `Hospet`

### Extracted Apps Script Object (Post-Fix)
```json
{
  "Name": "K Manoj",
  "Phone": "9110884143",
  "Email": "test@gmail.com",
  "Course": "python",
  "City": "Hospet"
}
```

### Generated Final API Payload
```json
{
  "formResponseId": "<generated Google Form response ID>",
  "name": "K Manoj",
  "phone": "9110884143",
  "email": "test@gmail.com",
  "course": "python",
  "city": "Hospet"
}
```

---

## 10. Backend API Verification

### Response Data (`HTTP 201 Created`)
```json
{
  "success": true,
  "duplicate": false,
  "potentialPhoneDuplicate": false,
  "message": "Lead created successfully",
  "leadId": "<generated lead ID>"
}
```

---

## 11. CRM Verification

The lead was verified directly in the **SalesTrack Lead Directory UI**:

| Attribute | Displayed Value |
|---|---|
| **Lead Name** | `K Manoj` |
| **Phone** | `9110884143` |
| **Email** | `test@gmail.com` |
| **Course** | `python` |
| **City** | `Hospet` |
| **Lead Source** | `Google Form` |
| **Status** | `NEW` |
| **Assigned To** | `Unassigned` |

This confirms that the submission traveled through the complete integration pipeline and was correctly persisted in PostgreSQL and displayed in the frontend CRM.

---

## 12. Test Results Table

| Test Item | Result |
|---|---|
| Google Form submission | PASS |
| Apps Script trigger | PASS |
| Form data extraction | PASS |
| Question title normalization (`.trim()`) | PASS |
| Webhook authentication (`X-Webhook-Secret`) | PASS |
| JSON payload generation | PASS |
| Backend API request | PASS |
| HTTP 201 response | PASS |
| PostgreSQL Lead creation | PASS |
| CRM Lead Directory verification | PASS |
| Source = `Google Form` verification | PASS |

---

## 13. Current Status

**Status**: **Google Form → SalesTrack CRM integration is successfully implemented and verified end-to-end.**

*Note*: Verification was performed on the local SalesTrack backend server exposed securely through an ngrok tunnel.

---

## 14. Remaining Recommended Tests

1. **Duplicate Form Submission (Idempotency)**:
   Submit the same Google Form response again to verify that the backend returns `HTTP 200 OK` with `duplicate: true` without creating a second lead.
2. **Phone Number Duplicate Warning**:
   Submit a new Google Form response with a phone number that already exists under a different `formResponseId` to verify `potentialPhoneDuplicate` handling.

---

## 15. Conclusion

The Google Form integration pipeline is verified end-to-end. By normalizing question title whitespace in Apps Script, securing the endpoint with `X-Webhook-Secret`, and handling lead creation idempotently, prospective student form submissions are seamlessly converted into actionable leads in the SalesTrack CRM.
