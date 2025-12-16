# Google Sheets Integration Setup

This guide will help you set up Google Sheets to capture:
- ✅ Paid orders
- ✅ Abandoned checkouts
- ✅ WhatsApp leads

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named "AlphaTV Orders"
3. Create 3 sheets (tabs):
   - `Paid Orders`
   - `Abandoned`
   - `WhatsApp Leads`

### Paid Orders Columns:
| A | B | C | D | E | F | G | H |
|--|--|--|--|--|--|--|--|
| Timestamp | Name | Email | Phone | Product | Price | Session ID | IP |

### Abandoned Columns:
| A | B | C | D | E | F | G | H |
|--|--|--|--|--|--|--|--|
| Timestamp | Name | Email | Phone | Product | Price | URL | IP |

### WhatsApp Leads Columns:
| A | B | C | D | E | F |
|--|--|--|--|--|--|
| Timestamp | Product | URL | User Agent | IP | Status |

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete the default code and paste this:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Determine which sheet to use based on action
    let sheet;
    let row;
    
    switch(data.action) {
      case 'checkout_completed':
        sheet = ss.getSheetByName('Paid Orders') || ss.insertSheet('Paid Orders');
        row = [
          data.receivedAt || new Date().toISOString(),
          data.customerName || '',
          data.customerEmail || '',
          data.customerPhone || '',
          data.productName || data.productId || '',
          data.price || '',
          data.sessionId || '',
          data.ip || ''
        ];
        break;
        
      case 'form_abandoned':
        sheet = ss.getSheetByName('Abandoned') || ss.insertSheet('Abandoned');
        row = [
          data.receivedAt || new Date().toISOString(),
          data.customerName || '',
          data.customerEmail || '',
          data.customerPhone || '',
          data.productName || data.productId || '',
          data.price || '',
          data.url || '',
          data.ip || ''
        ];
        break;
        
      case 'whatsapp_click':
        sheet = ss.getSheetByName('WhatsApp Leads') || ss.insertSheet('WhatsApp Leads');
        row = [
          data.receivedAt || new Date().toISOString(),
          data.productName || '',
          data.url || '',
          data.userAgent || '',
          data.ip || '',
          'Clicked'
        ];
        break;
        
      case 'form_started':
        // We don't need to track form started separately
        return ContentService.createTextOutput(JSON.stringify({ success: true, skipped: true }))
          .setMimeType(ContentService.MimeType.JSON);
        
      default:
        // Log unknown actions to a general sheet
        sheet = ss.getSheetByName('Events') || ss.insertSheet('Events');
        row = [
          new Date().toISOString(),
          data.action || 'unknown',
          JSON.stringify(data)
        ];
    }
    
    // Append the row
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        action: 'form_abandoned',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+33612345678',
        productName: '12 Month Subscription',
        price: 59.99,
        url: 'https://example.com/checkout',
        ip: '192.168.1.1',
        receivedAt: new Date().toISOString()
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
```

## Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Select type: **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/xxx/exec`)

## Step 4: Add to Vercel

Add this environment variable to Vercel:

```
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Step 5: Test

1. Go to your checkout page
2. Start filling the form
3. Close the tab without completing
4. Check your Google Sheet - you should see the abandoned checkout!

## Tracking Events

| Event | When | Sheet |
|-------|------|-------|
| `form_started` | User starts typing | (not saved) |
| `form_abandoned` | User leaves without paying | Abandoned |
| `checkout_completed` | Payment successful | Paid Orders |
| `whatsapp_click` | User clicks WhatsApp | WhatsApp Leads |

## Notes

- The webhook is called from your server, so it's reliable
- Data includes IP and user agent for fraud detection
- Timestamps are in ISO format
