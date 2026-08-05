/**
 * DBML Generator & Converter Utility for Vue ERD Canvas
 */

export function generateDBML(tables, relationships, projectName = 'Database Schema') {
  let dbml = `// DBML Database Schema: ${projectName}\n`;
  dbml += `// Generated on ${new Date().toLocaleDateString()}\n\n`;

  // Tables
  tables.forEach(table => {
    dbml += `Table ${table.name} {\n`;
    table.columns.forEach(col => {
      let settings = [];
      if (col.isPk) settings.push('primary key');
      if (col.isUnique) settings.push('unique');
      if (col.isNull === false && !col.isPk) settings.push('not null');
      if (col.note) {
        if (col.note.includes('\n')) {
          const cleanNote = col.note.replace(/'''/g, "''\\'");
          settings.push(`note: '''\n${cleanNote}\n'''`);
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
        dbml += `  Note: '''\n${cleanTableNote}\n  '''\n`;
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

  const lines = dbmlText.split('\n');
  let currentTable = null;
  let tableX = 80;
  let tableY = 80;

  const headerColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
  let colorIdx = 0;

  let inTableNoteBlock = false;
  let tableNoteBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // If inside a multi-line table note block ''' ... ''' or Note { ... }
    if (inTableNoteBlock && currentTable) {
      if (trimmed.endsWith("'''") || trimmed === "'''" || trimmed === "}") {
        if (trimmed !== "'''" && trimmed !== "}") {
          tableNoteBuffer.push(trimmed.replace(/'''$/, ''));
        }
        currentTable.note = tableNoteBuffer.join('\n').trim();
        inTableNoteBlock = false;
        tableNoteBuffer = [];
      } else {
        tableNoteBuffer.push(line);
      }
      continue;
    }

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    // Match Table definition
    const tableMatch = trimmed.match(/^Table\s+([a-zA-Z0-9_]+)\s*\{/i);
    if (tableMatch) {
      currentTable = {
        id: 'tbl-' + tableMatch[1].toLowerCase(),
        name: tableMatch[1],
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

    // Match Table-level Note inside table
    if (currentTable) {
      // Note: ''' multi-line table note start
      if (/^Note\s*:\s*'''/i.test(trimmed)) {
        const afterQuotes = trimmed.replace(/^Note\s*:\s*'''/i, '');
        if (afterQuotes.endsWith("'''") && afterQuotes.length >= 3) {
          // Single line triple quote Note: '''text'''
          currentTable.note = afterQuotes.slice(0, -3).trim();
        } else {
          inTableNoteBlock = true;
          tableNoteBuffer = [afterQuotes];
        }
        continue;
      }

      // Note: 'single line note' or Note: "single line note"
      const singleTableNoteMatch = trimmed.match(/^Note\s*:\s*['"]([^'"]+)['"]/i);
      if (singleTableNoteMatch) {
        currentTable.note = singleTableNoteMatch[1];
        continue;
      }

      // Note { ... } block
      if (/^Note\s*\{/i.test(trimmed)) {
        inTableNoteBlock = true;
        tableNoteBuffer = [];
        continue;
      }

      // Match column inside table
      const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+)(?:\s*\[(.*)\])?/i);
      if (colMatch) {
        const colName = colMatch[1];
        const colType = colMatch[2];
        const settingsRaw = colMatch[3] || '';

        const isPk = /primary key|pk/i.test(settingsRaw);
        const isUnique = /unique/i.test(settingsRaw);
        const isNull = !/not null/i.test(settingsRaw) && !isPk;

        let note = '';
        // Check for field note: note: '''multiline''' or note: 'single line' or note: "single line"
        const tripleNoteMatch = settingsRaw.match(/note:\s*'''([\s\S]*?)'''/i);
        if (tripleNoteMatch) {
          note = tripleNoteMatch[1].trim();
        } else {
          const singleNoteMatch = settingsRaw.match(/note:\s*['"]([^'"]+)['"]/i);
          if (singleNoteMatch) note = singleNoteMatch[1];
        }

        currentTable.columns.push({
          name: colName,
          type: colType,
          isPk,
          isFk: false,
          isNull,
          isUnique,
          note
        });
        continue;
      }
    }

    // Match Ref: table1.col1 > table2.col2
    const refMatch = trimmed.match(/^Ref:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*([-<>]+)\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
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
  let currentTableName = '';
  const declaredTables = new Set();
  const declaredColumnsMap = new Map();

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      return;
    }

    // Bracket count tracking
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

    // Match Table header
    if (/^Table\b/i.test(trimmed)) {
      const match = trimmed.match(/^Table\s+([a-zA-Z0-9_]+)\s*(\{)?/i);
      if (!match) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Syntax error in Table declaration. Correct format: Table <table_name> {',
          severity: 'error'
        });
      } else {
        const tableName = match[1];
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
      return;
    }

    if (trimmed === '}') {
      inTableBlock = false;
      currentTableName = '';
      return;
    }

    // Match Ref statement
    if (/^Ref\s*:/i.test(trimmed)) {
      const refMatch = trimmed.match(/^Ref\s*:\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*([-<>]+)\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
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
      return;
    }

    // Inside Table block - column validation
    if (inTableBlock && openBraces > 0) {
      const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)(\s+([a-zA-Z0-9_()]+))?(\s*\[(.*)\])?/i);
      if (!colMatch || !colMatch[1]) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Invalid column sentence syntax in Table block',
          severity: 'error'
        });
      } else {
        const colName = colMatch[1];
        const colType = colMatch[3];

        if (!colType) {
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

        if (trimmed.includes('[') && !trimmed.includes(']')) {
          diagnostics.push({
            line: lineNum,
            text: trimmed,
            message: 'Unclosed column attribute bracket "[" - missing "]"',
            severity: 'error'
          });
        }
      }
      return;
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
  });

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
        return line;
      });
      
      relationships.filter(r => r.fromTable === table.name).forEach(rel => {
        colLines.push(`  CONSTRAINT \`fk_${rel.fromTable}_${rel.fromColumn}\` FOREIGN KEY (\`${rel.fromColumn}\`) REFERENCES \`${rel.toTable}\` (\`${rel.toColumn}\`) ON DELETE ${rel.onDelete || 'CASCADE'}`);
      });

      sql += colLines.join(',\n');
      sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
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

