/** Modelo Gemini. Si da 404, en .env pon VITE_GEMINI_MODEL=gemini-2.0-flash */
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_BASE = 'https://api.groq.com/openai/v1'
const GROQ_TEXT_MODEL = import.meta.env.VITE_GROQ_TEXT_MODEL || 'llama-3.1-8b-instant'
const GROQ_VISION_MODEL = import.meta.env.VITE_GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'

/** Groq 429 = rate limit. Reintenta con espera. */
async function groqFetch(url: string, options: RequestInit, retries = 2): Promise<Response> {
  let res = await fetch(url, options)
  for (let i = 0; i < retries && res.status === 429; i++) {
    const waitMs = (i + 1) * 4000
    await new Promise((r) => setTimeout(r, waitMs))
    res = await fetch(url, options)
  }
  return res
}

function groqError(status: number, body: string): Error {
  if (status === 429) {
    return new Error('Límite de solicitudes alcanzado. Espera unos segundos e intenta de nuevo.')
  }
  return new Error(`Groq error ${status}: ${body}`)
}

export interface MealAnalysisResult {
  calories: number
  protein: number
  carbs?: number
  fat?: number
  description?: string
  items?: { name: string; calories: number; protein: number }[]
}

export interface WODAnalysisResult {
  description: string
  exercises: string[]
  estimatedCaloriesBurned: number
}

export interface GoalRecommendation {
  dailyCaloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
}

async function getGeminiMealAnalysis(imageDataUrl: string): Promise<MealAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')

  const base64 = imageDataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid image data')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              text: 'Analyze this food image. Reply with ONLY a JSON object (no markdown, no code block) with keys: calories (number), protein (number), carbs (number), fat (number), description (string), items (array of { name, calories, protein }). Estimate nutritional values for the meal shown.',
            },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${err}`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
  return JSON.parse(cleaned) as MealAnalysisResult
}

async function getOpenAIMealAnalysis(imageDataUrl: string): Promise<MealAnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set')

  const base64 = imageDataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid image data')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
            {
              type: 'text',
              text: 'Analyze this food image. Reply with ONLY a JSON object with keys: calories (number), protein (number), carbs (number), fat (number), description (string), items (array of { name, calories, protein }). Estimate nutritional values.',
            },
          ],
        },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${err}`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() || '{}'
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
  return JSON.parse(cleaned) as MealAnalysisResult
}

async function getGroqMealAnalysis(imageDataUrl: string): Promise<MealAnalysisResult> {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY is not set')
  const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageDataUrl } },
            {
              type: 'text',
              text: 'Analyze this food image. Reply with ONLY a JSON object with keys: calories (number), protein (number), carbs (number), fat (number), description (string), items (array of { name, calories, protein }). Estimate nutritional values.',
            },
          ],
        },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw groqError(res.status, err)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() || '{}'
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
  return JSON.parse(cleaned) as MealAnalysisResult
}

export async function analyzeMealImage(imageDataUrl: string): Promise<MealAnalysisResult> {
  if (GROQ_API_KEY) {
    return getGroqMealAnalysis(imageDataUrl)
  }
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return getGeminiMealAnalysis(imageDataUrl)
  }
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    return getOpenAIMealAnalysis(imageDataUrl)
  }
  // Demo fallback
  return {
    calories: 420,
    protein: 28,
    carbs: 45,
    fat: 14,
    description: 'Comida (demo: configura VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY o VITE_OPENAI_API_KEY)',
    items: [{ name: 'Plato de ejemplo', calories: 420, protein: 28 }],
  }
}

export type SmartImageResult =
  | { type: 'food'; meal: MealAnalysisResult }
  | { type: 'workout'; wod: WODAnalysisResult }

const SMART_IMAGE_PROMPT = `Look at this image. Decide: does it show FOOD/MEAL (plate, dish, food on table) or EXERCISE/WORKOUT (gym, whiteboard with exercises, person training, equipment, written WOD)?
Reply with ONLY a valid JSON object, no markdown.
If FOOD: {"type":"food","meal":{"calories":number,"protein":number,"carbs":number,"fat":number,"description":"string","items":[{"name":"string","calories":number,"protein":number}]}}
If WORKOUT: {"type":"workout","wod":{"description":"string","exercises":["string"],"estimatedCaloriesBurned":number}}
Use the exact keys above. Estimate reasonable values.`

function parseSmartImageResponse(text: string): SmartImageResult {
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim()
  const o = JSON.parse(cleaned) as { type: string; meal?: MealAnalysisResult; wod?: WODAnalysisResult }
  if (o.type === 'workout' && o.wod) {
    return { type: 'workout', wod: o.wod }
  }
  if (o.meal) {
    return { type: 'food', meal: o.meal }
  }
  throw new Error('Respuesta no reconocida')
}

