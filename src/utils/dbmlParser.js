/**
 * DBML Generator & Converter Utility for Vue ERD Canvas
 */

export function cleanNoteText(raw) {
  if (!raw) return '';
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (text.startsWith('\n')) text = text.slice(1);
  if (text.endsWith('\n')) text = text.slice(0, -1);
  const lines = text.split('\n');
  if (lines.length > 1) {
    const nonBlank = lines.filter(l => l.trim().length > 0);
    if (nonBlank.length > 0) {
      const minIndent = Math.min(...nonBlank.map(l => l.match(/^\s*/)[0].length));
      if (minIndent > 0) {
        text = lines.map(l => (l.length >= minIndent ? l.slice(minIndent) : l)).join('\n');
      }
    }
  }
  return text.trim();
}

export function generateDBML(tables, relationships, projectName = 'Database Schema') {
  let dbml = `// DBML Database Schema: ${projectName}\n`;
  dbml += `// Generated on ${new Date().toLocaleDateString()}\n\n`;

  // Tables
  tables.forEach(table => {
    dbml += `Table ${table.name} {\n`;
    table.columns.forEach(col => {
      let settings = [];
      if (col.isPk) settings.push('pk');
      if (col.isUnique) settings.push('unique');
      if (col.isNull === false && !col.isPk) settings.push('not null');
      if (col.note) {
        if (col.note.includes('\n')) {
          const cleanNoteVal = col.note.replace(/'''/g, "''\\'");
          const indented = cleanNoteVal.split('\n').map(line => `    ${line}`).join('\n');
          settings.push(`note: '''\n${indented}\n  '''`);
        } else {
          settings.push(`note: '${col.note.replace(/'/g, "\\'")}'`);
        }
      }

      const settingsStr = settings.length > 0 ? ` [${settings.join(', ')}]` : '';
      dbml += `  ${col.name} ${col.type || 'varchar'}${settingsStr}\n`;
    });

    if (table.note) {
      dbml += `\n`;
      if (table.note.includes('\n')) {
        const cleanTableNote = table.note.replace(/'''/g, "''\\'");
        const indented = cleanTableNote.split('\n').map(line => `    ${line}`).join('\n');
        dbml += `  Note: '''\n${indented}\n  '''\n`;
      } else {
        dbml += `  Note: '${table.note.replace(/'/g, "\\'")}'\n`;
      }
    }

    dbml += `}\n\n`;
  });

  // Relationships (Ref)
  relationships.forEach(rel => {
    let cardSymbol = '>';
    if (rel.cardinality === '1:1') cardSymbol = '-';
    if (rel.cardinality === 'N:M') cardSymbol = '<>';

    let settings = [];
    if (rel.onDelete) settings.push(`delete: ${rel.onDelete.toLowerCase()}`);
    const settingsStr = settings.length > 0 ? ` [${settings.join(', ')}]` : '';

    dbml += `Ref: ${rel.fromTable}.${rel.fromColumn} ${cardSymbol} ${rel.toTable}.${rel.toColumn}${settingsStr}\n`;
  });

  return dbml;
}

export function parseDBML(dbmlText) {
  const tables = [];
  const relationships = [];
  if (!dbmlText) return { tables, relationships };

  const lines = dbmlText.split('\n');
  let currentTable = null;
  let tableX = 80;
  let tableY = 80;

  const headerColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
  let colorIdx = 0;

  let inMultilineNote = false;
  let multilineNoteType = null; // 'table' | 'column'
  let multilineNoteBuffer = [];
  let currentColumnPending = null;

  let inSettingsBlock = false;
  let settingsBuffer = '';

  let inIndexesBlock = false;
  let inEnumBlock = false;
  let inTableGroupBlock = false;
  let inProjectBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. If inside a multi-line note block (''' ... ''')
    if (inMultilineNote) {
      if (trimmed.includes("'''")) {
        const endQuoteIdx = rawLine.indexOf("'''");
        const beforeEndQuote = rawLine.substring(0, endQuoteIdx);
        multilineNoteBuffer.push(beforeEndQuote);
        const finalNote = cleanNoteText(multilineNoteBuffer.join('\n'));

        if (multilineNoteType === 'table' && currentTable) {
          currentTable.note = finalNote;
        } else if (multilineNoteType === 'column' && currentColumnPending) {
          currentColumnPending.note = finalNote;
        }

        const afterEndQuote = rawLine.substring(endQuoteIdx + 3).trim();
        inMultilineNote = false;
        multilineNoteBuffer = [];
        multilineNoteType = null;

        if (inSettingsBlock && currentColumnPending) {
          settingsBuffer += ' ' + afterEndQuote;
          if (afterEndQuote.includes(']')) {
            inSettingsBlock = false;
            parseColumnSettings(settingsBuffer, currentColumnPending, relationships, currentTable);
            currentTable.columns.push(currentColumnPending);
            currentColumnPending = null;
            settingsBuffer = '';
          }
        }
      } else {
        multilineNoteBuffer.push(rawLine);
      }
      continue;
    }

    // 2. If inside a multi-line column settings block [ ... ] without note open
    if (inSettingsBlock && currentColumnPending) {
      const noteTripleStart = trimmed.match(/note\s*:\s*'''([\s\S]*)/i);
      if (noteTripleStart) {
        const restOfLine = noteTripleStart[1];
        if (restOfLine.includes("'''")) {
          const endIdx = restOfLine.indexOf("'''");
          const noteContent = restOfLine.substring(0, endIdx);
          currentColumnPending.note = cleanNoteText(noteContent);
          const afterEnd = restOfLine.substring(endIdx + 3);
          settingsBuffer += ' ' + afterEnd;
          if (afterEnd.includes(']')) {
            inSettingsBlock = false;
            parseColumnSettings(settingsBuffer, currentColumnPending, relationships, currentTable);
            currentTable.columns.push(currentColumnPending);
            currentColumnPending = null;
            settingsBuffer = '';
          }
        } else {
          inMultilineNote = true;
          multilineNoteType = 'column';
          multilineNoteBuffer = [restOfLine];
        }
        continue;
      }

      settingsBuffer += ' ' + trimmed;
      if (trimmed.includes(']')) {
        inSettingsBlock = false;
        parseColumnSettings(settingsBuffer, currentColumnPending, relationships, currentTable);
        currentTable.columns.push(currentColumnPending);
        currentColumnPending = null;
        settingsBuffer = '';
      }
      continue;
    }

    // Skip empty lines & comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    // Ignore root blocks
    if (/^Project\b/i.test(trimmed)) { if (trimmed.includes('{')) inProjectBlock = true; continue; }
    if (inProjectBlock) { if (trimmed.includes('}')) inProjectBlock = false; continue; }
    if (/^Enum\b/i.test(trimmed)) { if (trimmed.includes('{')) inEnumBlock = true; continue; }
    if (inEnumBlock) { if (trimmed.includes('}')) inEnumBlock = false; continue; }
    if (/^TableGroup\b/i.test(trimmed)) { if (trimmed.includes('{')) inTableGroupBlock = true; continue; }
    if (inTableGroupBlock) { if (trimmed.includes('}')) inTableGroupBlock = false; continue; }

    // Match Table definition
    const tableMatch = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)(?:\s+as\s+[a-zA-Z0-9_]+)?\s*\{/i);
    if (tableMatch) {
      const tableName = tableMatch[2] || tableMatch[1];
      currentTable = {
        id: 'tbl-' + tableName.toLowerCase(),
        name: tableName,
        headerColor: headerColors[colorIdx % headerColors.length],
        x: tableX,
        y: tableY,
        note: '',
        columns: []
      };
      colorIdx++;
      tableX += 340;
      if (tableX > 1100) {
        tableX = 80;
        tableY += 320;
      }
      continue;
    }

    if (trimmed === '}' && currentTable) {
      tables.push(currentTable);
      currentTable = null;
      continue;
    }

    // Inside Table definition
    if (currentTable) {
      if (/^indexes\s*\{/i.test(trimmed)) { inIndexesBlock = true; continue; }
      if (inIndexesBlock) { if (trimmed.includes('}')) inIndexesBlock = false; continue; }

      // Table Note: Note: '''...''' or Note: '...' or Note { ... }
      if (/^Note\s*:?\s*'''/i.test(trimmed)) {
        const afterTriple = trimmed.replace(/^Note\s*:?\s*'''/i, '');
        if (afterTriple.includes("'''")) {
          const content = afterTriple.substring(0, afterTriple.indexOf("'''"));
          currentTable.note = cleanNoteText(content);
        } else {
          inMultilineNote = true;
          multilineNoteType = 'table';
          multilineNoteBuffer = [afterTriple];
        }
        continue;
      }

      if (/^Note\s*\{/i.test(trimmed)) {
        inMultilineNote = true;
        multilineNoteType = 'table';
        multilineNoteBuffer = [];
        continue;
      }

      const singleTableNote = trimmed.match(/^Note\s*:?\s*['"]([^'"]+)['"]/i);
      if (singleTableNote) {
        currentTable.note = cleanNoteText(singleTableNote[1]);
        continue;
      }

      // Skip SQL table-level constraints if pasted or present
      if (/^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|CHECK)\b/i.test(trimmed)) {
        continue;
      }

      // Column Definition: colName colType [settings]
      const colStartMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_(),\s]+?)(?:\s*\[([\s\S]*))?$/i);
      if (colStartMatch) {
        const colName = colStartMatch[1];
        if (colName.toUpperCase() === 'CONSTRAINT') {
          continue;
        }
        let colType = colStartMatch[2].trim();
        const bracketRest = colStartMatch[3] !== undefined ? colStartMatch[3].trim() : null;

        const colObj = {
          name: colName,
          type: colType || 'varchar',
          isPk: false,
          isFk: false,
          isNull: true,
          isUnique: false,
          note: ''
        };

        if (bracketRest !== null) {
          const noteTripleStart = bracketRest.match(/note\s*:\s*'''([\s\S]*)/i);
          if (noteTripleStart) {
            const afterStart = noteTripleStart[1];
            if (afterStart.includes("'''")) {
              const endQuoteIdx = afterStart.indexOf("'''");
              colObj.note = cleanNoteText(afterStart.substring(0, endQuoteIdx));
              const afterEnd = afterStart.substring(endQuoteIdx + 3);
              if (afterEnd.includes(']')) {
                const preSettings = bracketRest.substring(0, bracketRest.toLowerCase().indexOf('note:'));
                parseColumnSettings(preSettings + ' ' + afterEnd, colObj, relationships, currentTable);
                currentTable.columns.push(colObj);
                continue;
              } else {
                inSettingsBlock = true;
                settingsBuffer = bracketRest.substring(0, bracketRest.toLowerCase().indexOf('note:')) + ' ' + afterEnd;
                currentColumnPending = colObj;
                continue;
              }
            } else {
              inMultilineNote = true;
              multilineNoteType = 'column';
              multilineNoteBuffer = [afterStart];
              inSettingsBlock = true;
              settingsBuffer = bracketRest.substring(0, bracketRest.toLowerCase().indexOf('note:'));
              currentColumnPending = colObj;
              continue;
            }
          }

          if (bracketRest.includes(']')) {
            parseColumnSettings(bracketRest, colObj, relationships, currentTable);
            currentTable.columns.push(colObj);
          } else {
            inSettingsBlock = true;
            settingsBuffer = bracketRest;
            currentColumnPending = colObj;
          }
        } else {
          currentTable.columns.push(colObj);
        }
        continue;
      }
    }

    // Match Ref: Ref: table1.col1 > table2.col2
    const refMatch = trimmed.match(/^Ref(?:\s+[a-zA-Z0-9_]+)?\s*:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*([-<>]+)\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
    if (refMatch) {
      const fromTable = refMatch[1];
      const fromColumn = refMatch[2];
      const symbol = refMatch[3];
      const toTable = refMatch[4];
      const toColumn = refMatch[5];

      let cardinality = '1:N';
      if (symbol === '-') cardinality = '1:1';
      if (symbol === '<>') cardinality = 'N:M';

      relationships.push({
        id: 'rel-' + Math.random().toString(36).substring(2, 9),
        fromTable,
        fromColumn,
        toTable,
        toColumn,
        cardinality,
        onDelete: 'CASCADE'
      });
    }
  }

  function parseColumnSettings(settingsStr, col, relsList, table) {
    if (!settingsStr) return;
    if (/primary key|\bpk\b/i.test(settingsStr)) {
      col.isPk = true;
      col.isNull = false;
    }
    if (/\bunique\b/i.test(settingsStr)) {
      col.isUnique = true;
    }
    if (/not null/i.test(settingsStr)) {
      col.isNull = false;
    }

    if (!col.note) {
      const singleMatch = settingsStr.match(/note\s*:\s*['"]([^'"]+)['"]/i);
      if (singleMatch) {
        col.note = cleanNoteText(singleMatch[1]);
      } else {
        const tripleMatch = settingsStr.match(/note\s*:\s*'''([\s\S]*?)'''/i);
        if (tripleMatch) col.note = cleanNoteText(tripleMatch[1]);
      }
    }

    // Inline ref: [ref: > table.col]
    const inlineRef = settingsStr.match(/ref\s*:\s*([-<>]+)\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
    if (inlineRef && table) {
      const symbol = inlineRef[1];
      const targetTable = inlineRef[2];
      const targetCol = inlineRef[3];
      let cardinality = '1:N';
      if (symbol === '-') cardinality = '1:1';
      if (symbol === '<>') cardinality = 'N:M';

      relsList.push({
        id: 'rel-' + Math.random().toString(36).substring(2, 9),
        fromTable: table.name,
        fromColumn: col.name,
        toTable: targetTable,
        toColumn: targetCol,
        cardinality,
        onDelete: 'CASCADE'
      });
      col.isFk = true;
    }
  }

  // Mark FK flags on columns
  relationships.forEach(rel => {
    const tbl = tables.find(t => t.name === rel.fromTable);
    if (tbl) {
      const col = tbl.columns.find(c => c.name === rel.fromColumn);
      if (col) col.isFk = true;
    }
  });

  return { tables, relationships };
}

