# Google Sheets Conversation Capture Setup

**Last Updated**: November 30, 2025
**Status**: ✅ Ready to Use

---

## 🎯 Overview

This guide explains how to set up a Google Sheet for capturing LLM conversations with automatic cleanup and ingestion into the AAE Dashboard Knowledge Graph.

### Benefits

✅ **Structured capture** - Columns pre-defined
✅ **Easy metadata** - Add context as you go
✅ **Visual browsing** - See all conversations at once
✅ **Selective curation** - Only record valuable conversations
✅ **Quality control** - Review before ingestion
✅ **Auto-tracking** - Mark rows as ingested automatically

---

## 📊 Step 1: Create Google Sheet

### Template Structure

Create a new Google Sheet with these columns:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| **Date** | Date | ✅ Yes | When conversation occurred | `2024-11-15` |
| **Agent** | Text | ✅ Yes | Which LLM | `Claude`, `Fred`, `Gemini`, `Grok` |
| **Topic** | Text | ✅ Yes | Conversation subject | `Database Schema Design` |
| **Prompt** | Text | ✅ Yes | Your message | `How do I design the entities table?` |
| **Response** | Text | ✅ Yes | LLM response | `For the entities table, I recommend...` |
| **Priority** | Dropdown | ❌ No | Importance level | `High`, `Medium`, `Low` |
| **Project** | Text | ❌ No | Related project | `AAE Dashboard`, `Course Gen` |
| **Tags** | Text | ❌ No | Keywords (comma-separated) | `database, schema, d1` |
| **Ingested** | Checkbox | ❌ No | Already processed? | `☐` unchecked, `☑` checked |

### Quick Setup

1. **Create Sheet**: File → New → Google Sheets
2. **Name it**: "LLM Conversations - 2024" (or similar)
3. **Add Headers**: Copy the exact column names from table above
4. **Format Columns**:
   - Date: Format → Number → Date
   - Priority: Data → Data validation → List of items: `High, Medium, Low`
   - Ingested: Insert → Checkbox
5. **Freeze Header**: View → Freeze → 1 row

---

## 🔧 Step 2: Add Apps Script

### Install the Script

1. **Open Script Editor**: Extensions → Apps Script
2. **Delete default code**
3. **Paste this code**:

