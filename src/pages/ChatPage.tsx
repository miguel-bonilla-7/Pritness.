import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, PlusCircle } from 'lucide-react'
import { sendChatMessage, analyzeMealFromText, type MealAnalysisResult } from '../lib/api'
import { useDailyLog } from '../context/DailyLogContext'
import { useUser } from '../context/UserContext'
import { insertMeal } from '../lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** When present, show meal estimate and "Register this meal" button */
  mealData?: MealAnalysisResult | null
  /** True after user clicked Register this meal */
  mealRegistered?: boolean
}

function getMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

const CHAT_STORAGE_KEY = 'pritness_chat_history'

function loadChatHistory(): Message[] {
  try {
    const s = localStorage.getItem(CHAT_STORAGE_KEY)
    if (s) return JSON.parse(s) as Message[]
  } catch {}
  return [
    {
      id: '0',
      role: 'assistant',
      content: 'Hola. Soy tu asistente de nutrición y entrenamiento. Puedes preguntarme sobre dieta, recetas rápidas o motivación.',
    },
  ]
}

function saveChatHistory(msgs: Message[]) {
  try {
    // Keep last 60 messages to avoid localStorage overflow
    const toSave = msgs.slice(-60)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave))
  } catch {}
}

export function ChatPage() {
  const { addMeal } = useDailyLog()
  const { profile } = useUser()
  const [messages, setMessages] = useState<Message[]>(loadChatHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Persist chat history whenever messages change
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const [reply, mealResult] = await Promise.all([
        sendChatMessage(text, history),
        analyzeMealFromText(text),
      ])
      const hasMeal = mealResult && (mealResult.calories > 0 || (mealResult.description && mealResult.description !== 'Configura VITE_GROQ_API_KEY'))
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: reply,
          mealData: hasMeal ? mealResult : null,
          mealRegistered: false,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Error al conectar con el asistente.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterMeal = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId)
    if (!msg?.mealData || msg.mealRegistered) return
    const r = msg.mealData
    const cal = Math.round(r.calories || 0)
    const prot = Math.round(r.protein || 0)
    addMeal(cal, prot)
    if (profile?.id) {
      const mealType = getMealType()
      await insertMeal(profile.id, {
        meal_type: mealType,
        name: r.description || 'Comida',
        calories: cal,
        protein: prot,
        carbs: r.carbs,
        fat: r.fat,
        source: 'ai_vision',
      })
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, mealRegistered: true } : m))
    )
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-5 space-y-5">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] ${
              m.role === 'user'
                ? 'bg-white/[0.08] text-white rounded-2xl rounded-br-sm px-3.5 py-2.5'
                : 'text-gray-300'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && m.mealData && (
                <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2.5">
                  <div className="flex gap-5">
                    <div>
                      <p className="text-xl font-light text-white tabular-nums">{Math.round(m.mealData.calories || 0)}</p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest">kcal</p>
                    </div>
                    <div>
                      <p className="text-xl font-light text-white tabular-nums">{Math.round(m.mealData.protein || 0)}</p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest">proteína g</p>
                    </div>
                  </div>
                  {m.mealRegistered ? (
                    <p className="text-[11px] text-gray-500">✓ Registrada</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegisterMeal(m.id)}
                      className="rounded-xl py-1.5 px-3 border border-white/[0.08] bg-white/[0.04] text-xs text-white/70 flex items-center gap-1.5 active:bg-white/[0.08] transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Registrar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 px-4 py-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mensaje..."
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl px-3.5 py-2.5 border border-white/[0.08] bg-white/[0.04] text-white/50 disabled:opacity-30 active:bg-white/[0.08] transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
