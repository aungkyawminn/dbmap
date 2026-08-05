import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // AI Schema Generation Endpoint using server-side Gemini API
  app.post('/api/generate-schema', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please add your API key in AI Studio Settings -> Environment Variables.'
        });
      }

      const { prompt, dialect = 'postgres', mode = 'new', existingTables = [] } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Please provide a prompt describing your database requirements.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are an expert principal database architect and ERD schema designer.
Your task is to generate or extend a clean relational database schema based on the user's prompt.
Target SQL Dialect: ${dialect}.

Guidelines:
1. Generate intuitive snake_case table and column names (e.g. user_id, created_at, total_amount).
2. Set 'pk': true for Primary Keys (usually 'id').
3. Set 'fk': true for Foreign Keys (e.g. 'user_id', 'order_id').
4. Set 'notNull': true for compulsory fields.
5. Set 'unique': true for email, username, sku, slug, etc.
6. Provide accurate, dialect-specific data types (e.g., integer, varchar(255), text, boolean, timestamp, decimal(10,2), uuid).
7. Generate valid foreign key relationships:
   - fromTable: table containing the foreign key (child)
   - fromColumn: foreign key column name
   - toTable: referenced parent table
   - toColumn: primary key column name in parent table (usually 'id')
   - type: '1:N', '1:1', or 'N:M'
8. Pick attractive hex header colors for tables (#3b82f6, #10b981, #f59e0b, #8b5cf6, #ec4899, #06b6d4, #6366f1, #ef4444).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          schemaName: { type: Type.STRING, description: "Short descriptive title for the generated schema" },
          description: { type: Type.STRING, description: "Detailed architectural summary of the generated schema" },
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Table name in snake_case" },
                comment: { type: Type.STRING, description: "Purpose of the table" },
                headerColor: { type: Type.STRING, description: "Hex color code" },
                columns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      pk: { type: Type.BOOLEAN },
                      fk: { type: Type.BOOLEAN },
                      notNull: { type: Type.BOOLEAN },
                      unique: { type: Type.BOOLEAN },
                      comment: { type: Type.STRING }
                    },
                    required: ["name", "type"]
                  }
                }
              },
              required: ["name", "columns"]
            }
          },
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fromTable: { type: Type.STRING },
                fromColumn: { type: Type.STRING },
                toTable: { type: Type.STRING },
                toColumn: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["fromTable", "fromColumn", "toTable", "toColumn"]
            }
          }
        },
        required: ["schemaName", "tables", "relationships"]
      };

      let contentPrompt = `User Requirement: ${prompt}`;
      if (mode === 'extend' && existingTables.length > 0) {
        contentPrompt += `\n\nExtend the existing database schema structure: ${JSON.stringify(
          existingTables.map(t => ({ name: t.name, columns: t.columns.map(c => c.name) }))
        )}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini API');
      }

      const parsedSchema = JSON.parse(responseText);
      res.json({ success: true, schema: parsedSchema });
    } catch (err) {
      console.error('API /api/generate-schema Error:', err);
      res.status(500).json({ error: err.message || 'An error occurred while generating the database schema.' });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
