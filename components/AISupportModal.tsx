"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Send, Image as ImageIcon } from "lucide-react"

interface Message {
  id: number
  type: 'user' | 'bot'
  content: string
  vnContent?: string
  jpContent?: string
}

interface AIResponse {
  question: string
  answer: {
    AnswerVN: string
    AnswerJP: {
      Kanji: string
      Furigana: string
    }
  }
  success: boolean
}

interface AISupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AISupportModal({ isOpen, onClose }: AISupportModalProps) {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'こんにちは！'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue
        })
      })

      const data: AIResponse = await response.json()

      if (data.success && data.answer) {
        const botMessage: Message = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          vnContent: data.answer.AnswerVN,
          jpContent: data.answer.AnswerJP?.Kanji
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to get AI response:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const content = (
    <div className={`fixed bottom-24 right-8 z-50 p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl shadow-2xl w-80 h-[520px] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Modal header */}
          <div className="flex justify-between items-center p-4 border-b border-blue-300/50">
            <h3 className="text-lg font-semibold text-blue-900">紹介サポート</h3>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-blue-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-blue-700" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {message.vnContent || message.jpContent ? (
                    <div className="space-y-3">
                      {message.vnContent && (
                        <div className="border-b border-gray-200 pb-3">
                          <div className="text-xs font-semibold text-blue-600 mb-1">🇻🇳 Tiếng Việt</div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.vnContent}</p>
                        </div>
                      )}
                      {message.jpContent && (
                        <div>
                          <div className="text-xs font-semibold text-blue-600 mb-1">🇯🇵 日本語</div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.jpContent}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-blue-300/50">
            <div className="flex items-center gap-2 bg-white rounded-full p-2 shadow-sm">
              <button 
                className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                aria-label="Attach image"
              >
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                className="flex-1 px-2 py-1 bg-transparent outline-none text-sm"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-full transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}

