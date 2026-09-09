/**
 * SQL Importer Utility for dbmaps
 * Robust parser supporting MySQL, PostgreSQL, and Microsoft SQL Server (MSSQL) DDL scripts,
 * as well as DBML syntax.
 */

import { parseDBML } from './dbmlParser.js';

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316', // orange
  '#a855f7'  // purple
];

/**
 * Strips SQL comments:
 * - Single-line: -- ...
 * - Hash comment (MySQL): # ...
 * - Multi-line: /* ... *\/
 */
export function stripSQLComments(sql) {
  if (!sql) return '';
  // Strip multiline comments
  let text = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Strip single-line comments (-- and #)
  const lines = text.split('\n');
  const cleanLines = lines.map(line => {
    // If line has -- or # not inside quotes
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let commentStart = -1;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (ch === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      } else if (!inSingleQuote && !inDoubleQuote) {
        if (ch === '-' && line[i + 1] === '-') {
          commentStart = i;
          break;
        }
        if (ch === '#') {
          commentStart = i;
          break;
        }
      }
    }

    if (commentStart !== -1) {
      return line.substring(0, commentStart);
    }
    return line;
  });

  return cleanLines.join('\n');
}

/**
 * Cleans identifier names by removing quotes/delimiters:
 * - `table` (MySQL)
 * - "table" (PostgreSQL)
 * - [table] (MSSQL)
 * Also strips schema prefixes like dbo.tableName or public.tableName.
 */
export function cleanIdentifier(identifier) {
  if (!identifier) return '';
  let str = identifier.trim();

  // If contains schema qualifier e.g. [dbo].[Users] or "public"."users" or dbo.Users
  const parts = str.split('.').map(p => {
    let clean = p.trim();
    if (clean.startsWith('`') && clean.endsWith('`')) clean = clean.slice(1, -1);
    else if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
    else if (clean.startsWith('[') && clean.endsWith(']')) clean = clean.slice(1, -1);
    return clean;
  });

  // If qualified with schema like dbo.Table, return the table name (last segment)
  return parts[parts.length - 1] || str;
}

/**
 * Automatically detects SQL dialect (mysql, postgres, mssql, or dbml)
 */
export function detectDialect(script) {
  if (!script) return 'postgres';
  const lower = script.toLowerCase();

  // Check if DBML
  if (/^\s*(Table|Project|TableGroup|Ref:)\b/im.test(script) && !lower.includes('create table')) {
    return 'dbml';
  }

  // Check MSSQL
  if (
    lower.includes('[dbo]') ||
    /\bGO\b/m.test(script) ||
    lower.includes('identity(') ||
    lower.includes('nvarchar') ||
    lower.includes('uniqueidentifier') ||
    lower.includes('datetime2') ||
    lower.includes('clustered') ||
    lower.includes('with check add constraint')
  ) {
    return 'mssql';
  }

  // Check MySQL
  if (
    lower.includes('engine=') ||
    lower.includes('auto_increment') ||
    lower.includes('unsigned') ||
    lower.includes('tinyint') ||
    lower.includes('mediumtext') ||
    lower.includes('longtext') ||
    lower.includes('datetime on update') ||
    lower.includes('default charset')
  ) {
    return 'mysql';
  }

  // Check PostgreSQL
  if (
    lower.includes('serial') ||
    lower.includes('bigserial') ||
    lower.includes('timestamptz') ||
    lower.includes('jsonb') ||
    lower.includes('bytea') ||
    lower.includes('comment on table') ||
    lower.includes('comment on column') ||
    lower.includes('gen_random_uuid') ||
    lower.includes('public.')
  ) {
    return 'postgres';
  }

  return 'postgres';
}

/**
 * Splits top-level statements handling parentheses and quotes
 */
