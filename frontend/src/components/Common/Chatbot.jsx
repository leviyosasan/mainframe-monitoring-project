import { useState, useRef, useEffect } from 'react'
import { databaseAPI } from '../../services/api'

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

  // MQ QM sorgu çözücü
  const parseMqQuery = (lowerMessage) => {
    const candidates = [
      { col: 'qmiputtr', label: 'Interval Total Put Rate', keys: ['qmiputtr', 'put rate', 'interval put rate', 'intervaltotalputrate', 'putrate', 'put oranı'] },
      { col: 'qmigetr', label: 'Interval Get Rate', keys: ['qmigetr', 'get rate', 'interval get rate', 'intervalgetrate', 'getrate', 'get oranı'] },
      { col: 'qmnqmes', label: 'Number of Normal Queue Messages', keys: ['qmnqmes', 'normal queue', 'normal queue messages', 'number of normal queue messages', 'normalkuyruk', 'normal kuyruk'] },
      { col: 'qmxqmes', label: 'Number of Transmission Queue Messages', keys: ['qmxqmes', 'transmission queue', 'transmission queue messages', 'number of transmission queue messages', 'iletim kuyruğu', 'iletimkuyrugu'] },
      { col: 'qmcomlv', label: 'Queue Manager Version', keys: ['qmcomlv', 'version', 'queue manager version', 'queuemanagerversion', 'versiyon'] },
      { col: 'qmplatn', label: 'Platform Name', keys: ['qmplatn', 'platform name', 'platformname', 'platform adı', 'platform adi'] },
      { col: 'qmplat', label: 'Platform Type', keys: ['qmplat', 'platform type', 'platformtype', 'platform tipi', 'platform tip'] },
    ]
    for (const c of candidates) {
      if (c.keys.some(k => lowerMessage.includes(k))) return c
    }
    return null
  }

  // MQ CONNZ sorgusu 
  const parseConnzQuery = (lowerMessage) => {
    const candidates = [
      { col: 'connapltag', label: 'Application Name', keys: ['connapltag', 'application name', 'app name'] },
      { col: 'conninfotyp', label: 'Type Of Information (Hex) (Count)', keys: ['conninfotyp', 'type of information', 'information type', 'info type'] },
      { col: 'connasid', label: 'Address Space Identifier', keys: ['connasid', 'asid', 'address space identifier'] },
      { col: 'connapltyx', label: 'Application Type(Maximum)', keys: ['connapltyx', 'application type(maximum)', 'application type', 'appl type'] },
      { col: 'conntranid', label: 'CICS Transaction Id', keys: ['conntranid', 'cics transaction id', 'transaction id', 'tranid'] },
      { col: 'conntaskno', label: 'CICS Task number', keys: ['conntaskno', 'cics task number', 'task number', 'taskno'] },
      { col: 'connpsbnm', label: 'IMS PSB Name', keys: ['connpsbnm', 'ims psb name', 'psb name'] },
      { col: 'connobject', label: 'Object Name(Maximum)', keys: ['connobject', 'object name', 'object name(maximum)'] },
      { col: 'connqmgr', label: 'Queue Manager', keys: ['connqmgr', 'queue manager', 'qmgr', 'qm'] },
      { col: 'applname', label: 'Application Name Type Of Information', keys: ['applname', 'application name type of information', 'app name type'] },
      { col: 'asid', label: 'Address Space Identifier', keys: ['asid', 'address space identifier'] },
      { col: 'appltypemax', label: 'Application Type(Maximum)', keys: ['appltypemax', 'application type(maximum)', 'application type'] },
      { col: 'cicstranid', label: 'CICS Transaction Id', keys: ['cicstranid', 'cics transaction id'] },
      { col: 'cicstaskno', label: 'CICS Task number', keys: ['cicstaskno', 'cics task number'] },
    ]
    for (const c of candidates) {
      if (c.keys.some(k => lowerMessage.includes(k))) return c
    }
    return null
  }

  // MQ W2OVER sorgu 
  const parseW2overQuery = (lowerMessage) => {
    const candidates = [
      { col: 'wzonrchl', label: 'Channels Retrying', keys: ['wzonrchl', 'channels retrying', 'retrying channels', 'kanallar yeniden deneme', 'kanal retry'] },
      { col: 'wzolqhi', label: 'Local Queues at Max Depth High', keys: ['wzolqhi', 'local queues at max depth high', 'local queues high', 'local queue high'] },
      { col: 'wzoxqhi', label: 'Transmit Queues at Max Depth High', keys: ['wzoxqhi', 'transmit queues at max depth high', 'transmit queues high', 'xmitq high'] },
      { col: 'wzodlmct', label: 'Dead-Letter Message Count', keys: ['wzodlmct', 'dead-letter message count', 'dead letter', 'dead-letter'] },
      { col: 'wzoevtc', label: 'Queue Manager Events', keys: ['wzoevtc', 'queue manager events', 'qmgr events', 'events'] },
      { col: 'wzoqmst', label: 'Queue Manager Status', keys: ['wzoqmst', 'queue manager status', 'qmgr status'] },
      { col: 'wzoqmgr', label: 'Queue Manager Name', keys: ['wzoqmgr', 'queue manager name', 'qmgr name'] },
      { col: 'wzops0fp', label: 'Free Pages in Page Set 0', keys: ['wzops0fp', 'free pages in page set 0', 'free pages'] },
      { col: 'wzoevta', label: 'Event Listener Status', keys: ['wzoevta', 'event listener status'] },
      { col: 'wzocmdsv', label: 'Command Server Status', keys: ['wzocmdsv', 'command server status'] },
      { col: 'wzocpf', label: 'Command Prefix', keys: ['wzocpf', 'command prefix'] },
      { col: 'wzorqexc', label: 'Reply Q Exceptions', keys: ['wzorqexc', 'reply q exceptions', 'reply queue exceptions'] },
    ]
    for (const c of candidates) {
      if (c.keys.some(k => lowerMessage.includes(k))) return c
    }
    return null
  }

  const formatTrDate = (raw) => {
    if (!raw) return 'N/A'
    try {
      const d = new Date(raw)
      return d.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch {
      return String(raw)
    }
  }

  const normalizeKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const isNumeric = (v) => Number.isFinite(Number(v))
  const getAllKeys = (rows) => {
    const set = new Set()
    rows.forEach(r => Object.keys(r || {}).forEach(k => { if (k !== 'index') set.add(k) }))
    return Array.from(set)
  }
  const pickColumnByMessage = (lowerMessage, keys) => {
    const msgNorm = normalizeKey(lowerMessage)
    // exact contains
    for (const k of keys) { if (msgNorm.includes(normalizeKey(k))) return k }
    return null
  }
  const formatValue = (v) => {
    if (v === null || v === undefined) return 'N/A'
    const n = Number(v)
    if (!Number.isFinite(n)) return String(v)
    return Math.abs(n) < 1 ? n.toFixed(4) : n.toLocaleString('tr-TR')
  }
  const buildSummary = (rows, maxPairs = 12) => {
    const first = rows?.[0] || {}
    const keys = Object.keys(first).filter(k => k !== 'index')
    const pairs = []
    for (const k of keys) {
      const r = rows.find(row => row?.[k] !== null && row?.[k] !== undefined) || first
      pairs.push(`${k}: ${formatValue(r?.[k])}`)
      if (pairs.length >= maxPairs) break
    }
    return pairs.join('\n')
  }

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return

    const message = inputMessage
    const lowerMessage = message.toLowerCase().trim()

    // Kullanıcı mesajını ekle
    const userMessage = { text: message, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // CPU datası isteğini kontrol et
    if (lowerMessage.includes('son cpu') || lowerMessage.includes('cpu getir') || lowerMessage.includes('cpu verisi')) {
      setMessages(prev => [...prev, { text: 'CPU verilerini çekiyorum...', sender: 'bot' }])
      
      try {
        const response = await databaseAPI.getLatestCpuData({})
        
        if (response.data.success) {
          const data = response.data.data
          
          // Tarihi formatla
          let formattedDate = 'N/A'
          if (data.bmctime) {
            try {
              const date = new Date(data.bmctime)
              formattedDate = date.toLocaleString('tr-TR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            } catch {
              formattedDate = data.bmctime
            }
          }
          
          const cpuResponse = `⚡ CPU Busy: %${data.cpuBusyPercent || 'N/A'}\n` +
            `🖥️ System: ${data.syxsysn || 'N/A'}\n` +
            `📅 Tarih: ${formattedDate}`
          
          setMessages(prev => [...prev, { text: cpuResponse, sender: 'bot' }])
        } else {
          setMessages(prev => [...prev, { text: 'CPU verisi alınamadı. Lütfen daha sonra tekrar deneyin.', sender: 'bot' }])
        }
      } catch (error) {
        setMessages(prev => [...prev, { text: 'CPU verisi alınırken bir hata oluştu.', sender: 'bot' }])
      }
      return
    }

    // MQ CONNZ data query
    if (lowerMessage.includes('connz')) {
      const listAll = lowerMessage.includes('tüm') || lowerMessage.includes('hepsi') || lowerMessage.includes('kolon') || lowerMessage.includes('columns') || lowerMessage.includes('liste')
      const target = parseConnzQuery(lowerMessage)
      if (!target && !listAll) {
        setMessages(prev => [...prev, { text: 'CONNZ için örnek sorgular: conntranid, conntaskno, connasid, conninfotyp, connapltyx. Tüm kolonlar için: "connz tüm" yazabilirsiniz.', sender: 'bot' }])
      } else {
        setMessages(prev => [...prev, { text: `MQ CONNZ ${target ? target.label : 'tüm kolonlar'} verisini çekiyorum...`, sender: 'bot' }])
        try {
          const response = await databaseAPI.getMainviewMQConnz({})
          if (response.data?.success) {
            const rows = Array.isArray(response.data.data) ? response.data.data : []
            if (listAll) {
              const summary = buildSummary(rows, 20)
              setMessages(prev => [...prev, { text: `📦 MQ CONNZ - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot' }])
            } else {
              const row = rows.find(r => Number.isFinite(Number(r?.[target.col]))) || rows[0]
              const valueRaw = row?.[target.col]
              const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at
              const formattedVal = formatValue(valueRaw)
              const reply = `📦 MQ CONNZ - ${target.label}\n` +
                `• Değer: ${formattedVal}\n` +
                `• Zaman: ${formatTrDate(ts)}`
              setMessages(prev => [...prev, { text: reply, sender: 'bot' }])
            }
          } else {
            setMessages(prev => [...prev, { text: 'MQ CONNZ verisi alınamadı.', sender: 'bot' }])
          }
        } catch (err) {
          setMessages(prev => [...prev, { text: 'MQ CONNZ verisi alınırken bir hata oluştu.', sender: 'bot' }])
        }
      }
      return
    }

    // MQ W2OVER data query
    if (lowerMessage.includes('w2over') || lowerMessage.includes('w2 over')) {
      const listAll = lowerMessage.includes('tüm') || lowerMessage.includes('hepsi') || lowerMessage.includes('kolon') || lowerMessage.includes('columns') || lowerMessage.includes('liste')
      const target = parseW2overQuery(lowerMessage)
      if (!target && !listAll) {
        setMessages(prev => [...prev, { text: 'W2OVER için örnek sorgular: wzonrchl, wzolqhi, wzoxqhi, wzodlmct, wzoevtc. Tüm kolonlar için: "w2over tüm" yazabilirsiniz.', sender: 'bot' }])
      } else {
        setMessages(prev => [...prev, { text: `MQ W2OVER ${target ? target.label : 'tüm kolonlar'} verisini çekiyorum...`, sender: 'bot' }])
        try {
          const response = await databaseAPI.getMainviewMQW2over({})
          if (response.data?.success) {
            const rows = Array.isArray(response.data.data) ? response.data.data : []
            if (listAll) {
              const summary = buildSummary(rows, 20)
              setMessages(prev => [...prev, { text: `📦 MQ W2OVER - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot' }])
            } else {
              const row = rows.find(r => Number.isFinite(Number(r?.[target.col]))) || rows[0]
              const valueRaw = row?.[target.col]
              const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at
              const formattedVal = formatValue(valueRaw)
              const reply = `📦 MQ W2OVER - ${target.label}\n` +
                `• Değer: ${formattedVal}\n` +
                `• Zaman: ${formatTrDate(ts)}`
              setMessages(prev => [...prev, { text: reply, sender: 'bot' }])
            }
          } else {
            setMessages(prev => [...prev, { text: 'MQ W2OVER verisi alınamadı.', sender: 'bot' }])
          }
        } catch (err) {
          setMessages(prev => [...prev, { text: 'MQ W2OVER verisi alınırken bir hata oluştu.', sender: 'bot' }])
        }
      }
      return
    }

    // MQ QM data query
    if (
      lowerMessage.includes('mq') ||
      lowerMessage.includes('message queue') ||
      lowerMessage.includes('queue manager') ||
      lowerMessage.includes('qm')
    ) {
      const mqTarget = parseMqQuery(lowerMessage)

      if (mqTarget) {
        setMessages(prev => [...prev, { text: `MQ QM ${mqTarget.label} verisini çekiyorum...`, sender: 'bot' }])
        try {
          const response = await databaseAPI.getMainviewMQQm({})
          if (response.data?.success) {
            const rows = Array.isArray(response.data.data) ? response.data.data : []
            // En güncel sayısal değeri bul (ilk sayısal geleni kabul et)
            const row = rows.find(r => Number.isFinite(Number(r?.[mqTarget.col]))) || rows[0]
            const valueRaw = row?.[mqTarget.col]
            const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at
            const val = Number.isFinite(Number(valueRaw)) ? Number(valueRaw) : null
            const formattedVal = val === null ? 'N/A' : (Math.abs(val) < 1 ? val.toFixed(4) : val.toLocaleString('tr-TR'))
            const reply = `📦 MQ QM - ${mqTarget.label}\n` +
              `• Değer: ${formattedVal}\n` +
              `• Zaman: ${formatTrDate(ts)}`
            setMessages(prev => [...prev, { text: reply, sender: 'bot' }])
          } else {
            setMessages(prev => [...prev, { text: 'MQ QM verisi alınamadı.', sender: 'bot' }])
          }
        } catch (err) {
          setMessages(prev => [...prev, { text: 'MQ QM verisi alınırken bir hata oluştu.', sender: 'bot' }])
        }
        return
      }

      // Dynamic QM: all columns or specific column by name
      const listAll = lowerMessage.includes('tüm') || lowerMessage.includes('hepsi') || lowerMessage.includes('kolon') || lowerMessage.includes('columns') || lowerMessage.includes('liste')
      try {
        const response = await databaseAPI.getMainviewMQQm({})
        if (response.data?.success) {
          const rows = Array.isArray(response.data.data) ? response.data.data : []
          if (rows.length === 0) {
            setMessages(prev => [...prev, { text: 'MQ QM verisi bulunamadı.', sender: 'bot' }])
            return
          }
          if (listAll) {
            const summary = buildSummary(rows, 20)
            setMessages(prev => [...prev, { text: `📦 MQ QM - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot' }])
            return
          }
          const keys = getAllKeys(rows)
          const picked = pickColumnByMessage(lowerMessage, keys)
          if (!picked) {
            const preview = keys.slice(0, 10).join(', ')
            setMessages(prev => [...prev, { text: `Aradığınız QM kolonu bulunamadı. Örnekler: ${preview}. Tümünü görmek için "qm tüm" yazabilirsiniz.`, sender: 'bot' }])
            return
          }
          const row = rows.find(r => r?.[picked] !== null && r?.[picked] !== undefined) || rows[0]
          const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at
          const reply = `📦 MQ QM - ${picked}\n• Değer: ${formatValue(row?.[picked])}\n• Zaman: ${formatTrDate(ts)}`
          setMessages(prev => [...prev, { text: reply, sender: 'bot' }])
        } else {
          setMessages(prev => [...prev, { text: 'MQ QM verisi alınamadı.', sender: 'bot' }])
        }
      } catch (err) {
        setMessages(prev => [...prev, { text: 'MQ QM verisi alınırken bir hata oluştu.', sender: 'bot' }])
      }
      return
    }

    // Diğer bot cevapları
    setTimeout(() => {
      const botMessage = { text: getBotResponse(message), sender: 'bot' }
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