```javascript
/**
 * AAE Dashboard - Conversation Cleanup & Validation
 *
 * This script provides automated cleanup and validation for LLM conversations
 * captured in Google Sheets before exporting to the AAE Dashboard.
 */

// ============= MENU FUNCTIONS =============

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('AAE Dashboard')
    .addItem('✓ Clean & Validate', 'cleanAndValidate')
    .addItem('📊 Show Statistics', 'showStatistics')
    .addItem('📤 Prepare Export', 'prepareExport')
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();
}

// ============= CLEAN & VALIDATE =============

function cleanAndValidate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  ui.alert('🔄 Starting cleanup and validation...');

  const stats = {
    totalRows: 0,
    cleaned: 0,
    errors: 0,
    warnings: 0,
    errorMessages: []
  };

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase());

  // Find column indices
  const cols = {
    date: headers.indexOf('date'),
    agent: headers.indexOf('agent'),
    topic: headers.indexOf('topic'),
    prompt: headers.indexOf('prompt'),
    response: headers.indexOf('response'),
    priority: headers.indexOf('priority'),
    project: headers.indexOf('project'),
    tags: headers.indexOf('tags'),
    ingested: headers.indexOf('ingested')
  };

  // Validate required columns exist
  const required = ['date', 'agent', 'topic', 'prompt', 'response'];
  const missing = required.filter(col => cols[col] === -1);

  if (missing.length > 0) {
    ui.alert('❌ Error', `Missing required columns: ${missing.join(', ')}`, ui.ButtonSet.OK);
    return;
  }

  // Process each row (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 1;

    stats.totalRows++;

    // Skip already ingested rows
    if (cols.ingested !== -1 && row[cols.ingested] === true) {
      continue;
    }

    let cleaned = false;

    // Clean & validate Date
    if (!row[cols.date] || row[cols.date] === '') {
      stats.errors++;
      stats.errorMessages.push(`Row ${rowNum}: Missing date`);
      sheet.getRange(rowNum, cols.date + 1).setBackground('#ffcccc');
      continue;
    } else {
      // Ensure date is formatted correctly
      const dateCell = sheet.getRange(rowNum, cols.date + 1);
      dateCell.setNumberFormat('yyyy-mm-dd');
      cleaned = true;
    }

    // Clean & validate Agent
    if (!row[cols.agent] || row[cols.agent] === '') {
      stats.errors++;
      stats.errorMessages.push(`Row ${rowNum}: Missing agent`);
      sheet.getRange(rowNum, cols.agent + 1).setBackground('#ffcccc');
      continue;
    } else {
      // Normalize agent name (capitalize first letter)
      const agent = row[cols.agent].toString().trim();
      const normalized = agent.charAt(0).toUpperCase() + agent.slice(1).toLowerCase();
      if (agent !== normalized) {
        sheet.getRange(rowNum, cols.agent + 1).setValue(normalized);
        cleaned = true;
      }
    }

    // Clean & validate Topic
    if (!row[cols.topic] || row[cols.topic] === '') {
      stats.errors++;
      stats.errorMessages.push(`Row ${rowNum}: Missing topic`);
      sheet.getRange(rowNum, cols.topic + 1).setBackground('#ffcccc');
      continue;
    } else {
      // Trim topic
      const topic = row[cols.topic].toString().trim();
      if (topic !== row[cols.topic]) {
        sheet.getRange(rowNum, cols.topic + 1).setValue(topic);
        cleaned = true;
      }
    }

    // Clean & validate Prompt
    if (!row[cols.prompt] || row[cols.prompt] === '') {
      stats.errors++;
      stats.errorMessages.push(`Row ${rowNum}: Missing prompt`);
      sheet.getRange(rowNum, cols.prompt + 1).setBackground('#ffcccc');
      continue;
    } else {
      // Trim prompt
      const prompt = row[cols.prompt].toString().trim();
      if (prompt !== row[cols.prompt]) {
        sheet.getRange(rowNum, cols.prompt + 1).setValue(prompt);
        cleaned = true;
      }

      // Warn if prompt is very short
      if (prompt.length < 10) {
        stats.warnings++;
        sheet.getRange(rowNum, cols.prompt + 1).setBackground('#ffffcc');
      }
    }

    // Clean & validate Response
    if (!row[cols.response] || row[cols.response] === '') {
      stats.errors++;
      stats.errorMessages.push(`Row ${rowNum}: Missing response`);
      sheet.getRange(rowNum, cols.response + 1).setBackground('#ffcccc');
      continue;
    } else {
      // Trim response
      const response = row[cols.response].toString().trim();
      if (response !== row[cols.response]) {
        sheet.getRange(rowNum, cols.response + 1).setValue(response);
        cleaned = true;
      }

      // Warn if response is very short
      if (response.length < 20) {
        stats.warnings++;
        sheet.getRange(rowNum, cols.response + 1).setBackground('#ffffcc');
      }
    }

    // Validate Priority (if exists)
    if (cols.priority !== -1 && row[cols.priority] !== '') {
      const priority = row[cols.priority].toString().trim();
      const validPriorities = ['High', 'Medium', 'Low'];

      // Normalize priority
      const normalized = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();

      if (!validPriorities.includes(normalized)) {
        stats.warnings++;
        sheet.getRange(rowNum, cols.priority + 1).setBackground('#ffffcc');
        sheet.getRange(rowNum, cols.priority + 1).setNote('Invalid priority. Use: High, Medium, or Low');
      } else if (priority !== normalized) {
        sheet.getRange(rowNum, cols.priority + 1).setValue(normalized);
        cleaned = true;
      }
    }

    // Clean Tags (if exists)
    if (cols.tags !== -1 && row[cols.tags] !== '') {
      const tags = row[cols.tags].toString()
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
        .join(', ');

      if (tags !== row[cols.tags]) {
        sheet.getRange(rowNum, cols.tags + 1).setValue(tags);
        cleaned = true;
      }
    }

    if (cleaned) {
      stats.cleaned++;
    }
  }

  // Show results
  let message = `✅ Cleanup Complete!\n\n`;
  message += `Total Rows: ${stats.totalRows}\n`;
  message += `Cleaned: ${stats.cleaned}\n`;
  message += `Errors: ${stats.errors}\n`;
  message += `Warnings: ${stats.warnings}\n\n`;

  if (stats.errors > 0) {
    message += `❌ Errors Found:\n`;
    message += stats.errorMessages.slice(0, 10).join('\n');
    if (stats.errorMessages.length > 10) {
      message += `\n... and ${stats.errorMessages.length - 10} more`;
    }
    message += `\n\n⚠️ Fix red cells before exporting.`;
  }

  if (stats.warnings > 0) {
    message += `\n⚠️ Yellow cells have warnings (review recommended but not required).`;
  }

  if (stats.errors === 0 && stats.warnings === 0) {
    message += `🎉 All rows are valid and ready for export!`;
  }

  ui.alert('Cleanup Results', message, ui.ButtonSet.OK);
}

// ============= STATISTICS =============

function showStatistics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase());

  const cols = {
    agent: headers.indexOf('agent'),
    priority: headers.indexOf('priority'),
    project: headers.indexOf('project'),
    ingested: headers.indexOf('ingested')
  };

  const stats = {
    totalRows: data.length - 1,
    byAgent: {},
    byPriority: {},
    byProject: {},
    ingested: 0,
    pending: 0
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Count by agent
    if (cols.agent !== -1 && row[cols.agent]) {
      const agent = row[cols.agent].toString();
      stats.byAgent[agent] = (stats.byAgent[agent] || 0) + 1;
    }

    // Count by priority
    if (cols.priority !== -1 && row[cols.priority]) {
      const priority = row[cols.priority].toString();
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    }

    // Count by project
    if (cols.project !== -1 && row[cols.project]) {
      const project = row[cols.project].toString();
      stats.byProject[project] = (stats.byProject[project] || 0) + 1;
    }

    // Count ingested
    if (cols.ingested !== -1 && row[cols.ingested] === true) {
      stats.ingested++;
    } else {
      stats.pending++;
    }
  }

  let message = `📊 Conversation Statistics\n\n`;
  message += `Total Rows: ${stats.totalRows}\n`;
  message += `✅ Ingested: ${stats.ingested}\n`;
  message += `⏳ Pending: ${stats.pending}\n\n`;

  if (Object.keys(stats.byAgent).length > 0) {
    message += `By Agent:\n`;
    Object.entries(stats.byAgent)
      .sort((a, b) => b[1] - a[1])
      .forEach(([agent, count]) => {
        message += `  ${agent}: ${count}\n`;
      });
    message += `\n`;
  }

  if (Object.keys(stats.byPriority).length > 0) {
    message += `By Priority:\n`;
    Object.entries(stats.byPriority)
      .sort((a, b) => b[1] - a[1])
      .forEach(([priority, count]) => {
        message += `  ${priority}: ${count}\n`;
      });
    message += `\n`;
  }

  if (Object.keys(stats.byProject).length > 0) {
    message += `By Project:\n`;
    Object.entries(stats.byProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([project, count]) => {
        message += `  ${project}: ${count}\n`;
      });
  }

  ui.alert('Statistics', message, ui.ButtonSet.OK);
}

// ============= PREPARE EXPORT =============

function prepareExport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Prepare CSV Export',
    'This will:\n' +
    '1. Run cleanup & validation\n' +
    '2. Filter out already ingested rows\n' +
    '3. Sort by date (oldest first)\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  // Run cleanup first
  cleanAndValidate();

  // Get current filter and sort
  const filter = sheet.getFilter() || sheet.createFilter();

  // Sort by date (oldest first)
  const headers = sheet.getDataRange().getValues()[0];
  const dateCol = headers.indexOf('Date') + 1;

  if (dateCol > 0) {
    sheet.sort(dateCol, true);
  }

  ui.alert(
    'Ready for Export',
    '✅ Sheet prepared for export!\n\n' +
    'Next steps:\n' +
    '1. File → Download → CSV (.csv)\n' +
    '2. Save to: conversations/google-sheets/\n' +
    '3. Run: npx tsx scripts/ingest-from-csv.ts <file.csv>\n\n' +
    'Note: After successful ingestion, re-import the updated CSV\n' +
    'to mark rows as ingested.',
    ui.ButtonSet.OK
  );
}

// ============= SETTINGS =============

function showSettings() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '⚙️ AAE Dashboard Settings',
    'Google Sheets Integration for LLM Conversations\n\n' +
    'Required Columns:\n' +
    '• Date, Agent, Topic, Prompt, Response\n\n' +
    'Optional Columns:\n' +
    '• Priority, Project, Tags, Ingested\n\n' +
    'Workflow:\n' +
    '1. Paste conversations into rows\n' +
    '2. AAE → Clean & Validate\n' +
    '3. AAE → Prepare Export\n' +
    '4. File → Download → CSV\n' +
    '5. Run ingestion script\n' +
    '6. Re-import updated CSV\n\n' +
    'Version: 1.0.0',
    ui.ButtonSet.OK
  );
}
```