function splitTopLevel(text, delimiter = ';') {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBracket = false;
  let parenDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';

    if (ch === "'" && prev !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && prev !== '\\' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (ch === '[' && !inSingleQuote && !inDoubleQuote) {
      inBracket = true;
    } else if (ch === ']' && inBracket) {
      inBracket = false;
    } else if (!inSingleQuote && !inDoubleQuote && !inBracket) {
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    }

    if (ch === delimiter && parenDepth === 0 && !inSingleQuote && !inDoubleQuote && !inBracket) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

/**
 * Safely splits comma-separated items inside a CREATE TABLE (...) body
 */
function splitTableMembers(bodyText) {
  const members = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inBracket = false;
  let parenDepth = 0;

  for (let i = 0; i < bodyText.length; i++) {
    const ch = bodyText[i];
    const prev = i > 0 ? bodyText[i - 1] : '';

    if (ch === "'" && prev !== '\\' && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && prev !== '\\' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    } else if (ch === '[' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      inBracket = true;
    } else if (ch === ']' && inBracket) {
      inBracket = false;
    } else if (!inSingleQuote && !inDoubleQuote && !inBacktick && !inBracket) {
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    }

    if (ch === ',' && parenDepth === 0 && !inSingleQuote && !inDoubleQuote && !inBacktick && !inBracket) {
      if (current.trim()) members.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    members.push(current.trim());
  }

  return members;
}

/**
 * Checks if a SQL table member statement is a table-level constraint or index
 */
function isTableLevelConstraint(trimmed) {
  if (!trimmed) return true;
  // If it starts with unquoted CONSTRAINT (with or without constraint name)
  // e.g. "CONSTRAINT failed_jobs_pkey PRIMARY KEY ...", "CONSTRAINT UNIQUE ...", "CONSTRAINT [UQ_1] ...", "CONSTRAINT"
  if (/^CONSTRAINT\b/i.test(trimmed)) return true;

  // Table-level constraint / index keywords
  if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|KEY|INDEX|FULLTEXT|SPATIAL|EXCLUDE|PERIOD)\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Main parser function to import SQL (MySQL, Postgres, MSSQL) or DBML
 */
export function parseSQLSchema(rawText, userDialect = 'auto') {
  if (!rawText || !rawText.trim()) {
    return { tables: [], relationships: [], dialect: userDialect, warnings: [] };
  }

  const warnings = [];
  let detected = userDialect === 'auto' ? detectDialect(rawText) : userDialect;

  // If DBML script detected or chosen
  if (detected === 'dbml' || (/^\s*(Table|Project|Ref:)\b/im.test(rawText) && !/CREATE\s+TABLE/i.test(rawText))) {
    try {
      const parsed = parseDBML(rawText);
      if (parsed.tables && parsed.tables.length > 0) {
        layoutTables(parsed.tables);
        return {
          tables: parsed.tables,
          relationships: parsed.relationships || [],
          dialect: 'postgres',
          format: 'dbml',
          warnings: []
        };
      }
    } catch (err) {
      warnings.push(`DBML parse notice: ${err.message}`);
    }
  }

  const cleanSql = stripSQLComments(rawText);
  // Separate on semicolon or MSSQL "GO" batch separator
  const rawStatements = splitTopLevel(cleanSql, ';');
  const statements = [];

  for (const stmt of rawStatements) {
    // Also split on \nGO\b if MSSQL
    const goParts = stmt.split(/\n\s*GO\s*(?:\r?\n|$)/i);
    for (const part of goParts) {
      if (part.trim()) statements.push(part.trim());
    }
  }

  const tablesMap = new Map();
  const relationships = [];
  const tableNotes = new Map();
  const columnNotes = new Map(); // "tableName.colName" -> note

  // Phase 1: Process PostgreSQL comments
  for (const stmt of statements) {
    const tableCommentMatch = stmt.match(/COMMENT\s+ON\s+TABLE\s+([^\s]+)\s+IS\s+'([\s\S]*?)'/i);
    if (tableCommentMatch) {
      const tblName = cleanIdentifier(tableCommentMatch[1]);
      tableNotes.set(tblName.toLowerCase(), tableCommentMatch[2].replace(/''/g, "'"));
      continue;
    }

    const colCommentMatch = stmt.match(/COMMENT\s+ON\s+COLUMN\s+([^\s]+)\s+IS\s+'([\s\S]*?)'/i);
    if (colCommentMatch) {
      const fullTarget = colCommentMatch[1].trim();
      const dotIndex = fullTarget.lastIndexOf('.');
      if (dotIndex !== -1) {
        const tblPart = fullTarget.substring(0, dotIndex);
        const colPart = fullTarget.substring(dotIndex + 1);
        const tblName = cleanIdentifier(tblPart).toLowerCase();
        const colName = cleanIdentifier(colPart).toLowerCase();
        columnNotes.set(`${tblName}.${colName}`, colCommentMatch[2].replace(/''/g, "'"));
      }
      continue;
    }
  }

  // Phase 2: Process CREATE TABLE statements
  for (const stmt of statements) {
    const createMatch = stmt.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([^\s(]+)\s*\(([\s\S]*)\)([\s\S]*)$/i);
    if (!createMatch) continue;

    const rawTableName = createMatch[1];
    const tableName = cleanIdentifier(rawTableName);
    if (!tableName) continue;

    const body = createMatch[2];
    const tableOptions = createMatch[3] || '';

    // Extract table comment from options (MySQL COMMENT='...')
    let tableNote = tableNotes.get(tableName.toLowerCase()) || '';
    if (!tableNote) {
      const mysqlTableComment = tableOptions.match(/COMMENT\s*=\s*'([\s\S]*?)'/i);
      if (mysqlTableComment) {
        tableNote = mysqlTableComment[1].replace(/''/g, "'");
      }
    }

    const members = splitTableMembers(body);
    const columns = [];
    const tableLevelPks = new Set();
    const tableLevelUniques = new Set();

    // First pass: identify table-level PRIMARY KEY, UNIQUE, and FOREIGN KEY definitions
    for (const member of members) {
      const trimmed = member.trim();

      // PRIMARY KEY (...)
      const pkMatch = trimmed.match(/^(?:CONSTRAINT\s+[`"\[]?[^`"\]\s]+[`"\]]?\s+)?PRIMARY\s+KEY(?:\s+CLUSTERED|\s+NONCLUSTERED)?\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkCols = pkMatch[1].split(',').map(c => cleanIdentifier(c.trim().split(/\s+/)[0]).toLowerCase());
        pkCols.forEach(c => tableLevelPks.add(c));
        continue;
      }

      // UNIQUE (...) or UNIQUE KEY (...)
      const uqMatch = trimmed.match(/^(?:CONSTRAINT\s+[`"\[]?[^`"\]\s]+[`"\]]?\s+)?UNIQUE(?:\s+KEY|\s+INDEX)?(?:\s+[`"\[]?[^`"\]\s]+[`"\]]?)?\s*\(([^)]+)\)/i);
      if (uqMatch) {
        const uqCols = uqMatch[1].split(',').map(c => cleanIdentifier(c.trim().split(/\s+/)[0]).toLowerCase());
        uqCols.forEach(c => tableLevelUniques.add(c));
        continue;
      }

      // FOREIGN KEY (...) REFERENCES targetTable (...)
      const fkMatch = trimmed.match(/^(?:CONSTRAINT\s+[`"\[]?[^`"\]\s]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)([\s\S]*)/i);
      if (fkMatch) {
        const fromCol = cleanIdentifier(fkMatch[1].split(',')[0]);
        const targetTable = cleanIdentifier(fkMatch[2]);
        const targetCol = cleanIdentifier(fkMatch[3].split(',')[0]);
        const fkOptions = fkMatch[4] || '';

        let onDelete = 'CASCADE';
        const onDeleteMatch = fkOptions.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i);
        if (onDeleteMatch) {
          onDelete = onDeleteMatch[1].toUpperCase();
        }

        relationships.push({
          id: 'rel-' + Math.random().toString(36).substring(2, 9),
          fromTable: tableName,
          fromColumn: fromCol,
          toTable: targetTable,
          toColumn: targetCol,
          cardinality: '1:N',
          onDelete
        });
        continue;
      }
    }

    // Second pass: column definitions
    for (const member of members) {
      const trimmed = member.trim();

      // Skip table-level constraints and index definitions (PRIMARY KEY, CONSTRAINT ..., UNIQUE ..., etc.)
      if (isTableLevelConstraint(trimmed)) {
        continue;
      }

      // Parse column line: name type [modifiers...]
      // Handles delimiters: `col`, "col", [col], or col
      const colMatch = trimmed.match(/^([`"\[]?[a-zA-Z0-9_$]+[`"\]]?)\s+([a-zA-Z0-9_]+(?:\s*\([^)]*\))?(?:\s*\[\])?)([\s\S]*)$/);
      if (!colMatch) {
        // Fallback for special single-token definitions
        continue;
      }

      const colName = cleanIdentifier(colMatch[1]);
      // Discard any residual constraint keywords as columns
      if (!colName || colName.toUpperCase() === 'CONSTRAINT') {
        continue;
      }

      let colType = colMatch[2].trim().toLowerCase();
      // If type matches constraint keywords, this is not a valid column
      if (/^(primary|foreign|unique|check|key|index|constraint)\b/i.test(colType)) {
        continue;
      }

      const modifiers = colMatch[3] || '';

      const modLower = modifiers.toLowerCase();

      // Detect PK
      const isPk =
        tableLevelPks.has(colName.toLowerCase()) ||
        modLower.includes('primary key') ||
        colType === 'serial' ||
        colType === 'bigserial' ||
        modLower.includes('identity(') ||
        modLower.includes('auto_increment');

      // Detect Nullable
      let isNull = true;
      if (isPk || modLower.includes('not null')) {
        isNull = false;
      } else if (/\bnull\b/.test(modLower) && !modLower.includes('not null')) {
        isNull = true;
      }

      // Detect Unique
      const isUnique =
        isPk ||
        tableLevelUniques.has(colName.toLowerCase()) ||
        /\bunique\b/.test(modLower);

      // Detect Column Comment / Note
      let colNote = columnNotes.get(`${tableName.toLowerCase()}.${colName.toLowerCase()}`) || '';
      if (!colNote) {
        const mysqlComment = modifiers.match(/COMMENT\s+'([\s\S]*?)'/i);
        if (mysqlComment) {
          colNote = mysqlComment[1].replace(/''/g, "'");
        }
      }

      // Check for inline REFERENCES targetTable (targetCol)
      const inlineFkMatch = modifiers.match(/REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)([\s\S]*)/i);
      if (inlineFkMatch) {
        const targetTable = cleanIdentifier(inlineFkMatch[1]);
        const targetCol = cleanIdentifier(inlineFkMatch[2].split(',')[0]);
        let onDelete = 'CASCADE';
        const onDeleteMatch = (inlineFkMatch[3] || '').match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i);
        if (onDeleteMatch) {
          onDelete = onDeleteMatch[1].toUpperCase();
        }

        relationships.push({
          id: 'rel-' + Math.random().toString(36).substring(2, 9),
          fromTable: tableName,
          fromColumn: colName,
          toTable: targetTable,
          toColumn: targetCol,
          cardinality: isUnique ? '1:1' : '1:N',
          onDelete
        });
      }

      columns.push({
        name: colName,
        type: colType,
        isPk,
        isFk: false, // will update later
        isNull,
        isUnique,
        note: colNote
      });
    }

    if (columns.length > 0) {
      tablesMap.set(tableName.toLowerCase(), {
        id: 'tbl-' + tableName.toLowerCase().replace(/[^a-z0-9_]/g, '-'),
        name: tableName,
        headerColor: PALETTE[tablesMap.size % PALETTE.length],
        x: 60,
        y: 60,
        note: tableNote,
        columns
      });
    }
  }

  // Phase 3: Process ALTER TABLE ... ADD CONSTRAINT statements (Foreign Keys, Primary Keys, Unique)
  for (const stmt of statements) {
    // 1. ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
    const alterFkMatch = stmt.match(/ALTER\s+TABLE(?:\s+ONLY)?\s+([^\s]+)(?:[\s\S]*?)ADD\s+(?:CONSTRAINT\s+([^\s]+)\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)([\s\S]*)/i);
    if (alterFkMatch) {
      const fromTable = cleanIdentifier(alterFkMatch[1]);
      const fromCol = cleanIdentifier(alterFkMatch[3].split(',')[0]);
      const toTable = cleanIdentifier(alterFkMatch[4]);
      const toCol = cleanIdentifier(alterFkMatch[5].split(',')[0]);
      const options = alterFkMatch[6] || '';

      let onDelete = 'CASCADE';
      const onDeleteMatch = options.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION)/i);
      if (onDeleteMatch) {
        onDelete = onDeleteMatch[1].toUpperCase();
      }

      relationships.push({
        id: 'rel-' + Math.random().toString(36).substring(2, 9),
        fromTable,
        fromColumn: fromCol,
        toTable,
        toColumn: toCol,
        cardinality: '1:N',
        onDelete
      });
      continue;
    }

    // 2. ALTER TABLE ... ADD CONSTRAINT ... PRIMARY KEY
    const alterPkMatch = stmt.match(/ALTER\s+TABLE(?:\s+ONLY)?\s+([^\s]+)(?:[\s\S]*?)ADD\s+(?:CONSTRAINT\s+([^\s]+)\s+)?PRIMARY\s+KEY(?:\s+CLUSTERED|\s+NONCLUSTERED)?\s*\(([^)]+)\)/i);
    if (alterPkMatch) {
      const tblName = cleanIdentifier(alterPkMatch[1]).toLowerCase();
      const cols = alterPkMatch[3].split(',').map(c => cleanIdentifier(c.trim().split(/\s+/)[0]).toLowerCase());
      const tbl = tablesMap.get(tblName);
      if (tbl) {
        tbl.columns.forEach(col => {
          if (cols.includes(col.name.toLowerCase())) {
            col.isPk = true;
            col.isNull = false;
          }
        });
      }
      continue;
    }

    // 3. ALTER TABLE ... ADD CONSTRAINT ... UNIQUE
    const alterUqMatch = stmt.match(/ALTER\s+TABLE(?:\s+ONLY)?\s+([^\s]+)(?:[\s\S]*?)ADD\s+(?:CONSTRAINT\s+([^\s]+)\s+)?UNIQUE(?:\s+KEY|\s+INDEX)?\s*\(([^)]+)\)/i);
    if (alterUqMatch) {
      const tblName = cleanIdentifier(alterUqMatch[1]).toLowerCase();
      const cols = alterUqMatch[3].split(',').map(c => cleanIdentifier(c.trim().split(/\s+/)[0]).toLowerCase());
      const tbl = tablesMap.get(tblName);
      if (tbl) {
        tbl.columns.forEach(col => {
          if (cols.includes(col.name.toLowerCase())) {
            col.isUnique = true;
          }
        });
      }
      continue;
    }
  }

  const tables = Array.from(tablesMap.values());

  // Mark FK flags and refine cardinalities
  relationships.forEach(rel => {
    const tbl = tables.find(t => t.name.toLowerCase() === rel.fromTable.toLowerCase());
    if (tbl) {
      // Normalize exact case
      rel.fromTable = tbl.name;
      const col = tbl.columns.find(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase());
      if (col) {
        rel.fromColumn = col.name;
        col.isFk = true;
        if (col.isUnique || col.isPk) {
          rel.cardinality = '1:1';
        }
      }
    }
    const toTbl = tables.find(t => t.name.toLowerCase() === rel.toTable.toLowerCase());
    if (toTbl) {
      rel.toTable = toTbl.name;
      const toCol = toTbl.columns.find(c => c.name.toLowerCase() === rel.toColumn.toLowerCase());
      if (toCol) {
        rel.toColumn = toCol.name;
      }
    }
  });

  // Calculate layout coordinates so tables are arranged neatly on the canvas
  layoutTables(tables);

  return {
    tables,
    relationships,
    dialect: detected === 'dbml' ? 'postgres' : detected,
    warnings
  };
}

