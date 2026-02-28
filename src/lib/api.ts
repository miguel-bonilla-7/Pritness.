/** Modelo Gemini. Si da 404, en .env pon VITE_GEMINI_MODEL=gemini-2.0-flash */
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_BASE = 'https://api.groq.com/openai/v1'
const GROQ_TEXT_MODEL = import.meta.env.VITE_GROQ_TEXT_MODEL || 'llama-3.1-8b-instant'
const GROQ_VISION_MODEL = import.meta.env.VITE_GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'

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
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
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
    throw new Error(`Groq API error: ${res.status} ${err}`)
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

const MEAL_TEXT_PROMPT = `El usuario describe en español lo que comió. Responde ÚNICAMENTE un JSON válido (sin markdown, sin código) con estas claves:
- calories (número): calorías totales estimadas
- protein (número): gramos de proteína
- carbs (número): gramos de carbohidratos
- fat (número): gramos de grasa
- description (string): breve descripción de la comida en español
- items (array de { name: string, calories: number, protein: number }): cada plato o alimento con su aporte
Si el texto no describe comida concreta (ej. "qué comí"), estima un ejemplo razonable o devuelve valores 0. Responde solo el JSON.`

/** Analiza una descripción en texto de lo que comió el usuario y devuelve calorías y macros (IA). */
export async function analyzeMealFromText(descripcion: string): Promise<MealAnalysisResult> {
  const apiKeyGroq = GROQ_API_KEY
  const apiKeyGemini = import.meta.env.VITE_GEMINI_API_KEY
  const apiKeyOpenAI = import.meta.env.VITE_OPENAI_API_KEY

  if (apiKeyGroq) {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeyGroq}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: MEAL_TEXT_PROMPT },
          { role: 'user', content: `Usuario: "${descripcion.trim()}"` },
        ],
      }),
    })
    if (!res.ok) throw new Error(`Groq: ${res.status}`)
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
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
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
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
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
    if (!res.ok) throw new Error(`Groq: ${res.status}`)
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
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
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
    if (!res.ok) throw new Error(`Groq error: ${res.status}`)
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
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
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
    if (!res.ok) throw new Error(`Groq error: ${res.status}`)
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