4. **Save Script**: File → Save (name it "AAE Dashboard Integration")
5. **Authorize**: Run → Run function → onOpen (approve permissions)
6. **Reload Sheet**: Close and reopen the sheet

You should now see an "AAE Dashboard" menu!

---

## 📝 Step 3: Add Conversations

### Quick Entry Method

For each conversation exchange:

1. **New Row**: Add a new row
2. **Fill Columns**:
   - **Date**: Today's date (or when conversation happened)
   - **Agent**: `Claude`, `Fred`, `Gemini`, etc.
   - **Topic**: Brief subject (e.g., "Database Schema Design")
   - **Prompt**: Your question/request
   - **Response**: LLM's answer
   - **Priority** (optional): `High`, `Medium`, or `Low`
   - **Project** (optional): Related project name
   - **Tags** (optional): Keywords separated by commas
   - **Ingested**: Leave unchecked

### Multi-Exchange Conversations

For conversations with multiple back-and-forth exchanges:

- **Same Date, Agent, Topic** = Single conversation
- **Each exchange = New row**

**Example**:

| Date | Agent | Topic | Prompt | Response |
|------|-------|-------|--------|----------|
| 2024-11-15 | Claude | Database Schema | How do I design entities? | Use these columns... |
| 2024-11-15 | Claude | Database Schema | What about relationships? | Create relationships table... |
| 2024-11-15 | Claude | Database Schema | How do I handle duplicates? | Use fuzzy matching... |

