import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

// Define DBML Language Stream Parser
export const dbmlLanguage = StreamLanguage.define({
  name: 'dbml',
  startState() {
    return {
      inComment: false,
      inString: false,
      stringQuote: null,
      inBracket: false,
    };
  },
  token(stream, state) {
    // Skip spaces
    if (stream.eatSpace()) return null;

    // Line Comments // or #
    if (stream.match('//') || stream.match('#')) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Triple single quote string / note: '''
    if (stream.match("'''")) {
      if (state.inString && state.stringQuote === "'''") {
        state.inString = false;
        state.stringQuote = null;
      } else if (!state.inString) {
        state.inString = true;
        state.stringQuote = "'''";
      }
      return 'string';
    }

    if (state.inString && state.stringQuote === "'''") {
      stream.next();
      return 'string';
    }

    // Single quote or Double quote string
    if (stream.match("'") || stream.match('"')) {
      const q = stream.current();
      if (state.inString && state.stringQuote === q) {
        state.inString = false;
        state.stringQuote = null;
      } else if (!state.inString) {
        state.inString = true;
        state.stringQuote = q;
      }
      return 'string';
    }

    if (state.inString) {
      stream.next();
      return 'string';
    }

    // DBML Core Keywords
    if (stream.match(/\b(Table|Ref|Enum|Project|TableGroup|indexes)\b/i)) {
      return 'keyword';
    }

    // Brackets [ ]
    if (stream.match('[') || stream.match(']')) {
      return 'squareBracket';
    }

    // Braces { }
    if (stream.match('{') || stream.match('}')) {
      return 'brace';
    }

    // Ref operators >, <, -, <>
    if (stream.match('>|<=|>=|<>|-|<')) {
      return 'operator';
    }

    // Attribute Keywords inside/outside brackets
    if (stream.match(/\b(note|ref|headercolor)\s*:/i)) {
      return 'definitionKeyword';
    }

    if (stream.match(/\b(pk|primary key|increment|unique|not null|null)\b/i)) {
      return 'attributeName';
    }

    // Data Types (bigint, varchar, json, timestamp, etc)
    if (stream.match(/\b(bigint|int|integer|varchar|text|boolean|bool|timestampz|timestamp|datetime|date|time|uuid|smallint|decimal|numeric|float|double|json|jsonb|blob)\b/i)) {
      return 'typeName';
    }

    // Numbers
    if (stream.match(/\b\d+\b/)) {
      return 'number';
    }

    // Identifiers (Column / Table names)
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_.]*/)) {
      return 'variableName';
    }

    stream.next();
    return null;
  }
});

// ChartDB-like Syntax Color Highlight Styles
export const dbmlHighlightStyleLight = HighlightStyle.define([
  { tag: t.keyword, color: '#1d4ed8', fontWeight: '700' }, // Bold Blue (Table, Ref, Enum)
  { tag: t.typeName, color: '#0284c7', fontWeight: '600' }, // Cyan / Teal (bigint, varchar, json)
  { tag: t.squareBracket, color: '#16a34a', fontWeight: '700' }, // Green [ ]
  { tag: t.attributeName, color: '#15803d', fontWeight: '600' }, // Dark Green (pk, increment, not null)
  { tag: t.definitionKeyword, color: '#1d4ed8', fontWeight: '600' }, // Blue (note:, ref:)
  { tag: t.string, color: '#b91c1c' }, // Dark Red / Brown (''' Note content ''')
  { tag: t.lineComment, color: '#64748b', fontStyle: 'italic' }, // Slate comment
  { tag: t.brace, color: '#1d4ed8', fontWeight: '700' }, // Blue braces { }
  { tag: t.operator, color: '#16a34a', fontWeight: '700' }, // Green relationship operators >
  { tag: t.variableName, color: '#0f172a', fontWeight: '500' }, // Navy / Slate table and field names
  { tag: t.number, color: '#0284c7' }
]);

export const dbmlHighlightStyleDark = HighlightStyle.define([
  { tag: t.keyword, color: '#60a5fa', fontWeight: '700' }, // Bright Blue (Table, Ref, Enum)
  { tag: t.typeName, color: '#38bdf8', fontWeight: '600' }, // Sky Cyan (bigint, varchar, json)
  { tag: t.squareBracket, color: '#4ade80', fontWeight: '700' }, // Bright Green [ ]
  { tag: t.attributeName, color: '#4ade80', fontWeight: '600' }, // Bright Green (pk, increment, not null)
  { tag: t.definitionKeyword, color: '#818cf8', fontWeight: '600' }, // Indigo / Blue (note:, ref:)
  { tag: t.string, color: '#f87171' }, // Red / Coral (''' Note content ''')
  { tag: t.lineComment, color: '#64748b', fontStyle: 'italic' }, // Comment
  { tag: t.brace, color: '#60a5fa', fontWeight: '700' }, // Braces { }
  { tag: t.operator, color: '#4ade80', fontWeight: '700' }, // Green relationship operators >
  { tag: t.variableName, color: '#f8fafc', fontWeight: '500' }, // Slate-50 field names
  { tag: t.number, color: '#38bdf8' }
]);

// Theme Base Editor Styles
export function createEditorTheme(isDark = true) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '12px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    '.cm-content': {
      caretColor: isDark ? '#38bdf8' : '#2563eb',
      paddingTop: '12px',
      paddingBottom: '12px',
      lineHeight: '1.625',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: isDark ? '#38bdf8' : '#2563eb',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(147, 197, 253, 0.4)',
    },
    '.cm-gutters': {
      backgroundColor: isDark ? '#040711' : '#f8fafc',
      color: isDark ? '#475569' : '#94a3b8',
      borderRight: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      paddingRight: '4px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      color: isDark ? '#cbd5e1' : '#334155',
      fontWeight: 'bold',
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.9)',
    },
    '.cm-line': {
      paddingLeft: '12px',
      paddingRight: '12px',
    }
  }, { dark: isDark });
}