/** Detecta si la foto es comida o ejercicio y devuelve el análisis correspondiente */
export async function analyzeImageSmart(imageDataUrl: string): Promise<SmartImageResult> {
  if (GROQ_API_KEY) {
    const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageDataUrl } },
              { type: 'text', text: SMART_IMAGE_PROMPT },
            ],
          },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw groqError(res.status, err)
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    return parseSmartImageResponse(text)
  }
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    const base64 = imageDataUrl.split(',')[1]
    if (!base64) throw new Error('Invalid image data')
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
              { text: SMART_IMAGE_PROMPT },
            ],
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini: ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'
    return parseSmartImageResponse(text)
  }
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageDataUrl } },
              { type: 'text', text: SMART_IMAGE_PROMPT },
            ],
          },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI: ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    return parseSmartImageResponse(text)
  }
  throw new Error('Configura VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY o VITE_OPENAI_API_KEY para análisis por foto')
}

const MEAL_TEXT_PROMPT = `Eres un nutricionista experto con acceso a tablas nutricionales reales (USDA, FoodData Central, tablas de composición de alimentos de España y Latinoamérica).

El usuario describe en español lo que comió. Tu tarea es estimar los valores nutricionales con la máxima precisión posible.

REGLAS CRÍTICAS — SÍGUE ESTAS AL PIE DE LA LETRA:
1. Usa SIEMPRE valores de tablas nutricionales reales. Ejemplos de referencia:
   - Pechuga de pollo cocida 100g: 165 kcal, 31g proteína, 0g carbs, 3.6g grasa
   - Huevo entero grande (50g): 72 kcal, 6g proteína, 0.4g carbs, 5g grasa
   - Arroz blanco cocido 100g: 130 kcal, 2.7g proteína, 28g carbs, 0.3g grasa
   - Pan blanco 30g (1 tajada): 80 kcal, 2.7g proteína, 15g carbs, 1g grasa
   - Atún en lata 85g: 109 kcal, 25g proteína, 0g carbs, 1g grasa
   - Leche entera 240ml: 149 kcal, 8g proteína, 12g carbs, 8g grasa
   - Banana mediana 120g: 107 kcal, 1.3g proteína, 27g carbs, 0.4g grasa
2. ASUME porciones típicas de comida latinoamericana/española si el usuario no especifica cantidad.
3. Si el usuario dice "un plato de arroz con pollo", asume: 200g arroz cocido + 150g pechuga cocida.
4. NUNCA inventes valores. Si no conoces el alimento exacto, busca el más similar en tablas reales.
5. Suma los macros item por item. El total debe ser la suma exacta de los ítems.
6. La temperatura del LLM para esta tarea debe ser mínima — no hay creatividad aquí, solo datos.
7. Si la descripción es vaga (ej: "comí bien"), pide al usuario que sea más específico devolviendo calories: 0 y description explicando qué necesitas.

Responde ÚNICAMENTE un JSON válido (sin markdown, sin código) con estas claves:
- calories (número entero): total de calorías
- protein (número entero): gramos de proteína total
- carbs (número entero): gramos de carbohidratos total  
- fat (número entero): gramos de grasa total
- description (string): descripción breve en español de lo que se analizó con las porciones asumidas
- items (array de { name: string, calories: number, protein: number, carbs: number, fat: number, portion: string }): cada alimento con porción asumida y sus macros`

/** Analiza una descripción en texto de lo que comió el usuario y devuelve calorías y macros (IA). */
export async function analyzeMealFromText(descripcion: string): Promise<MealAnalysisResult> {
  const apiKeyGroq = GROQ_API_KEY
  const apiKeyGemini = import.meta.env.VITE_GEMINI_API_KEY
  const apiKeyOpenAI = import.meta.env.VITE_OPENAI_API_KEY

  if (apiKeyGroq) {
    const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeyGroq}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [
          { role: 'system', content: MEAL_TEXT_PROMPT },
          { role: 'user', content: `Usuario: "${descripcion.trim()}"` },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw groqError(res.status, err)
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
    return JSON.parse(cleaned) as MealAnalysisResult
  }

  if (apiKeyGemini) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKeyGemini}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${MEAL_TEXT_PROMPT}\n\nUsuario: "${descripcion.trim()}"` }],
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini: ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
    return JSON.parse(cleaned) as MealAnalysisResult
  }

  if (apiKeyOpenAI) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeyOpenAI}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: MEAL_TEXT_PROMPT },
          { role: 'user', content: `Usuario: "${descripcion.trim()}"` },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI: ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
    return JSON.parse(cleaned) as MealAnalysisResult
  }

  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    description: 'Configura VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY o VITE_OPENAI_API_KEY para analizar con IA.',
    items: [],
  }
}

const GOAL_RECOMMENDATION_PROMPT = `You MUST compute goals using these exact formulas. Same input must always give the same output. Reply with ONLY a JSON object, no markdown, no explanation.