These 3 rows will be grouped into **1 conversation** with **3 exchanges**.

---

## ✅ Step 4: Clean & Validate

Before exporting, always run cleanup:

1. **Menu**: AAE Dashboard → ✓ Clean & Validate
2. **Review Results**:
   - 🔴 Red cells = Errors (must fix)
   - 🟡 Yellow cells = Warnings (review recommended)
   - White cells = Valid
3. **Fix Errors**: Edit red cells, run validation again
4. **Statistics** (optional): AAE Dashboard → 📊 Show Statistics

---

## 📤 Step 5: Export & Ingest

### Export from Google Sheets

1. **Prepare**: AAE Dashboard → 📤 Prepare Export
2. **Download**: File → Download → Comma Separated Values (.csv)
3. **Save to**: `conversations/google-sheets/conversations-export.csv`

### Ingest into Knowledge Graph

```bash
cd github-projects/aae-dashboard

# Dry run (validate only)
npx tsx scripts/ingest-from-csv.ts conversations/google-sheets/conversations-export.csv --dry-run

# Actual ingestion
npx tsx scripts/ingest-from-csv.ts conversations/google-sheets/conversations-export.csv
```

### Update Sheet with Results

The ingestion script **automatically marks rows as ingested** in the CSV file:

1. **Re-import CSV**: File → Import → Upload → Replace current sheet
2. **Verify**: Check "Ingested" column shows checkmarks (✓) for processed rows
3. **Continue**: Add new conversations, only unprocessed rows will be ingested next time