/**
 * DBML Sentence and Line Validator
 */
export function validateDBML(dbmlText) {
  const diagnostics = [];
  if (!dbmlText) return { isValid: true, diagnostics: [] };

  const lines = dbmlText.split('\n');
  let openBraces = 0;
  let inTableBlock = false;
  let inTripleQuoteNote = false;
  let inSettingsBracket = false;
  let inNoteBrace = false;
  let inIndexesBlock = false;
  let inEnumBlock = false;
  let inProjectBlock = false;
  let inTableGroupBlock = false;

  let currentTableName = '';
  const declaredTables = new Set();
  const declaredColumnsMap = new Map();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      continue;
    }

    // 1. If currently inside a triple-quote string/note block
    if (inTripleQuoteNote) {
      if (trimmed.includes("'''")) {
        inTripleQuoteNote = false;
        const afterQuote = trimmed.substring(trimmed.indexOf("'''") + 3);
        if (inSettingsBracket && afterQuote.includes(']')) {
          inSettingsBracket = false;
        }
      }
      continue;
    }

    // 2. If inside Note { ... } block
    if (inNoteBrace) {
      if (trimmed === '}' || trimmed.endsWith('}')) {
        inNoteBrace = false;
      }
      continue;
    }

    // 3. Track brace count
    for (const char of trimmed) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
    }

    if (openBraces < 0) {
      diagnostics.push({
        line: lineNum,
        text: trimmed,
        message: 'Unexpected closing brace "}" without opening block',
        severity: 'error'
      });
      openBraces = 0;
    }

    // Check if inside indexes block
    if (inIndexesBlock) {
      if (trimmed === '}' || trimmed.endsWith('}')) inIndexesBlock = false;
      continue;
    }
    if (inEnumBlock) {
      if (trimmed === '}' || trimmed.endsWith('}')) inEnumBlock = false;
      continue;
    }
    if (inProjectBlock) {
      if (trimmed === '}' || trimmed.endsWith('}')) inProjectBlock = false;
      continue;
    }
    if (inTableGroupBlock) {
      if (trimmed === '}' || trimmed.endsWith('}')) inTableGroupBlock = false;
      continue;
    }

    // Root level blocks: Project, Enum, TableGroup
    if (/^Project\b/i.test(trimmed)) {
      if (trimmed.includes('{')) inProjectBlock = true;
      continue;
    }
    if (/^Enum\b/i.test(trimmed)) {
      if (trimmed.includes('{')) inEnumBlock = true;
      continue;
    }
    if (/^TableGroup\b/i.test(trimmed)) {
      if (trimmed.includes('{')) inTableGroupBlock = true;
      continue;
    }

    // If inside an open [ ... ] bracket across multiple lines (e.g. column settings)
    if (inSettingsBracket) {
      if (trimmed.includes("note:") && trimmed.includes("'''")) {
        const afterTriple = trimmed.substring(trimmed.indexOf("'''") + 3);
        if (!afterTriple.includes("'''")) {
          inTripleQuoteNote = true;
        } else {
          const afterEnd = afterTriple.substring(afterTriple.indexOf("'''") + 3);
          if (afterEnd.includes(']')) inSettingsBracket = false;
        }
      } else if (trimmed.includes("'''")) {
        const afterTriple = trimmed.substring(trimmed.indexOf("'''") + 3);
        if (!afterTriple.includes("'''")) {
          inTripleQuoteNote = true;
        }
      } else if (trimmed.includes(']')) {
        inSettingsBracket = false;
      }
      continue;
    }

    // Match Table header
    if (/^Table\b/i.test(trimmed)) {
      const match = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)(?:\s+as\s+[a-zA-Z0-9_]+)?\s*(\{)?/i);
      if (!match) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Syntax error in Table declaration. Correct format: Table <table_name> {',
          severity: 'error'
        });
      } else {
        const tableName = match[2] || match[1];
        if (declaredTables.has(tableName.toLowerCase())) {
          diagnostics.push({
            line: lineNum,
            text: trimmed,
            message: `Duplicate table definition "${tableName}"`,
            severity: 'warning'
          });
        }
        declaredTables.add(tableName.toLowerCase());
        currentTableName = tableName;
        declaredColumnsMap.set(tableName.toLowerCase(), new Set());
        inTableBlock = true;
      }
      continue;
    }

    if (trimmed === '}' && inTableBlock) {
      inTableBlock = false;
      currentTableName = '';
      continue;
    }

    // Match Ref statement
    if (/^Ref\b/i.test(trimmed)) {
      const refMatch = trimmed.match(/^Ref(?:\s+[a-zA-Z0-9_]+)?\s*:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*([-<>]+)\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
      if (!refMatch) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Syntax error in Ref relationship sentence. Correct format: Ref: table1.col1 > table2.col2',
          severity: 'error'
        });
      } else {
        const symbol = refMatch[3];
        if (!['>', '<', '-', '<>'].includes(symbol)) {
          diagnostics.push({
            line: lineNum,
            text: trimmed,
            message: `Invalid relationship operator "${symbol}". Allowed: ">", "<", "-", or "<>".`,
            severity: 'error'
          });
        }
      }
      continue;
    }

    // Inside Table block - column or table-level element validation
    if (inTableBlock && openBraces > 0) {
      // 1. Check for Table Note statements
      if (/^Note\b/i.test(trimmed)) {
        if (/^Note\s*:?\s*'''/i.test(trimmed)) {
          const afterTriple = trimmed.replace(/^Note\s*:?\s*'''/i, '');
          if (!afterTriple.includes("'''")) {
            inTripleQuoteNote = true;
          }
        } else if (/^Note\s*\{/i.test(trimmed)) {
          inNoteBrace = true;
        }
        continue;
      }

      // 2. Check for indexes block inside table
      if (/^indexes\s*\{/i.test(trimmed)) {
        inIndexesBlock = true;
        continue;
      }

      // 3. Check for accidental SQL table constraint inside DBML Table block
      if (/^CONSTRAINT\b/i.test(trimmed)) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Table constraint keyword "CONSTRAINT" is not used in DBML. Primary keys and unique constraints are defined inline (e.g. "id integer [pk, unique]") or in an "indexes { }" block.',
          severity: 'warning'
        });
        continue;
      }

      // 4. Column line validation
      const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_(),\s]+?))?(?:\s*\[([\s\S]*))?$/i);
      if (!colMatch || !colMatch[1]) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Invalid column sentence syntax in Table block',
          severity: 'error'
        });
      } else {
        const colName = colMatch[1];
        const colType = colMatch[2];
        const bracketContent = colMatch[3];

        if (!colType && bracketContent === undefined) {
          diagnostics.push({
            line: lineNum,
            text: trimmed,
            message: `Missing column data type for "${colName}" (e.g. integer, varchar)`,
            severity: 'warning'
          });
        }

        if (currentTableName) {
          const colSet = declaredColumnsMap.get(currentTableName.toLowerCase());
          if (colSet) {
            if (colSet.has(colName.toLowerCase())) {
              diagnostics.push({
                line: lineNum,
                text: trimmed,
                message: `Duplicate column name "${colName}" in table "${currentTableName}"`,
                severity: 'warning'
              });
            }
            colSet.add(colName.toLowerCase());
          }
        }

        if (bracketContent !== undefined) {
          if (bracketContent.includes("note:") && bracketContent.includes("'''")) {
            const afterTriple = bracketContent.substring(bracketContent.indexOf("'''") + 3);
            if (!afterTriple.includes("'''")) {
              inTripleQuoteNote = true;
              inSettingsBracket = true;
            } else {
              const afterEnd = afterTriple.substring(afterTriple.indexOf("'''") + 3);
              if (!afterEnd.includes(']')) {
                inSettingsBracket = true;
              }
            }
          } else if (!bracketContent.includes(']')) {
            inSettingsBracket = true;
          }
        }
      }
      continue;
    }

    // Unexpected line format
    if (!inTableBlock && !/^Project\b|^Enum\b|^TableGroup\b/i.test(trimmed)) {
      diagnostics.push({
        line: lineNum,
        text: trimmed,
        message: 'Unrecognized line syntax outside table block',
        severity: 'warning'
      });
    }
  }

  if (openBraces > 0) {
    diagnostics.push({
      line: lines.length,
      text: '',
      message: `Unclosed table block - missing ${openBraces} closing brace "}"`,
      severity: 'error'
    });
  }

  return {
    isValid: diagnostics.filter(d => d.severity === 'error').length === 0,
    diagnostics
  };
}

