// src/app/api/ingest/route.ts
import { NextResponse } from 'next/server';
import { routePayload } from '@/lib/ingest-router';
import { createServerClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { rawInput } = await req.json();

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return NextResponse.json({ error: 'rawInput string is required' }, { status: 400 });
    }

    const trimmedInput = rawInput.trim();

    // 1. Route payload to determine source_type ('instagram', 'whatsapp', 'gdrive', 'web', 'text')
    const sourceType = routePayload(trimmedInput);

    const apiKey = process.env.GEMINI_API_KEY;

    let normalizedData = {
      title: trimmedInput.slice(0, 40),
      summary: `Saved note from ${sourceType}: ${trimmedInput}`,
      cluster_name: sourceType === 'instagram' ? 'Italian Cooking' : sourceType === 'whatsapp' || sourceType === 'gdrive' ? 'Backend & Systems' : 'Graphify & AI',
      entities: [sourceType, 'OmniBrain', 'Ingested Note'],
    };

    let embedding: number[] = [];

    // 2. Call Gemini 1.5 Flash for structured extraction if API key exists
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = `Analyze the following raw input payload from source '${sourceType}' and return a JSON object strictly matching this schema:
{
  "title": "Clean concise 5-word title",
  "summary": "2-sentence executive summary gist",
  "cluster_name": "Assigned topic cluster name (e.g. Backend & Systems, Italian Cooking, Graphify & AI, or custom)",
  "entities": ["array of 3 to 5 key entity tag strings"]
}

RAW INPUT:
${trimmedInput}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);
        if (parsed.title && parsed.summary && parsed.cluster_name) {
          normalizedData = {
            title: parsed.title,
            summary: parsed.summary,
            cluster_name: parsed.cluster_name,
            entities: Array.isArray(parsed.entities) ? parsed.entities : normalizedData.entities,
          };
        }

        // 3. Generate 768-dimensional embedding on the summary
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const embeddingResult = await embeddingModel.embedContent(normalizedData.summary);
        if (embeddingResult?.embedding?.values) {
          embedding = embeddingResult.embedding.values;
        }
      } catch (aiErr) {
        console.warn('Gemini extraction fallback:', aiErr);
      }
    }

    // 4. Insert into Supabase database if configured
    let savedItem = {
      id: `item_${Date.now()}`,
      title: normalizedData.title,
      summary: normalizedData.summary,
      cluster_name: normalizedData.cluster_name,
      source_type: sourceType,
      source_url: /^https?:\/\//i.test(trimmedInput) ? trimmedInput : null,
      raw_content: trimmedInput,
      entities: normalizedData.entities,
    };

    try {
      const supabase = createServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert({
          user_id: user?.id || null,
          source_type: sourceType,
          source_url: /^https?:\/\//i.test(trimmedInput) ? trimmedInput : null,
          raw_content: trimmedInput,
          title: normalizedData.title,
          summary: normalizedData.summary,
          cluster_name: normalizedData.cluster_name,
          embedding: embedding.length > 0 ? embedding : null,
        })
        .select()
        .single();

      if (!itemError && itemData) {
        savedItem = { ...savedItem, ...itemData, entities: normalizedData.entities };

        // Link entities
        for (const entityName of normalizedData.entities) {
          const { data: entityData } = await supabase
            .from('entities')
            .upsert({ name: entityName }, { onConflict: 'name' })
            .select('id')
            .single();

          if (entityData) {
            await supabase
              .from('item_entities')
              .insert({ item_id: itemData.id, entity_id: entityData.id });
          }
        }
      }
    } catch (dbErr) {
      console.warn('Supabase insertion fallback:', dbErr);
    }

    // 5. Return success JSON
    return NextResponse.json(
      {
        success: true,
        item: savedItem,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Ingestion failed' }, { status: 500 });
  }
}