---

## 🔍 Example Workflow

### Day 1: Setup

1. Create Google Sheet with template
2. Add Apps Script
3. Test with 2-3 sample rows

### Day 2-7: Capture

1. Have conversation with Claude about database design
2. Paste prompt + response into sheet
3. Add metadata (topic, priority, project)
4. Repeat for each valuable conversation

### End of Week: Ingest

1. AAE Dashboard → Clean & Validate (fix any errors)
2. AAE Dashboard → Prepare Export
3. File → Download → CSV
4. Run: `npx tsx scripts/ingest-from-csv.ts conversations-export.csv`
5. Re-import updated CSV (rows marked as ingested)
6. Query database to see new entities

---

## 🎯 Best Practices

### Data Entry

1. **Be selective** - Only record conversations worth preserving
2. **Add metadata immediately** - Context is fresh in your mind
3. **Use consistent topics** - Makes grouping more effective
4. **Multi-line text** - Click cell → Ctrl+Enter for newlines in Prompt/Response

### Quality Control

1. **Run validation weekly** - Catch errors early
2. **Review yellow warnings** - Improve data quality
3. **Check statistics** - Understand conversation distribution
4. **Backup sheet monthly** - File → Make a copy

### Ingestion Rhythm

1. **Weekly exports** - Regular ingestion builds knowledge graph progressively
2. **Monthly reviews** - Check entity growth and semantic promotion
3. **Quarterly cleanup** - Archive old sheets, start fresh

---

## 📊 Example Sheet

Here's what a populated sheet looks like:

| Date | Agent | Topic | Prompt | Response | Priority | Project | Tags | Ingested |
|------|-------|-------|--------|----------|----------|---------|------|----------|
| 2024-11-15 | Claude | Database Schema | How do I design the entities table? | For the entities table, use these columns: id, userId, entityType... | High | AAE Dashboard | database, schema, d1 | ☐ |
| 2024-11-15 | Claude | Database Schema | What about relationships? | Create a relationships table with fromEntityId, toEntityId... | High | AAE Dashboard | database, relationships | ☐ |
| 2024-11-16 | Fred | Course Generation | How do I structure modules? | For course modules, use a 12-module framework... | Medium | Course Gen | education, modules | ☐ |
| 2024-11-17 | Gemini | Notion Integration | Can you help with Notion API? | The Notion API requires an integration token... | Low | AAE Dashboard | notion, api | ☑ |

---

## 🔧 Troubleshooting

### "AAE Dashboard" menu doesn't appear

**Solution**: Reload the sheet (close and reopen)

### Validation shows lots of errors

**Common fixes**:
- Date column: Ensure format is YYYY-MM-DD
- Agent column: Capitalize first letter (Claude, not claude)
- Missing fields: All 5 required columns must have values

### CSV export includes ingested rows

**Solution**: Use "Prepare Export" menu item - it filters automatically

### Re-import overwrites new rows

**Solution**:
1. Before re-import, copy any new rows
2. Import updated CSV (replaces sheet)
3. Paste new rows at bottom

---

## 🚀 Advanced Tips

### Custom Validation Rules

Edit Apps Script to add custom validation:
- Minimum response length
- Specific agent names only
- Required tags for certain projects

### Automated Exports

Set up Google Apps Script trigger:
- Tools → Script editor → Triggers
- Weekly export to Google Drive
- Send email notification when ready

### Shared Team Sheet

1. Share sheet with team members
2. Each person adds their conversations
3. Weekly export ingests all conversations
4. Knowledge graph grows from team knowledge

---

## 📚 Related Documentation

- [CONVERSATION_INGESTION_WORKFLOW.md](CONVERSATION_INGESTION_WORKFLOW.md) - Complete workflow overview
- [scripts/ingest-from-csv.ts](scripts/ingest-from-csv.ts) - CSV ingestion script source

---

**Happy conversation capturing! 🧠**

---

*Last updated: November 30, 2025*
*Version: 1.0.0*
*Status: Production Ready*