Step 1 - BMR (Mifflin-St Jeor):
- If sex is male: BMR = 10*weight_kg + 6.25*height_cm - 5*age + 5
- If sex is female: BMR = 10*weight_kg + 6.25*height_cm - 5*age - 161

Step 2 - Daily calories by goal:
- perder_peso: dailyCaloriesTarget = round(BMR * 0.85)
- ganar_masa: dailyCaloriesTarget = round(BMR * 1.1)
- definir_masa: dailyCaloriesTarget = round(BMR * 1.0)

Step 3 - Macros (percent of daily calories, then convert to grams):
- perder_peso: protein 30%, carbs 45%, fat 25%
- ganar_masa: protein 25%, carbs 50%, fat 25%
- definir_masa: protein 25%, carbs 50%, fat 25%
Grams: protein_g = round( (dailyCaloriesTarget * protein_pct) / 4 ), carbs_g = round( (dailyCaloriesTarget * carbs_pct) / 4 ), fat_g = round( (dailyCaloriesTarget * fat_pct) / 9 )

Output JSON with exactly: dailyCaloriesTarget (number), proteinTarget (number), carbsTarget (number), fatTarget (number). No other keys.`

/** AI recommendation for daily calorie and protein goals based on height, weight, age, sex, goal */
export async function getAIGoalRecommendation(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female',
  goal: string
): Promise<GoalRecommendation> {
  const userDesc = `Weight: ${weightKg} kg, height: ${heightCm} cm, age: ${age}, sex: ${sex}, goal: ${goal}.`
  const parseResponse = (text: string): GoalRecommendation => {
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim()
    const o = JSON.parse(cleaned) as Record<string, number>
    return {
      dailyCaloriesTarget: Math.round(Number(o.dailyCaloriesTarget) || 2000),
      proteinTarget: Math.round(Number(o.proteinTarget) || 120),
      carbsTarget: Math.round(Number(o.carbsTarget) || 200),
      fatTarget: Math.round(Number(o.fatTarget) || 65),
    }
  }

  if (GROQ_API_KEY) {
    const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        max_tokens: 512,
        temperature: 0,
        messages: [
          { role: 'system', content: GOAL_RECOMMENDATION_PROMPT },
          { role: 'user', content: userDesc },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw groqError(res.status, err)
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    return parseResponse(text)
  }

  if (import.meta.env.VITE_GEMINI_API_KEY) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${GOAL_RECOMMENDATION_PROMPT}\n\n${userDesc}` }],
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 512 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini: ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'
    return parseResponse(text)
  }

  if (import.meta.env.VITE_OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 512,
        temperature: 0,
        messages: [
          { role: 'system', content: GOAL_RECOMMENDATION_PROMPT },
          { role: 'user', content: userDesc },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI: ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    return parseResponse(text)
  }

  throw new Error('Configure VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY for AI goal recommendation.')
}

export async function analyzeWOD(input: string, userWeightKg?: number): Promise<WODAnalysisResult> {
  const weight = userWeightKg ?? 70
  const prompt = `The user describes a workout (WOD): "${input}". User weight: ${weight} kg. Reply with ONLY a JSON object: { "description": "short summary", "exercises": ["exercise1", "exercise2"], "estimatedCaloriesBurned": number }. Estimate calories burned for this workout.`

  if (GROQ_API_KEY) {
    const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw groqError(res.status, err)
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || '{}'
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
    return JSON.parse(cleaned) as WODAnalysisResult
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY
  if (apiKey && import.meta.env.VITE_GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `The user describes a workout (WOD): "${input}". User weight: ${weight} kg. Reply with ONLY a JSON object: { "description": "short summary", "exercises": ["exercise1", "exercise2"], "estimatedCaloriesBurned": number }. Estimate calories burned for this workout.`,
            }],
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}'
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '')
    return JSON.parse(cleaned) as WODAnalysisResult
  }

  return {
    description: 'Workout (set VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY for real analysis)',
    exercises: ['Exercise 1', 'Exercise 2'],
    estimatedCaloriesBurned: 180,
  }
}

const CHAT_SYSTEM_PROMPT = `You are an expert nutrition and fitness assistant for the Pritness app. Help the user with:
- Diet and macro questions
- Quick recipes that fit their daily macros
- Training advice and motivation
- Keep answers concise and practical. Reply in the same language the user writes in.`

export async function sendChatMessage(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  if (GROQ_API_KEY) {
    const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: CHAT_SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw groqError(res.status, err)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || 'No response.'
  }
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY

  if (import.meta.env.VITE_GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: [
                CHAT_SYSTEM_PROMPT,
                ...history.flatMap((m) => [`${m.role}: ${m.content}`]),
                `user: ${userMessage}`,
              ].join('\n\n'),
            }],
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    )
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response.'
  }

  if (import.meta.env.VITE_OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: CHAT_SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || 'No response.'
  }

  return 'Configura VITE_GROQ_API_KEY, VITE_GEMINI_API_KEY o VITE_OPENAI_API_KEY en .env para usar el asistente.'
}

