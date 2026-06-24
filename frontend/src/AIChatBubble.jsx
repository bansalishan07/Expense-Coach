import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, X, MessageSquare } from 'lucide-react'
import axios from 'axios'
import './AIChatBubble.css'

const API_BASE = 'http://localhost:8000'

const PRESET_QUESTIONS = [
  { text: "📊 Category Breakdown", query: "Where did I spend the most?" },
  { text: "💳 Budget Status", query: "What is my remaining budget status?" },
  { text: "📝 Recent Expenses", query: "Show my recent expenses" },
  { text: "💻 Run SELECT SQL", query: "SELECT * FROM expenses ORDER BY amount DESC LIMIT 3" }
]

export default function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'coach',
      text: "👋 **Hello! I am your SQL-Powered Expense Advisor.**\n\nI answer your questions by executing live SQL queries on your SQLite database, and you can even run raw SELECT statements directly! How can I help you save today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const toggleChat = () => setIsOpen(prev => !prev)

  const handleSend = async (textToSend) => {
    const query = textToSend.trim()
    if (!query) return

    // Add user message to state
    const userMsg = {
      id: Date.now() + '-user',
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/chat/`, { message: query })
      
      const coachMsg = {
        id: Date.now() + '-coach',
        sender: 'coach',
        text: response.data.response,
        sql: response.data.sql,
        data: response.data.data,
        error: response.data.error,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, coachMsg])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMsg = {
        id: Date.now() + '-error',
        sender: 'coach',
        text: "⚠️ **Oops!** I ran into a connection issue. Please make sure the backend server is running and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Render text and filter out raw markdown table lines (starts with |)
  const renderMessageText = (text) => {
    const lines = text.split('\n')
    const filteredLines = lines.filter(line => !line.trim().startsWith('|'))
    
    return filteredLines.map((line, lineIndex) => {
      // Bold rendering: **text**
      let parts = []
      let tempLine = line
      
      const boldRegex = /\*\*(.*?)\*\*/g
      let match
      let lastIndex = 0
      
      while ((match = boldRegex.exec(tempLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(tempLine.substring(lastIndex, match.index))
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      
      if (lastIndex < tempLine.length) {
        parts.push(tempLine.substring(lastIndex))
      }

      // Check if it is a list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <ul key={lineIndex} style={{ margin: '0.15rem 0', paddingLeft: '1rem' }}>
            <li>{parts.length > 0 ? parts : line.substring(2)}</li>
          </ul>
        )
      }

      return <div key={lineIndex} style={{ minHeight: '1.2em' }}>{parts.length > 0 ? parts : ' '}</div>
    })
  }

  return (
    <div className="ai-chat-container">
      {/* Floating Action Trigger */}
      {!isOpen && (
        <button className="ai-chat-bubble-trigger" onClick={toggleChat} title="Ask Expense Advisor">
          <MessageSquare size={24} />
        </button>
      )}

      {/* Slide-out Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-title">
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              <h3>Expense Advisor</h3>
              <span className="ai-chat-header-status" />
            </div>
            <button className="ai-chat-close-btn" onClick={toggleChat}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message ${msg.sender}`}>
                <div className="ai-message-bubble">
                  {renderMessageText(msg.text)}

                  {/* SQL Execution Log */}
                  {msg.sql && (
                    <div className="ai-message-sql-container">
                      <div className="ai-message-sql-header">
                        <span>🔍 Executed SQL Query</span>
                      </div>
                      <pre className="ai-message-sql-code">
                        <code>{msg.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* Beautiful Data Table for SQL outputs */}
                  {msg.data && msg.data.length > 0 && (
                    <div className="ai-message-table-container">
                      <table className="ai-message-table">
                        <thead>
                          <tr>
                            {Object.keys(msg.data[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val, cellIdx) => (
                                <td key={cellIdx}>{val === null ? 'NULL' : String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <span className="ai-message-time">{msg.time}</span>
              </div>
            ))}
            
            {isLoading && (
              <div className="ai-message coach">
                <div className="ai-typing-indicator">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Presets / Suggestions */}
          <div className="ai-chat-presets">
            <span className="ai-chat-presets-title">Quick Actions</span>
            <div className="ai-chat-presets-list">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button 
                  key={idx} 
                  className="ai-preset-chip" 
                  onClick={() => handleSend(q.query)}
                  disabled={isLoading}
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input field */}
          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrapper">
              <input 
                type="text" 
                className="ai-chat-input"
                placeholder="Ask or write: SELECT * FROM expenses..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend(input)
                }}
                disabled={isLoading}
              />
            </div>
            <button 
              className="ai-chat-send-btn" 
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