export function exportToSQL(tables, relationships, dialect = 'postgres') {
  let sql = `-- Generated SQL Script for ${dialect.toUpperCase()}\n`;
  sql += `-- Exported on ${new Date().toISOString()}\n\n`;

  if (dialect === 'postgres') {
    tables.forEach(table => {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const colLines = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.isPk) line += ` PRIMARY KEY`;
        if (!col.isNull && !col.isPk) line += ` NOT NULL`;
        if (col.isUnique && !col.isPk) line += ` UNIQUE`;
        return line;
      });
      sql += colLines.join(',\n');
      sql += `\n);\n\n`;

      if (table.note) {
        const cleanTNote = table.note.replace(/'/g, "''");
        sql += `COMMENT ON TABLE "${table.name}" IS '${cleanTNote}';\n`;
      }
      table.columns.forEach(col => {
        if (col.note) {
          const cleanCNote = col.note.replace(/'/g, "''");
          sql += `COMMENT ON COLUMN "${table.name}"."${col.name}" IS '${cleanCNote}';\n`;
        }
      });
      if (table.note || table.columns.some(c => c.note)) {
        sql += `\n`;
      }
    });

    // Foreign Keys
    relationships.forEach(rel => {
      sql += `ALTER TABLE "${rel.fromTable}" ADD CONSTRAINT "fk_${rel.fromTable}_${rel.fromColumn}" `;
      sql += `FOREIGN KEY ("${rel.fromColumn}") REFERENCES "${rel.toTable}" ("${rel.toColumn}") `;
      sql += `ON DELETE ${rel.onDelete || 'CASCADE'};\n\n`;
    });
  } else if (dialect === 'mysql') {
    tables.forEach(table => {
      sql += `CREATE TABLE \`${table.name}\` (\n`;
      const colLines = table.columns.map(col => {
        let line = `  \`${col.name}\` ${col.type.toUpperCase()}`;
        if (col.isPk) line += ` PRIMARY KEY`;
        if (!col.isNull && !col.isPk) line += ` NOT NULL`;
        if (col.isUnique && !col.isPk) line += ` UNIQUE`;
        if (col.note) {
          const cleanCNote = col.note.replace(/'/g, "''").replace(/\n/g, ' ');
          line += ` COMMENT '${cleanCNote}'`;
        }
        return line;
      });
      
      relationships.filter(r => r.fromTable === table.name).forEach(rel => {
        colLines.push(`  CONSTRAINT \`fk_${rel.fromTable}_${rel.fromColumn}\` FOREIGN KEY (\`${rel.fromColumn}\`) REFERENCES \`${rel.toTable}\` (\`${rel.toColumn}\`) ON DELETE ${rel.onDelete || 'CASCADE'}`);
      });

      sql += colLines.join(',\n');
      let tableComment = '';
      if (table.note) {
        const cleanTNote = table.note.replace(/'/g, "''").replace(/\n/g, ' ');
        tableComment = ` COMMENT='${cleanTNote}'`;
      }
      sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4${tableComment};\n\n`;
    });
  } else if (dialect === 'sqlite') {
    tables.forEach(table => {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const colLines = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.isPk) line += ` PRIMARY KEY`;
        if (!col.isNull && !col.isPk) line += ` NOT NULL`;
        if (col.isUnique && !col.isPk) line += ` UNIQUE`;
        return line;
      });

      relationships.filter(r => r.fromTable === table.name).forEach(rel => {
        colLines.push(`  FOREIGN KEY ("${rel.fromColumn}") REFERENCES "${rel.toTable}" ("${rel.toColumn}") ON DELETE ${rel.onDelete || 'CASCADE'}`);
      });

      sql += colLines.join(',\n');
      sql += `\n);\n\n`;
    });
  } else if (dialect === 'mssql') {
    tables.forEach(table => {
      sql += `CREATE TABLE [${table.name}] (\n`;
      const colLines = table.columns.map(col => {
        let line = `  [${col.name}] ${col.type.toUpperCase()}`;
        if (col.isPk) line += ` PRIMARY KEY`;
        if (!col.isNull && !col.isPk) line += ` NOT NULL`;
        if (col.isUnique && !col.isPk) line += ` UNIQUE`;
        return line;
      });
      sql += colLines.join(',\n');
      sql += `\n);\nGO\n\n`;
    });

    relationships.forEach(rel => {
      sql += `ALTER TABLE [${rel.fromTable}] ADD CONSTRAINT [FK_${rel.fromTable}_${rel.fromColumn}] `;
      sql += `FOREIGN KEY ([${rel.fromColumn}]) REFERENCES [${rel.toTable}] ([${rel.toColumn}]) `;
      sql += `ON DELETE ${rel.onDelete || 'CASCADE'};\nGO\n\n`;
    });
  }

  return sql;
}

export function exportToMarkdownDocs(projectName, tables, relationships) {
  let md = `# Database Documentation: ${projectName}\n\n`;
  md += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
  md += `## Schema Summary\n\n`;
  md += `- **Total Tables:** ${tables.length}\n`;
  md += `- **Total Relationships:** ${relationships.length}\n\n`;

  md += `## Tables Overview\n\n`;
  tables.forEach(table => {
    md += `- [${table.name}](#${table.name.toLowerCase()}) - ${table.columns.length} fields`;
    if (table.note) md += `: *${table.note.split('\n')[0]}*`;
    md += `\n`;
  });
  md += `\n---\n\n`;

  tables.forEach(table => {
    md += `### <a id="${table.name.toLowerCase()}"></a> Table: \`${table.name}\`\n\n`;
    if (table.note) {
      md += `**Description:**\n\n> ${table.note.replace(/\n/g, '\n> ')}\n\n`;
    }

    md += `#### Columns\n\n`;
    md += `| Field | Type | Attributes | Description / Notes |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;

    table.columns.forEach(col => {
      let attrs = [];
      if (col.isPk) attrs.push('`PK`');
      if (col.isFk) attrs.push('`FK`');
      if (col.isUnique) attrs.push('`UNIQUE`');
      if (col.isNull === false && !col.isPk) attrs.push('`NOT NULL`');

      const attrStr = attrs.length > 0 ? attrs.join(' ') : '-';
      const noteStr = col.note ? col.note.replace(/\n/g, '<br>') : '-';
      md += `| **\`${col.name}\`** | \`${col.type}\` | ${attrStr} | ${noteStr} |\n`;
    });

    const rels = relationships.filter(r => r.fromTable === table.name || r.toTable === table.name);
    if (rels.length > 0) {
      md += `\n#### Foreign Keys & Relationships\n\n`;
      rels.forEach(r => {
        md += `- \`${r.fromTable}.${r.fromColumn}\` **${r.cardinality}** \`${r.toTable}.${r.toColumn}\`\n`;
      });
    }

    md += `\n---\n\n`;
  });

  return md;
}