export interface AIMealSuggestion {
  label: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  imageCategory: string
  ingredients: string[]
  recipe: string[]
}

const IMAGE_CATEGORIES = [
  'eggs', 'chicken', 'fish', 'salad', 'smoothie',
  'yogurt', 'quinoa', 'oats', 'soup', 'pasta', 'beef', 'turkey', 'generic',
]

function buildSuggestionsPrompt(
  remainingCal: number,
  remainingProtein: number,
  hour: number,
  goal: string,
  chatSummary: string,
  country: string,
  dislikedFoods: string[]
): string {
  const mealTime =
    hour < 11 ? 'desayuno' :
    hour < 15 ? 'almuerzo' :
    hour < 20 ? 'merienda o cena temprana' : 'cena'

  const countryLine = country
    ? `- País del usuario: ${country}. Sugiere alimentos típicos, accesibles y comunes en ese país.`
    : '- Sugiere alimentos accesibles y comunes que se consigan fácilmente en cualquier supermercado.'

  const dislikedLine = dislikedFoods.length > 0
    ? `- Alimentos que el usuario NO quiere que le recomienden: ${dislikedFoods.join(', ')}. NUNCA los incluyas.`
    : ''

  return `Eres un asistente de nutrición experto. Genera EXACTAMENTE 3 sugerencias de comida personalizadas.

CONTEXTO:
- Hora actual: ${hour}:00 (momento del día: ${mealTime})
- Calorías restantes hoy: ${remainingCal} kcal
- Proteína restante hoy: ${remainingProtein}g
- Objetivo del usuario: ${goal}
${countryLine}
${dislikedLine}
- Historial de conversación reciente con el usuario: """${chatSummary}"""

REGLAS IMPORTANTES:
1. Sugiere SOLO comidas que la gente come normalmente en su día a día. Nada exótico ni difícil de conseguir.
2. Respeta ABSOLUTAMENTE cualquier alimento que el usuario haya mencionado que no le gusta, no come, o es alérgico en el historial de chat.
3. ${dislikedFoods.length > 0 ? `NUNCA sugieras: ${dislikedFoods.join(', ')}.` : 'Evita ingredientes poco comunes.'}
4. Sugiere comidas apropiadas para ${mealTime}.
5. Las calorías de cada sugerencia deben ser menores o iguales a ${remainingCal}.
6. imageCategory debe ser UNA de estas opciones exactas: ${IMAGE_CATEGORIES.join(', ')}.
7. ingredients debe ser un array de strings con cantidades específicas.
8. recipe debe ser un array de pasos cortos y claros.

Responde ÚNICAMENTE con un JSON array válido (sin markdown, sin texto extra) con exactamente 3 objetos con estas claves:
label (string), description (string), calories (number), protein (number), carbs (number), fat (number), imageCategory (string), ingredients (string[]), recipe (string[])`
}

function parseSuggestionsResponse(text: string): AIMealSuggestion[] {
  const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim()
  const arr = JSON.parse(cleaned) as AIMealSuggestion[]
  if (!Array.isArray(arr)) throw new Error('Expected array')
  return arr.slice(0, 3)
}

export async function getAIMealSuggestions(
  remainingCal: number,
  remainingProtein: number,
  hour: number,
  goal: string,
  chatHistory: { role: string; content: string }[],
  country = '',
  dislikedFoods: string[] = []
): Promise<AIMealSuggestion[]> {
  const chatSummary = chatHistory
    .slice(-20)
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
    .join('\n')
    .slice(0, 2000)

  const prompt = buildSuggestionsPrompt(remainingCal, remainingProtein, hour, goal, chatSummary, country, dislikedFoods)

  try {
    if (GROQ_API_KEY) {
      const res = await groqFetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: GROQ_TEXT_MODEL,
          max_tokens: 2048,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        throw groqError(res.status, err)
      }
      const data = await res.json()
      return parseSuggestionsResponse(data.choices?.[0]?.message?.content?.trim() || '[]')
    }

    if (import.meta.env.VITE_GEMINI_API_KEY) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
        }
      )
      if (!res.ok) throw new Error(`Gemini: ${res.status}`)
      const data = await res.json()
      return parseSuggestionsResponse(data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]')
    }

    if (import.meta.env.VITE_OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 2048,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`OpenAI: ${res.status}`)
      const data = await res.json()
      return parseSuggestionsResponse(data.choices?.[0]?.message?.content?.trim() || '[]')
    }
  } catch {
    // If AI fails, return empty to trigger fallback
  }

  return []
}
