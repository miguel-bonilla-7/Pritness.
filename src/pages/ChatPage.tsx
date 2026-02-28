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

export function ChatPage() {
  const { addMeal } = useDailyLog()
  const { profile } = useUser()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hola. Soy tu asistente de nutrición y entrenamiento. Puedes preguntarme sobre dieta, recetas rápidas o motivación.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === 'user'
                  ? 'bg-white/15 text-white rounded-br-md'
                  : 'bg-card border border-white/10 text-gray-200 rounded-bl-md shadow-card-glow'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && m.mealData && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <p className="text-xs text-gray-400">{m.mealData.description}</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xl font-bold text-white">{Math.round(m.mealData.calories || 0)}</p>
                      <p className="text-xs text-gray-400">kcal</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{Math.round(m.mealData.protein || 0)}</p>
                      <p className="text-xs text-gray-400">proteína (g)</p>
                    </div>
                  </div>
                  {m.mealRegistered ? (
                    <p className="text-xs text-green-400 font-medium">✓ Registrada en tu día</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegisterMeal(m.id)}
                      className="w-full rounded-xl py-2 bg-white/15 text-white font-medium hover:bg-white/20 flex items-center justify-center gap-2 text-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Registrar esta comida
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="shrink-0 p-4 border-t border-white/10 safe-bottom bg-app">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe lo que comiste o pregunta sobre dieta..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
