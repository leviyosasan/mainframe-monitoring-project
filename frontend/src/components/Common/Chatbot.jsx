import { useState, useRef, useEffect } from 'react'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState([
    { text: 'Merhaba! Size nasıl yardımcı olabilirim?', sender: 'bot' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase().trim()
    
    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hey')) {
      return 'Merhaba! Size nasıl yardımcı olabilirim?'
    } else if (lowerMessage.includes('nasılsın') || lowerMessage.includes('iyi misin')) {
      return 'Ben iyiyim, teşekkür ederim! Siz nasılsınız?'
    } else if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağ ol')) {
      return 'Rica ederim! Başka bir konuda yardımcı olabilir miyim?'
    } else if (lowerMessage.includes('görüşürüz') || lowerMessage.includes('hoşça kal')) {
      return 'Hoşça kalın! İyi günler dilerim.'
    } else {
      return 'Anlıyorum. Daha fazla bilgi için lütfen detaylı bir soru sorun.'
    }
  }

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return

    // Kullanıcı mesajını ekle
    const userMessage = { text: inputMessage, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Bot cevabını ekle (küçük bir gecikme ile)
    setTimeout(() => {
      const botMessage = { text: getBotResponse(inputMessage), sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
    }, 500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && !isFullscreen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl z-50 group"
          aria-label="Chatbot'u aç"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 transition-transform group-hover:scale-110"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {/* Pulse Animation */}
          <span className="absolute inset-0 rounded-full bg-gray-600 animate-ping opacity-75"></span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && !isFullscreen && (
        <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-700 animate-slide-up backdrop-blur-xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Header */}
          <div className="bg-gray-900 text-white px-5 py-4 rounded-t-2xl flex justify-between items-center shadow-lg border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 3.45 1.232 4.68 0C28.45 15.5 28.8 13.8 29 12c0-4.5-3-7.5-9-7.5s-9 3-9 7.5c0 1.8.55 3.5 1.318 4.702M5 14.5V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0023 19.5v-5a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 14.5z" />
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Asistan</h3>
                <p className="text-xs text-gray-300 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFullscreen(true)}
                className="hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-110"
                aria-label="Tam ekran aç"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-110"
                aria-label="Chatbot'u kapat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-800">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-gray-600' 
                    : 'bg-gray-700'
                }`}>
                  {message.sender === 'user' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 3.45 1.232 4.68 0C28.45 15.5 28.8 13.8 29 12c0-4.5-3-7.5-9-7.5s-9 3-9 7.5c0 1.8.55 3.5 1.318 4.702M5 14.5V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0023 19.5v-5a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 14.5z" />
                    </svg>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-700 text-gray-100 border border-gray-600'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4 bg-gray-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mesajınızı yazın..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm transition-all"
              />
              <button
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === ''}
                className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => {
              setIsFullscreen(false)
              setIsOpen(false)
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-8 animate-scale-in">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col border border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-900 text-white px-8 py-5 rounded-t-3xl flex justify-between items-center shadow-xl border-b border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 3.45 1.232 4.68 0C28.45 15.5 28.8 13.8 29 12c0-4.5-3-7.5-9-7.5s-9 3-9 7.5c0 1.8.55 3.5 1.318 4.702M5 14.5V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0023 19.5v-5a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 14.5z" />
                      </svg>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl">AI Asistan</h3>
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsFullscreen(false)
                      setIsOpen(true)
                    }}
                    className="hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 hover:scale-110"
                    aria-label="Tam ekranı kapat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setIsFullscreen(false)
                      setIsOpen(false)
                    }}
                    className="hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 hover:scale-110"
                    aria-label="Chatbot'u kapat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-gray-800">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                      message.sender === 'user' 
                        ? 'bg-gray-600' 
                        : 'bg-gray-700'
                    }`}>
                      {message.sender === 'user' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 3.45 1.232 4.68 0C28.45 15.5 28.8 13.8 29 12c0-4.5-3-7.5-9-7.5s-9 3-9 7.5c0 1.8.55 3.5 1.318 4.702M5 14.5V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0023 19.5v-5a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 14.5z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[70%] rounded-2xl px-5 py-4 shadow-lg ${
                        message.sender === 'user'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-700 text-gray-100 border border-gray-600'
                      }`}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 p-6 bg-gray-800">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-6 py-4 bg-gray-700 border border-gray-600 text-gray-100 placeholder:text-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={inputMessage.trim() === ''}
                    className="bg-gray-600 hover:bg-gray-700<｜place▁holder▁no▁698｜> text-white p-4 rounded-xl  disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                  >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tailwind Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: λNP-translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default Chatbot