/**
 * Arranges tables on an ERD grid layout to prevent overlapping
 */
function layoutTables(tables) {
  const COL_WIDTH = 340;
  const GAP_X = 50;
  const GAP_Y = 50;
  const START_X = 60;
  const START_Y = 60;
  const COLUMNS = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(tables.length))));

  const colHeights = new Array(COLUMNS).fill(START_Y);

  tables.forEach((table, index) => {
    // Find shortest column
    let minCol = 0;
    for (let c = 1; c < COLUMNS; c++) {
      if (colHeights[c] < colHeights[minCol]) {
        minCol = c;
      }
    }

    const x = START_X + minCol * (COL_WIDTH + GAP_X);
    const y = colHeights[minCol];

    table.x = x;
    table.y = y;

    // Approximate table card height: header (50px) + columns (32px each) + padding (30px)
    const cardHeight = 60 + (table.columns ? table.columns.length * 32 : 120);
    colHeights[minCol] += cardHeight + GAP_Y;
  });
}

/**
 * Sample SQL templates for testing in Import dialog
 */
export const SAMPLE_IMPORT_TEMPLATES = {
  postgres: `-- PostgreSQL Sample DDL
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "profiles" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
  "bio" TEXT,
  "avatar_url" VARCHAR(255)
);

CREATE TABLE "orders" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "total" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "status" VARCHAR(20) DEFAULT 'pending',
  "placed_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

COMMENT ON TABLE "users" IS 'Application registered accounts and authentication credentials';
COMMENT ON COLUMN "users"."email" IS 'Verified primary user contact email';
`,

  mysql: `-- MySQL Sample DDL
CREATE TABLE \`customers\` (
  \`customer_id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`company_name\` VARCHAR(100) NOT NULL,
  \`contact_email\` VARCHAR(150) NOT NULL UNIQUE,
  \`credit_limit\` DECIMAL(12,2) DEFAULT 0.00,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`customer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Client organizations and billing contacts';

CREATE TABLE \`invoices\` (
  \`invoice_id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`customer_id\` INT(11) NOT NULL,
  \`invoice_number\` VARCHAR(30) NOT NULL UNIQUE,
  \`amount_due\` DECIMAL(10,2) NOT NULL,
  \`status\` ENUM('draft', 'sent', 'paid', 'overdue') DEFAULT 'draft',
  \`due_date\` DATE NOT NULL,
  PRIMARY KEY (\`invoice_id\`),
  KEY \`idx_customer\` (\`customer_id\`),
  CONSTRAINT \`fk_invoice_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`customer_id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`invoice_items\` (
  \`item_id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`invoice_id\` INT(11) NOT NULL,
  \`description\` VARCHAR(255) NOT NULL,
  \`unit_price\` DECIMAL(10,2) NOT NULL,
  \`quantity\` INT(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (\`item_id\`),
  CONSTRAINT \`fk_item_invoice\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\` (\`invoice_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  mssql: `-- Microsoft SQL Server (MSSQL) Sample DDL
CREATE TABLE [dbo].[Departments] (
  [DepartmentID] INT IDENTITY(1,1) NOT NULL,
  [DepartmentName] NVARCHAR(100) NOT NULL,
  [Budget] DECIMAL(14,2) NOT NULL,
  CONSTRAINT [PK_Departments] PRIMARY KEY CLUSTERED ([DepartmentID] ASC)
);
GO

CREATE TABLE [dbo].[Employees] (
  [EmployeeID] INT IDENTITY(1,1) NOT NULL,
  [DepartmentID] INT NOT NULL,
  [FirstName] NVARCHAR(50) NOT NULL,
  [LastName] NVARCHAR(50) NOT NULL,
  [Email] NVARCHAR(100) NOT NULL UNIQUE,
  [HireDate] DATE NOT NULL,
  CONSTRAINT [PK_Employees] PRIMARY KEY CLUSTERED ([EmployeeID] ASC),
  CONSTRAINT [FK_Employees_Departments] FOREIGN KEY ([DepartmentID]) REFERENCES [dbo].[Departments] ([DepartmentID]) ON DELETE CASCADE
);
GO

CREATE TABLE [dbo].[Projects] (
  [ProjectID] INT IDENTITY(1,1) NOT NULL,
  [ProjectName] NVARCHAR(150) NOT NULL,
  [StartDate] DATE NOT NULL,
  [EndDate] DATE NULL,
  CONSTRAINT [PK_Projects] PRIMARY KEY CLUSTERED ([ProjectID] ASC)
);
GO

CREATE TABLE [dbo].[EmployeeProjects] (
  [EmployeeID] INT NOT NULL,
  [ProjectID] INT NOT NULL,
  [Role] NVARCHAR(50) NOT NULL,
  CONSTRAINT [PK_EmployeeProjects] PRIMARY KEY CLUSTERED ([EmployeeID] ASC, [ProjectID] ASC)
);
GO

ALTER TABLE [dbo].[EmployeeProjects] WITH CHECK ADD CONSTRAINT [FK_EmployeeProjects_Employees] 
FOREIGN KEY ([EmployeeID]) REFERENCES [dbo].[Employees] ([EmployeeID]) ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[EmployeeProjects] WITH CHECK ADD CONSTRAINT [FK_EmployeeProjects_Projects] 
FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Projects] ([ProjectID]) ON DELETE CASCADE;
GO
`
};
