import { useState, useRef, useEffect } from 'react'
import { databaseAPI } from '../../services/api'
import toast from 'react-hot-toast'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState([
    { text: 'Merhaba! Size nasıl yardımcı olabilirim?', sender: 'bot' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [columnsCache, setColumnsCache] = useState({})
  const [userClosedSuggestions, setUserClosedSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Tunables
  const SUGGESTION_LIMIT = 8
  const COLUMN_SUGGEST_MIN = 2
  const ALIAS_INCLUDE_MIN = 3
  const LIST_ALL_KEYWORDS = ['tüm', 'hepsi', 'kolon', 'columns', 'liste']

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Mesaj zaman damgası oluştur
  const getMessageTime = () => {
    return new Date().toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Tarih parse fonksiyonu (esnek tarih formatları)
  const parseFlexibleDate = (dateStr) => {
    if (!dateStr) return null
    const cleaned = dateStr.trim()
    
    // YYYY-MM-DD formatı
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return new Date(cleaned + 'T00:00:00')
    }
    
    // DD-MM-YYYY formatı
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('-')
      return new Date(`${year}-${month}-${day}T00:00:00`)
    }
    
    // DD.MM.YYYY formatı
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('.')
      return new Date(`${year}-${month}-${day}T00:00:00`)
    }
    
    // DD/MM/YYYY formatı
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [day, month, year] = cleaned.split('/')
      return new Date(`${year}-${month}-${day}T00:00:00`)
    }
    
    // Genel Date parse
    const parsed = new Date(cleaned)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
    
    return null
  }

  // Mesajdan tarih aralığı çıkar
  const extractDateRangeFromMessage = (message) => {
    // Tarih formatları: "2025-01-01 ile 2025-01-03", "30-10-2025 ve 31-10-2025", "01.01.2025 ve 03.01.2025", "cpu 01.01.2025 ve 03.01.2025" vb.
    const datePatterns = [
      // YYYY-MM-DD formatları
      /(\d{4}-\d{2}-\d{2})\s*(ile|ve|and|\-|to)\s+(\d{4}-\d{2}-\d{2})/i,
      /(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})/,
      // DD-MM-YYYY formatları
      /(\d{2}-\d{2}-\d{4})\s+(ve|ile|and|to|\-)\s+(\d{2}-\d{2}-\d{4})/i,
      /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})/,
      // DD.MM.YYYY formatları
      /(\d{2}\.\d{2}\.\d{4})\s+(ve|ile|and|to|\-)\s+(\d{2}\.\d{2}\.\d{4})/i,
      /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})/,
      // DD/MM/YYYY formatları
      /(\d{2}\/\d{2}\/\d{4})\s+(ve|ile|and|to|\-)\s+(\d{2}\/\d{2}\/\d{4})/i,
      /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/
    ]
    
    for (const pattern of datePatterns) {
      const match = message.match(pattern)
      if (match) {
        const startDate = parseFlexibleDate(match[1])
        const endDate = parseFlexibleDate(match[2] || match[3])
        
        if (startDate && endDate) {
          // Tarih sıralamasını kontrol et (başlangıç bitişten büyükse yer değiştir)
          if (startDate > endDate) {
            const temp = startDate
            const correctedStart = endDate
            const correctedEnd = temp
            correctedStart.setHours(0, 0, 0, 0)
            correctedEnd.setHours(23, 59, 59, 999)
            return { startDate: correctedStart, endDate: correctedEnd }
          }
          
          // Başlangıç tarihini günün başına, bitiş tarihini günün sonuna ayarla
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          return { startDate, endDate }
        }
      }
    }
    
    // Alternatif: Mesajdaki tüm tarihleri bul ve ilk iki tarihi al
    const allDatePatterns = [
      /\d{4}-\d{2}-\d{2}/g,
      /\d{2}-\d{2}-\d{4}/g,
      /\d{2}\.\d{2}\.\d{4}/g,
      /\d{2}\/\d{2}\/\d{4}/g
    ]
    
    for (const pattern of allDatePatterns) {
      const matches = message.match(pattern)
      if (matches && matches.length >= 2) {
        const date1 = parseFlexibleDate(matches[0])
        const date2 = parseFlexibleDate(matches[1])
        
        if (date1 && date2) {
          const startDate = date1 < date2 ? date1 : date2
          const endDate = date1 < date2 ? date2 : date1
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          return { startDate, endDate }
        }
      }
    }
    
    return null
  }

  // Chatbot'u kapat ve tüm state'leri sıfırla (yeniden açıldığında en baştan başlasın)
  const resetAndCloseChatbot = () => {
    // Mesajları başlangıç durumuna getir
    setMessages([{ text: 'Merhaba! Size nasıl yardımcı olabilirim?', sender: 'bot' }])
    // Diğer state'leri sıfırla
    setInputMessage('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    setUserClosedSuggestions(false)
    // Fullscreen modunu kapat
    setIsFullscreen(false)
    // Chatbot'u kapat
    setIsOpen(false)
  }

  // Chatbot'u arka plana at (state'leri koru, kaldığı yerden devam etsin)
  const minimizeChatbot = () => {
    // Fullscreen modunu kapat
    setIsFullscreen(false)
    // Chatbot'u kapat (state'ler korunur)
    setIsOpen(false)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

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
  // Basit Levenshtein mesafesi
  const levenshtein = (a, b) => {
    const m = a.length, n = b.length
    if (m === 0) return n
    if (n === 0) return m
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        )
      }
    }
    return dp[m][n]
  }
  // Fuzzy match
  const fuzzyMatch = (needle, hay, maxDist = 2) => {
    if (!needle || !hay) return false
    if (hay.includes(needle) || needle.includes(hay)) return true
    return levenshtein(needle, hay) <= maxDist
  }
  const pickColumnByMessage = (lowerMessage, keys, labeler) => {
    const msgNorm = normalizeKey(lowerMessage)
    const candidates = []
    
    // ÖNCE: Display label'larda ara (kullanıcı dostu isimler)
    if (labeler) {
      for (const k of keys) {
        const label = labeler(k)
        if (label) {
          const lab = normalizeKey(label)
          let score = 0
          
          // Exact match (en yüksek öncelik)
          if (msgNorm === lab) {
            score = 100
          }
          // Mesaj label'ı tam olarak içeriyor (tam eşleşme)
          else if (msgNorm.includes(lab) && lab.length >= msgNorm.length * 0.8) {
            score = 80
          }
          // Label mesajı tam olarak içeriyor (tam eşleşme)
          else if (lab.includes(msgNorm) && msgNorm.length >= lab.length * 0.8) {
            score = 70
          }
          // Mesaj label'ı içeriyor (kısmi eşleşme - daha uzun label'lar öncelikli)
          else if (msgNorm.includes(lab)) {
            score = 50 + (lab.length / 100) // Daha uzun label'lar daha yüksek skor
          }
          // Label mesajı içeriyor (kısmi eşleşme - daha uzun label'lar öncelikli)
          else if (lab.includes(msgNorm)) {
            score = 40 + (msgNorm.length / 100) // Daha uzun mesajlar daha yüksek skor
          }
          // Fuzzy match
          else if (fuzzyMatch(msgNorm, lab)) {
            score = 30
          }
          
          if (score > 0) {
            candidates.push({ key: k, score, labelLength: lab.length })
          }
        }
      }
      
      // En yüksek skorlu ve en uzun label'ı seç
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return b.labelLength - a.labelLength // Skor eşitse daha uzun label'ı seç
        })
        return candidates[0].key
      }
    }
    
    // SONRA: Raw key'lerde ara (fallback)
    for (const k of keys) { 
      const keyNorm = normalizeKey(k)
      if (msgNorm === keyNorm || msgNorm.includes(keyNorm) || keyNorm.includes(msgNorm)) {
        return k
      }
    }
    
    return null
  }
  const formatValue = (v) => {
    if (v === null || v === undefined) return 'N/A'
    const n = Number(v)
    if (!Number.isFinite(n)) return String(v)
    return Math.abs(n) < 1 ? n.toFixed(4) : n.toLocaleString('tr-TR')
  }
  const buildSummary = (rows, maxPairs = 12, datasetKey = null) => {
    const first = rows?.[0] || {}
    const keys = Object.keys(first).filter(k => k !== 'index')
    const pairs = []
    
    // Display label fonksiyonunu al
    let getDisplayLabel = (key) => key
    if (datasetKey) {
      const cfg = datasetConfigs[datasetKey]
      getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
    }
    
    for (const k of keys) {
      const r = rows.find(row => row?.[k] !== null && row?.[k] !== undefined) || first
      const displayLabel = getDisplayLabel(k)
      pairs.push(`${displayLabel}: ${formatValue(r?.[k])}`)
      if (pairs.length >= maxPairs) break
    }
    return pairs.join('\n')
  }

  // Dataset bilgi mesajı oluştur (sadece dataset adı yazıldığında)
  const buildDatasetInfoMessage = (title, columns, datasetKey) => {
    const cfg = datasetConfigs[datasetKey]
    const getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
    
    // İlk birkaç kolonu göster
    const displayColumns = columns.slice(0, 10).map(col => {
      const displayName = getDisplayLabel(col)
      return `• ${displayName}`
    })
    
    const moreText = columns.length > 10 ? `\nve ${columns.length - 10} kolon daha` : ''
    
    // Örnek sorgular için display label kullan
    const example1 = columns[0] ? getDisplayLabel(columns[0]) : 'kolon_adı'
    const example2 = columns[1] ? getDisplayLabel(columns[1]) : 'kolon_adı'
    
    // Dataset key'i için primary alias kullan (daha kısa)
    const primaryAlias = cfg?.primaryAliases?.[0] || datasetKey
    
    return `📊 ${title}\n\nMevcut kolonlar:\n${displayColumns.join('\n')}${moreText}\n\n💡 Örnek sorgular:\n• ${primaryAlias} ${example1}\n• ${primaryAlias} ${example2}`
  }

  // Kolon bulunamadı mesajı oluştur
  const buildColumnNotFoundMessage = (title, examples, datasetKey) => {
    const cfg = datasetConfigs[datasetKey]
    const getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
    
    const displayExamples = examples.slice(0, 8).map(ex => {
      const displayName = getDisplayLabel(ex)
      return `• ${displayName}`
    })
    
    // Örnek sorgular için display label kullan
    const example1 = examples[0] ? getDisplayLabel(examples[0]) : 'kolon_adı'
    const example2 = examples[1] ? getDisplayLabel(examples[1]) : 'kolon_adı'
    
    // Dataset key'i için primary alias kullan (daha kısa)
    const primaryAlias = cfg?.primaryAliases?.[0] || datasetKey
    
    return `❓ ${title} için aradığınız kolon bulunamadı.\n\nMevcut kolonlar:\n${displayExamples.join('\n')}\n\n💡 Örnek sorgular:\n• ${primaryAlias} ${example1}\n• ${primaryAlias} ${example2}`
  }

  // Display label eşlemleri (MQPage.jsx ile uyumlu sade kopya)
  const getQmDisplayLabelLocal = (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (n === 'qmnames') return 'Queue Manager Short Name'
    if (n === 'jtarget') return 'Target Field'
    if (n === 'qmplat') return 'Platform Type'
    if (n === 'qmplatn') return 'Platform Name'
    if (n === 'qmstat') return 'Status'
    if (n === 'qmqstats') return 'MQE Stats Collection Status'
    if (n === 'qmiputtr') return 'Interval Total Put Rate'
    if (n === 'qmigetr') return 'Interval Get Rate'
    if (n === 'qmnqmes') return 'Number of Normal Queue Messages'
    if (n === 'qmxqmes') return 'Number of Transmission Queue Messages'
    if (n === 'qmcomlv') return 'Queue Manager Version'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  const getConnzDisplayLabelLocal = (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (n === 'connapltag') return 'Application Name'
    if (n === 'conninfotyp') return 'Type Of Information (Hex) (Count)'
    if (n === 'connasid') return 'Address Space Identifier'
    if (n === 'connapltyx') return 'Application Type(Maximum)'
    if (n === 'conntranid') return 'CICS Transaction Id'
    if (n === 'conntaskno') return 'CICS Task number'
    if (n === 'connpsbnm') return 'IMS PSB Name'
    if (n === 'connobject') return 'Object Name(Maximum)'
    if (n === 'connqmgr') return 'Queue Manager'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  const getW2overDisplayLabelLocal = (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (n === 'wzoqmgr') return 'Queue Manager Name'
    if (n === 'wzoqmst') return 'Queue Manager Status'
    if (n === 'wzonrchl') return 'Channels Retrying'
    if (n === 'wzolqhi') return 'Local Queues at Max Depth High'
    if (n === 'wzoxqhi') return 'Transmit Queues at Max Depth High'
    if (n === 'wzodlmct') return 'Dead-Letter Message Count'
    if (n === 'wzops0fp') return 'Free Pages in Page Set 0'
    if (n === 'wzoevtc') return 'Queue Manager Events'
    if (n === 'wzoevta') return 'Event Listener Status'
    if (n === 'wzocmdsv') return 'Command Server Status'
    if (n === 'wzocpf') return 'Command Prefix'
    if (n === 'wzorqexc') return 'Reply Q Exceptions'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ZOS CPU/MVS SYSOVER display label
  const getCpuDisplayLabelLocal = (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (n === 'syxsysn') return 'SYS'
    if (n === 'succpub') return 'CPU Busy%'
    if (n === 'sucziib') return 'zIIP Busy%'
    if (n === 'scicpavg') return 'CPU Avg'
    if (n === 'suciinrt') return 'I/O Rate'
    if (n === 'suklqior') return 'Queue I/O'
    if (n === 'sukadbpc') return 'DASD Busy%'
    if (n === 'csrecspu') return 'CPU SPU'
    if (n === 'csreecpu') return 'CPU EPU'
    if (n === 'csresqpu') return 'SQ PU'
    if (n === 'csreespu') return 'ES PU'
    if (n === 'bmctime') return 'Date/Time'
    if (n === 'time') return 'Time'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ZOS Address Space/JCPU display label
  const getAddressSpaceDisplayLabelLocal = (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (n === 'jobname') return 'Jobname'
    if (n === 'jesjobnumber' || n === 'jes_job_number') return 'JES Job Number'
    if (n === 'addressspacetype' || n === 'address_space_type') return 'Address Space Type'
    if (n === 'serviceclassname' || n === 'service_class_name') return 'Service Class Name'
    if (n === 'asgrnmc') return 'ASGRNMC'
    if (n === 'jobstepbeingmonitored' || n === 'job_step_being_monitored') return 'Job Step Being Monitored'
    if (n === 'allcpusec' || n === 'all_cpu_seconds') return 'ALL CPU seconds'
    if (n === 'unadjcpuutil' || n === 'unadj_cpu_util') return 'Unadj CPU Util (All Enclaves)'
    if (n === 'usingcpup' || n === 'using_cpu_p') return 'Using CPU %'
    if (n === 'cpudelayp' || n === 'cpu_delay_p') return 'CPU Delay %'
    if (n === 'averagepriority' || n === 'average_priority') return 'Average Priority'
    if (n === 'tcbtime') return 'TCB Time'
    if (n === 'srb_time' || n === 'srbtime') return '% SRB Time'
    if (n === 'bmctime') return 'BMC Time'
    if (n === 'time') return 'Time'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ZOS Spool/JESPOOL display label
  const getSpoolDisplayLabelLocal = (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const n = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (n === 'id') return 'ID'
    if (n === 'bmctime') return 'Date/Time'
    if (n === 'time') return 'Time'
    if (n === 'smfid' || n === 'smf_id') return 'SMF ID'
    if (n === 'volume') return 'Volume'
    if (n === 'status') return 'Status'
    if (n === 'totalvolumes' || n === 'total_volumes') return 'Total Volumes'
    if (n === 'spoolutil' || n === 'spool_util') return 'Spool %UTIL'
    if (n === 'totaltracks' || n === 'total_tracks') return 'Total Tracks'
    if (n === 'usedtracks' || n === 'used_tracks') return 'Used Tracks'
    if (n === 'activespoolutil' || n === 'active_spool_util') return 'Active %UTIL'
    if (n === 'totalactivetracks' || n === 'total_active_tracks') return 'Total Active Tracks'
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ZOS CPU parse query
  const parseCpuQuery = (lowerMessage) => {
    const candidates = [
      { col: 'succpub', label: 'CPU Busy%', keys: ['succpub', 'cpu busy', 'cpu busy%', 'cpubusy', 'cpu kullanım', 'cpu kullanimi'] },
      { col: 'sucziib', label: 'zIIP Busy%', keys: ['sucziib', 'ziiip busy', 'ziiip busy%', 'ziip', 'ziiip kullanım'] },
      { col: 'scicpavg', label: 'CPU Avg', keys: ['scicpavg', 'cpu avg', 'cpu average', 'cpu ortalaması', 'cpu ortalamasi'] },
      { col: 'suciinrt', label: 'I/O Rate', keys: ['suciinrt', 'io rate', 'i/o rate', 'io oranı', 'io orani'] },
      { col: 'suklqior', label: 'Queue I/O', keys: ['suklqior', 'queue io', 'queue i/o', 'kuyruk io'] },
      { col: 'sukadbpc', label: 'DASD Busy%', keys: ['sukadbpc', 'dasd busy', 'dasd busy%', 'dasd kullanım'] },
      { col: 'csrecspu', label: 'CPU SPU', keys: ['csrecspu', 'cpu spu', 'spu'] },
      { col: 'csreecpu', label: 'CPU EPU', keys: ['csreecpu', 'cpu epu', 'epu'] },
      { col: 'csresqpu', label: 'SQ PU', keys: ['csresqpu', 'sq pu', 'sqpu'] },
      { col: 'csreespu', label: 'ES PU', keys: ['csreespu', 'es pu', 'espu'] },
      { col: 'syxsysn', label: 'SYS', keys: ['syxsysn', 'sys', 'system', 'sistem'] },
      { col: 'bmctime', label: 'Date/Time', keys: ['bmctime', 'date', 'tarih', 'time', 'zaman'] },
    ]
    for (const c of candidates) {
      if (c.keys.some(k => lowerMessage.includes(k))) return c
    }
    return null
  }

  // ZOS Address Space parse query
  const parseAddressSpaceQuery = (lowerMessage) => {
    const candidates = [
      { col: 'jobname', label: 'Jobname', keys: ['jobname', 'job name', 'job adı', 'job adi'] },
      { col: 'jes_job_number', label: 'JES Job Number', keys: ['jes job number', 'jes_job_number', 'jes job', 'job number'] },
      { col: 'address_space_type', label: 'Address Space Type', keys: ['address space type', 'address_space_type', 'address space', 'adres alanı tipi'] },
      { col: 'service_class_name', label: 'Service Class Name', keys: ['service class name', 'service_class_name', 'service class', 'servis sınıfı'] },
      { col: 'asgrnmc', label: 'ASGRNMC', keys: ['asgrnmc', 'asgrn'] },
      { col: 'job_step_being_monitored', label: 'Job Step Being Monitored', keys: ['job step being monitored', 'job_step_being_monitored', 'job step', 'job adımı'] },
      { col: 'all_cpu_seconds', label: 'ALL CPU seconds', keys: ['all cpu seconds', 'all_cpu_seconds', 'cpu seconds', 'cpu saniye'] },
      { col: 'using_cpu_p', label: 'Using CPU %', keys: ['using cpu', 'using_cpu_p', 'using cpu%', 'cpu kullanım'] },
      { col: 'cpu_delay_p', label: 'CPU Delay %', keys: ['cpu delay', 'cpu_delay_p', 'cpu delay%', 'cpu gecikme'] },
      { col: 'average_priority', label: 'Average Priority', keys: ['average priority', 'average_priority', 'priority', 'öncelik'] },
      { col: 'tcb_time', label: 'TCB Time', keys: ['tcb time', 'tcb_time', 'tcb'] },
      { col: 'srb_time', label: '% SRB Time', keys: ['srb time', 'srb_time', 'srb'] },
    ]
    for (const c of candidates) {
      if (c.keys.some(k => lowerMessage.includes(k))) return c
    }
    return null
  }

  // ZOS Spool parse query
  const parseSpoolQuery = (lowerMessage) => {
    const candidates = [
      { col: 'total_volumes', label: 'Total Volumes', keys: ['total volumes', 'total_volumes', 'volumes', 'toplam volume'] },
      { col: 'spool_util', label: 'Spool %UTIL', keys: ['spool util', 'spool_util', 'spool kullanım', 'spool kullanim', 'spool%'] },
      { col: 'total_tracks', label: 'Total Tracks', keys: ['total tracks', 'total_tracks', 'tracks', 'toplam track'] },
      { col: 'used_tracks', label: 'Used Tracks', keys: ['used tracks', 'used_tracks', 'kullanılan tracks', 'kullanilan tracks'] },
      { col: 'active_spool_util', label: 'Active %UTIL', keys: ['active spool util', 'active_spool_util', 'aktif spool', 'aktif kullanım'] },
      { col: 'total_active_tracks', label: 'Total Active Tracks', keys: ['total active tracks', 'total_active_tracks', 'aktif tracks'] },
      { col: 'volume', label: 'Volume', keys: ['volume', 'vol'] },
      { col: 'status', label: 'Status', keys: ['status', 'durum'] },
      { col: 'smf_id', label: 'SMF ID', keys: ['smf id', 'smf_id', 'smf'] },
    ]
    for (const c of candidates) {
      if (c.keys.some(k => lowerMessage.includes(k))) return c
    }
    return null
  }

  // RMF Dataset display label mapping (RMFPage.jsx columnMapping'den)
  const rmfColumnMapping = {
    rmf_pgspp: {
      'id': 'ID',
      'pdgnum': 'Page Data Set Number',
      'pdgtypc': 'Page Data Set Type',
      'pdgser': 'Volume Serial Number',
      'pdredevc': 'Device Number',
      'pdgstat': 'Page Data Set Status',
      'pdislupc': 'Page Slot In Use Percentage',
      'pdipxtav': 'Average Page Transfer Time',
      'pdipiort': 'I/O Request Rate',
      'pdippbav': 'Average Pages per Burst',
      'pdgvioc': 'VIO Eligibility',
      'pdibsypc': 'In Use Percentage',
      'pdgdsn': 'Page Data Set Name',
      'timestamp': 'Timestamp'
    },
    rmf_ard: {
      'jobname': 'Jobname',
      'device_connection_time_seconds': 'Device Connection Time for the Job',
      'current_fixed_frames_16m': 'Current Fixed Frames < 16M',
      'current_fixed_frame_count': 'Current Fixed Frame Count',
      'cross_memory_register': 'Cross Memory Register',
      'session_srm_service_absorption_rate': 'Session SRM Service Absorption Rate',
      'session_cpu_seconds_tcb_mode': 'Session CPU Seconds in TCB Mode',
      'cpu_seconds': 'CPU Seconds',
      'excp_rate_per_second': 'EXCP Rate-Per-Second',
      'swap_page_rate_per_second': 'Swap Page Rate-Per-Second',
      'interval_lpa_page_rate': 'Interval LPA Page Rate',
      'interval_csa_page_in_rate': 'Interval CSA Page-In Rate',
      'realtime_non_vio_page_rate': 'Realtime Non-VIO Page Rate',
      'private_vio_hiperspace_page_rate': 'Private VIO and Hiperspace Page Rate',
      'created_at': 'Created At',
      'updated_at': 'Updated At'
    },
    rmf_trx: {
      'mxgcnm': 'Service Class Name',
      'mxgcpn': 'Period Number',
      'mxgtypc': 'WLM Type',
      'mxiasac': 'Average Number of AS Counted',
      'mxixavg': 'Average Active Time',
      'mxirate': 'Transaction Rate',
      'mxircp': 'Transactions Completed',
      'bmctime': 'BMC Time',
      'time': 'Time'
    },
    rmf_asrm: {
      'ASGNAME': 'Jobname', 'asgname': 'Jobname',
      'ASGCNMC': 'Service Class Name', 'asgcnmc': 'Service Class Name',
      'ASGPGP': 'Service Class Index or Performance Period', 'asgpgp': 'Service Class Index or Performance Period',
      'ASSACTM': 'The TRANSACTION ACTIVE time', 'assactm': 'The TRANSACTION ACTIVE time',
      'ASGRTM': 'Current Residency Time', 'asgrtm': 'Current Residency Time',
      'ASSTRC': 'Session Transaction Count', 'asstrc': 'Session Transaction Count',
      'ASSJSW': 'Swap Total', 'assjsw': 'Swap Total',
      'ASSSCSCK': 'CPU Service Unit Count', 'assscsck': 'CPU Service Unit Count',
      'ASSMSOCK': 'Service Units Consumed Using Real Storage', 'assmsock': 'Service Units Consumed Using Real Storage',
      'ASSIOCCK': 'I/O Service Units Consumed by the Transaction', 'assiock': 'I/O Service Units Consumed by the Transaction',
      'ASSSRSCK': 'SRB Processor Service Consumed by Transaction', 'asssrsck': 'SRB Processor Service Consumed by Transaction',
      'ASSWMCK': 'Total Service Units', 'asswmck': 'Total Service Units'
    },
    rmf_srcs: {
      'SPLAFCAV': 'Available Frames', 'splafcav': 'Available Frames',
      'SPLUICAV': 'Current UIC', 'spluicav': 'Current UIC',
      'SPLSTFAV': 'SQA Frames Count', 'splstfav': 'SQA Frames Count',
      'SPLLPFAV': 'LPA Frame Count', 'spllpfav': 'LPA Frame Count',
      'SPLLFFAV': 'LPA Fixed Frame Count', 'spllffav': 'LPA Fixed Frame Count',
      'SPLCPFAV': 'Pageable CSA and MLPA Frames Count', 'splcpfav': 'Pageable CSA and MLPA Frames Count',
      'SPLCLFAV': 'Fixed LPA and CSA Frames Count', 'splclfav': 'Fixed LPA and CSA Frames Count',
      'SPLRFFAV': 'Private Non-LSQA Fixed Frame Count', 'splrffav': 'Private Non-LSQA Fixed Frame Count',
      'SPLQPCAV': 'Private Fixed Frames Count', 'splqpcav': 'Private Fixed Frames Count',
      'SPLQPEAV': 'LSQA Frame Count', 'splqpeav': 'LSQA Frame Count',
      'SCLINAV': 'Current IN Queue Length', 'sclinav': 'Current IN Queue Length',
      'SCLLOTAV': 'Address Spaces Logically Swapped Out', 'scllotav': 'Address Spaces Logically Swapped Out',
      'SCLOTRAV': 'Current Out Ready Queue Length', 'sclotrav': 'Current Out Ready Queue Length',
      'SCLOTWAV': 'Current Out Wait Queue Length', 'sclotwav': 'Current Out Wait Queue Length'
    },
    rmf_spag: {
      'SPLLNIRT': 'LPA Page-In Rate', 'spllnirt': 'LPA Page-In Rate',
      'SPLCINRT': 'CSA Page-In Rate', 'splcinrt': 'CSA Page-In Rate',
      'SPLCOTRT': 'CSA Page-Out Rate', 'splcotrt': 'CSA Page-Out Rate',
      'SSLTSWRT': 'Total Swap Rate', 'ssltswrt': 'Total Swap Rate',
      'SPLSINRT': 'Swap Page-In Rate', 'splsinrt': 'Swap Page-In Rate',
      'SPLSOTRT': 'Swap Page-Out Rate', 'splsotrt': 'Swap Page-Out Rate',
      'SPLPPIRT': 'VIO and Non-VIO Page-In Rate', 'splppirt': 'VIO and Non-VIO Page-In Rate',
      'SPLPORT': 'VIO and Non-VIO Page-Out Rate', 'splpport': 'VIO and Non-VIO Page-Out Rate',
      'SPLHVPRT': 'VIO Paging Rate', 'splhvprt': 'VIO Paging Rate',
      'SPLCTWAV': 'Common Area Target Working Set', 'splctwav': 'Common Area Target Working Set',
      'SPLAFCAV': 'Available Frames', 'splafcav': 'Available Frames',
      'SPLUICAV': 'Current UIC', 'spluicav': 'Current UIC',
      'SPLPESRT': 'Pages To Expanded', 'splpesrt': 'Pages To Expanded',
      'SPLMGAAV': 'Current Migration Age', 'splmgaav': 'Current Migration Age',
      'SPLESFAV': 'Available Expanded Storage Frames', 'splesfav': 'Available Expanded Storage Frames',
      'SPLPEART': 'Pages To Auxiliary', 'splpeart': 'Pages To Auxiliary'
    },
    cmf_dspcz: {
      'ONAM': 'Owner Name', 'onam': 'Owner Name',
      'DSPNAME': 'Data Space Name (Count)', 'dspname': 'Data Space Name (Count)',
      'ASID': 'ASID', 'asid': 'ASID',
      'KEY': 'Storage Key', 'key': 'Storage Key',
      'TYPX': 'Data Space Type', 'typx': 'Data Space Type',
      'SCOX': 'Data Space Scope', 'scox': 'Data Space Scope',
      'REFX': 'Storage Reference', 'refx': 'Storage Reference',
      'PROX': 'Storage Protect', 'prox': 'Storage Protect',
      'CSIZ': 'Current Size (Average)', 'csiz': 'Current Size (Average)',
      'CSIZAVG': 'Current Size (Average)', 'csizavg': 'Current Size (Average)',
      'MSIZ': 'Maximum Size (Average)', 'msiz': 'Maximum Size (Average)',
      'MSIZAVG': 'Maximum Size (Average)', 'msizavg': 'Maximum Size (Average)'
    },
    cmf_xcfsys: {
      'from_system': 'From System',
      'to_system': 'To System',
      'transport_class': 'Transport Class',
      'total_messages': 'Total Messages',
      'percent_messages_big': '% Messages Big',
      'percent_messages_fit': '% Messages Fit',
      'percent_messages_small': '% Messages Small',
      'no_paths_count': 'No Paths Count',
      'no_buffers_count': 'No Buffers Count',
      'percent_messages_degraded': '% Messages Degraded',
      'avg_used_message_blocks': 'Avg Used Message Blocks',
      'percent_transport_class_buffers_used': '% of Transport Class Buffers Used',
      'max_message': 'Maximum Message',
      'percent_system_buffers_used': '% of System Buffers Used',
      'max_message_blocks': 'Maximum Message Blocks',
      'path_direction': 'Path Direction'
    },
    cmf_jcsa: {
      'jobname': 'Jobname',
      'jes_id': 'JES ID',
      'asid': 'Address Space ID',
      'csa_in_use_percent': 'CSA In Use Percent',
      'ecsa_in_use_percent': 'ECSA In Use Percent',
      'sqa_in_use_percent': 'SQA In Use Percent',
      'esqa_in_use_percent': 'ESQA In Use Percent',
      'csa_in_use': 'CSA in Use',
      'ecsa_in_use': 'ECSA in Use',
      'sqa_in_use': 'SQA In Use',
      'esqa_in_use': 'ESQA In Use',
      'total_used_common_storage': 'Used Common Storage',
      'total_used_percent': 'Total Used Common Storage Percent'
    },
    cmf_syscpc: {
      'smf_id': 'SMF ID', 'SMF_ID': 'SMF ID',
      'system_name': 'System Name', 'SYSTEM_NAME': 'System Name',
      'hardware_name': 'Hardware Name', 'HARDWARE_NAME': 'Hardware Name',
      'cpu_model': 'CPU Model', 'CPU_MODEL': 'CPU Model',
      'cpc_capacity': 'CPC Capacity', 'CPC_CAPACITY': 'CPC Capacity',
      'base_cpc_capacity': 'Base CPC Capacity', 'BASE_CPC_CAPACITY': 'Base CPC Capacity',
      'capacity_on_demand': 'Capacity on Demand', 'CAPACITY_ON_DEMAND': 'Capacity on Demand'
    },
    rmf_asd: {}, // Column mapping not available in RMFPage - fallback will be used
    cmf_xcfmbr: {} // Column mapping not available in RMFPage - fallback will be used
  }

  // RMF Dataset display label fonksiyonu (genel)
  const getRmfDisplayLabelLocal = (datasetKey) => (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const mapping = rmfColumnMapping[datasetKey]
    if (mapping && mapping[key]) return mapping[key]
    if (mapping && mapping[key.toUpperCase()]) return mapping[key.toUpperCase()]
    if (mapping && mapping[key.toLowerCase()]) return mapping[key.toLowerCase()]
    // Fallback: normalize and title case
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Storage Dataset display label mapping (StoragePage.jsx'den)
  const storageColumnMapping = {
    csasum: {
      'csa_in_use_percent': 'CSA in use percent',
      'ecsa_in_use_percent': 'ECSA in use percent',
      'rucsa_in_use_percent': 'RUCSA in use percent',
      'sqa_in_use_percent': 'SQA in use percent',
      'total_cs_used_percent': 'Total CS used percent',
      'percent_used_high_shared_storage': 'High Shared Storage used percent',
      'timestamp': 'Timestamp',
      'bmctime': 'BMC Time',
      'time': 'Time'
    },
    frminfo_fixed: {
      'sqa_avg': 'Average SQA Frames',
      'sqa_min': 'Minimum SQA Frames',
      'sqa_max': 'Maximum SQA Frames',
      'lpa_avg': 'Average LPA Frames',
      'lpa_min': 'Minimum LPA Frames',
      'lpa_max': 'Maximum LPA Frames',
      'csa_avg': 'Average CSA Frames',
      'lsqa_avg': 'Average LSQA Frames',
      'lsqa_min': 'Minimum LSQA Frames',
      'lsqa_max': 'Maximum LSQA Frames',
      'private_avg': 'Average Private Frames',
      'private_min': 'Minimum Private Frames',
      'private_max': 'Maximum Private Frames',
      'fixed_below_16m_avg': 'Average Fixed <16M',
      'fixed_below_16m_min': 'Minimum Fixed <16M',
      'fixed_below_16m_max': 'Maximum Fixed <16M',
      'fixed_total_avg': 'Average Fixed Total',
      'fixed_total_min': 'Minimum Fixed Total',
      'fixed_total_max': 'Maximum Fixed Total',
      'fixed_percentage': 'Fixed Frames Average Percentage',
      'timestamp': 'Timestamp',
      'system_name': 'System Name',
      'server_name': 'Server Name'
    },
    frminfo_center: {
      'spispcav': 'Average SQA Frames',
      'spispcmn': 'Minimum SQA Frames',
      'spispcmx': 'Maximum SQA Frames',
      'spilpfav': 'Average LPA Frames',
      'spilpfmn': 'Minimum LPA Frames',
      'spilpfmx': 'Maximum LPA Frames',
      'spicpfav': 'Average CSA Frames',
      'spicpfmn': 'Minimum CSA Frames',
      'spicpfmx': 'Maximum CSA Frames',
      'spiqpcav': 'Average LSQA Frames',
      'spiqpcmn': 'Minimum LSQA Frames',
      'spiqpcmx': 'Maximum LSQA Frames',
      'spiapfav': 'Average Private Frames',
      'spiapfmn': 'Minimum Private Frames',
      'spiapfmx': 'Maximum Private Frames',
      'spiafcav': 'Available Frames (Average)',
      'spiafcmn': 'Available Frames (Minimum)',
      'spitfuav': 'Average Central Total',
      'spiafumn': 'Minimum Central Total',
      'spiafumx': 'Maximum Central Total',
      'spitcpct': 'Central Frames Average Percentage',
      'bmctime': 'BMC Time',
      'timestamp': 'Timestamp'
    },
    frminfo_high_virtual: {
      'hv_common_avg': 'Average High Virtual Common Frames',
      'hv_common_min': 'Minimum High Virtual Common Frames',
      'hv_common_max': 'Maximum High Virtual Common Frames',
      'hv_shared_avg': 'Average High Virtual Shared Frames',
      'hv_shared_min': 'Minimum High Virtual Shared Frames',
      'hv_shared_max': 'Maximum High Virtual Shared Frames',
      'timestamp': 'Timestamp',
      'bmctime': 'BMC Time'
    },
    sysfrmiz: {
      'spgid': 'SMF ID',
      'spiuonlf': 'LPAR Online Storage (Average)',
      'spluicav': 'Current UIC',
      'spifinav': 'Average Nucleus Frames (Average)',
      'sprefncp': '% Nucleus Frames (Average)',
      'spispcav': 'Average SQA Frames (Average)',
      'spreasrp': '% SQA Frames (Average)',
      'spilpfav': 'Average LPA Frames (Average)',
      'sprealpp': '% LPA Frames (Average)',
      'spicpfav': 'Average CSA Frames (Average)',
      'spreavpp': '% CSA Frames (Average)',
      'spiqpcav': 'Average LSQA Frames (Average)',
      'sprelsqp': '% LSQA Frames (Average)',
      'spiapfav': 'Average Private Frames (Average)',
      'spreprvp': '% Private Frames (Average)',
      'spiafcav': 'Available Frames (Average)',
      'spreavlp': '% Available Frames (Average)',
      'spihvcav': 'Average High Virtual Common Frames',
      'sprecmnp': '% High Virtual Common Frames',
      'spihvsav': 'Average High Virtual Shared Frames',
      'spreshrp': '% High Virtual Shared Frames',
      'bmctime': 'BMC Time',
      'timestamp': 'Timestamp'
    }
  }

  // ZOS Dataset display label mapping (ZOSPage.jsx'den)
  const zosColumnMapping = {
    cpu: {
      'syxsysn': 'SYS',
      'SYXSYSN': 'SYS',
      'succpub': 'CPU Busy%',
      'SUCCPUB': 'CPU Busy%',
      'sucziib': 'zIIP Busy%',
      'SUCZIIB': 'zIIP Busy%',
      'scicpavg': 'CPU Avg',
      'SCICPAVG': 'CPU Avg',
      'suciinrt': 'I/O Rate',
      'SUCIINRT': 'I/O Rate',
      'suklqior': 'Queue I/O',
      'SUKLQIOR': 'Queue I/O',
      'sukadbpc': 'DASD Busy%',
      'SUKADBPC': 'DASD Busy%',
      'csrecspu': 'CPU SPU',
      'CSRECSPU': 'CPU SPU',
      'csreecpu': 'CPU EPU',
      'CSREECPU': 'CPU EPU',
      'csresqpu': 'SQ PU',
      'CSRESQPU': 'SQ PU',
      'csreespu': 'ES PU',
      'CSREESPU': 'ES PU',
      'bmctime': 'BMC Time',
      'BMCTIME': 'BMC Time',
      'time': 'Time',
      'TIME': 'Time'
    },
    jcpu: {
      'jobname': 'Jobname',
      'JOBNAME': 'Jobname',
      'jes_job_number': 'JES Job Number',
      'JES_JOB_NUMBER': 'JES Job Number',
      'address_space_type': 'Address Space Type',
      'ADDRESS_SPACE_TYPE': 'Address Space Type',
      'service_class_name': 'Service Class Name',
      'SERVICE_CLASS_NAME': 'Service Class Name',
      'asgrnmc': 'ASGRNMC',
      'ASGRNMC': 'ASGRNMC',
      'job_step_being_monitored': 'Job Step Being Monitored',
      'JOB_STEP_BEING_MONITORED': 'Job Step Being Monitored',
      'all_cpu_seconds': 'ALL CPU seconds',
      'ALL_CPU_SECONDS': 'ALL CPU seconds',
      'unadj_cpu_util_with_all_enclaves': 'Unadj CPU Util (All Enclaves)',
      'UNADJ_CPU_UTIL_WITH_ALL_ENCLAVES': 'Unadj CPU Util (All Enclaves)',
      'using_cpu_percentage': 'Using CPU %',
      'USING_CPU_PERCENTAGE': 'Using CPU %',
      'cpu_delay_percentage': 'CPU Delay %',
      'CPU_DELAY_PERCENTAGE': 'CPU Delay %',
      'average_priority': 'Average Priority',
      'AVERAGE_PRIORITY': 'Average Priority',
      'tcb_time': 'TCB Time',
      'TCB_TIME': 'TCB Time',
      'percentage_srb_time': '% SRB Time',
      'PERCENTAGE_SRB_TIME': '% SRB Time',
      'interval_unadj_remote_enclave_cpu_use': 'Interval Unadj Remote Enclave CPU use',
      'INTERVAL_UNADJ_REMOTE_ENCLAVE_CPU_USE': 'Interval Unadj Remote Enclave CPU use',
      'job_total_cpu_time': 'Job Total CPU Time',
      'JOB_TOTAL_CPU_TIME': 'Job Total CPU Time',
      'other_address_space_enclave_cpu_time': 'Other Addr Space Enclave CPU Time',
      'OTHER_ADDRESS_SPACE_ENCLAVE_CPU_TIME': 'Other Addr Space Enclave CPU Time',
      'ziip_total_cpu_time': 'zIIP Total CPU Time',
      'ZIIP_TOTAL_CPU_TIME': 'zIIP Total CPU Time',
      'ziip_interval_cpu_time': 'zIIP Interval CPU Time',
      'ZIIP_INTERVAL_CPU_TIME': 'zIIP Interval CPU Time',
      'dependent_enclave_ziip_total_time': 'Dep Enclave zIIP Total Time',
      'DEPENDENT_ENCLAVE_ZIIP_TOTAL_TIME': 'Dep Enclave zIIP Total Time',
      'dependent_enclave_ziip_interval_time': 'Dep Enclave zIIP Interval Time',
      'DEPENDENT_ENCLAVE_ZIIP_INTERVAL_TIME': 'Dep Enclave zIIP Interval Time',
      'dependent_enclave_ziip_on_cp_total': 'Dep Enclave zIIP On CP Total',
      'DEPENDENT_ENCLAVE_ZIIP_ON_CP_TOTAL': 'Dep Enclave zIIP On CP Total',
      'interval_cp_time': 'Interval CP time',
      'INTERVAL_CP_TIME': 'Interval CP time',
      'resource_group_name': 'Resource Group Name',
      'RESOURCE_GROUP_NAME': 'Resource Group Name',
      'resource_group_type': 'Resource Group Type',
      'RESOURCE_GROUP_TYPE': 'Resource Group Type',
      'recovery_process_boost': 'Recovery Process Boost',
      'RECOVERY_PROCESS_BOOST': 'Recovery Process Boost',
      'implicit_cpu_critical_flag': 'Implicit CPU Critical Flag',
      'IMPLICIT_CPU_CRITICAL_FLAG': 'Implicit CPU Critical Flag',
      'bmctime': 'BMC Time',
      'BMCTIME': 'BMC Time',
      'time': 'Time',
      'TIME': 'Time'
    },
    jespool: {
      'total_volumes': 'Total Volumes',
      'TOTAL_VOLUMES': 'Total Volumes',
      'total_files': 'Total Files',
      'TOTAL_FILES': 'Total Files',
      'total_tracks': 'Total Tracks',
      'TOTAL_TRACKS': 'Total Tracks',
      'total_cylinders': 'Total Cylinders',
      'TOTAL_CYLINDERS': 'Total Cylinders',
      'bmctime': 'BMC Time',
      'BMCTIME': 'BMC Time',
      'time': 'Time',
      'TIME': 'Time'
    }
  }

  // ZOS Dataset display label fonksiyonu (genel)
  const getZosDisplayLabelLocal = (datasetKey) => (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const mapping = zosColumnMapping[datasetKey]
    if (mapping && mapping[key]) return mapping[key]
    if (mapping && mapping[key.toUpperCase()]) return mapping[key.toUpperCase()]
    if (mapping && mapping[key.toLowerCase()]) return mapping[key.toLowerCase()]
    // Fallback: normalize and title case
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Network Dataset column mapping (NetworkPage.jsx'den)
  const networkColumnMapping = {
    stacks: {
      'jtarget': 'Target Field',
      'J_TARGET': 'Target Field',
      'j_target': 'Target Field',
      'asid8': 'Stack ASID',
      'ASID': 'Stack ASID',
      'asid': 'Stack ASID',
      'ver_rel': 'Stack Version',
      'Version': 'Stack Version',
      'version': 'Stack Version',
      'jobnam8': 'Job Name',
      'JOBNAM8': 'Job Name',
      'job_name': 'Job Name',
      'stepnam8': 'Step Name',
      'STEPNAM8': 'Step Name',
      'step_name': 'Step Name',
      'mvslvlx8': 'MVS Level',
      'MVSLVLX8': 'MVS Level',
      'mvs_level': 'MVS Level',
      'startc8': 'Start Time of Stack',
      'STARTC8': 'Start Time of Stack',
      'start_time': 'Start Time of Stack',
      'ipaddrc8': 'Stack IP ADDRESS',
      'IPADDRC8': 'Stack IP ADDRESS',
      'ip_address': 'Stack IP ADDRESS',
      'status18': 'Stack Status',
      'STATUS18': 'Stack Status',
      'status': 'Stack Status'
    },
    stackcpu: {
      'statstks': 'TCPIP Stack Name',
      'STATSTKS': 'TCPIP Stack Name',
      'ippktrcd': 'Interval Packets Received',
      'IPPKTRCD': 'Interval Packets Received',
      'ippktrtr': 'Packets Received per Second',
      'IPPKTRTR': 'Packets Received per Second',
      'ipoutred': 'Current Output Requests',
      'IPOUTRED': 'Current Output Requests',
      'ipoutrtr': 'Output Requests per Second',
      'IPOUTRTR': 'Output Requests per Second'
    },
    vtamcsa: {
      'j_system': 'System Field',
      'J_SYSTEM': 'System Field',
      'j system': 'System Field',
      'J System': 'System Field',
      'csacur': 'Current ECSA Usage',
      'CSACUR': 'Current ECSA Usage',
      'csamax': 'Maximum ECSA Usage',
      'CSAMAX': 'Maximum ECSA Usage',
      'csalim': 'CSA Limit',
      'CSALIM': 'CSA Limit',
      'csausage': 'ECSA Storage Usage',
      'CSAUSAGE': 'ECSA Storage Usage',
      'c24cur': 'Current CSA24 Usage',
      'C24CUR': 'Current CSA24 Usage',
      'c24max': 'Maximum CSA24 Usage',
      'C24MAX': 'Maximum CSA24 Usage',
      'vtmcur': 'Current Private Usage',
      'VTMCUR': 'Current Private Usage',
      'vtmmax': 'Maximum Private Usage',
      'VTMMAX': 'Maximum Private Usage'
    },
    tcpstor: {
      'step_name': 'Step',
      'STEP_NAME': 'Step',
      'step': 'Step',
      'system_name': 'System',
      'SYSTEM_NAME': 'System',
      'system': 'System',
      'ecsa_current': 'ECSA Current',
      'ECSA_CURRENT': 'ECSA Current',
      'ecsa_max': 'ECSA Max',
      'ECSA_MAX': 'ECSA Max',
      'ecsa_limit': 'ECSA Limit',
      'ECSA_LIMIT': 'ECSA Limit',
      'ecsa_free': 'ECSA Free',
      'ECSA_FREE': 'ECSA Free',
      'private_current': 'Private Current',
      'PRIVATE_CURRENT': 'Private Current',
      'private_max': 'Private Max',
      'PRIVATE_MAX': 'Private Max',
      'record_timestamp': 'Timestamp',
      'RECORD_TIMESTAMP': 'Timestamp',
      'timestamp': 'Timestamp',
      'bmctime': 'BMC Time',
      'BMCTIME': 'BMC Time',
      'time': 'Time'
    },
    tcpconf: {
      'job_name': 'Job Name',
      'JOB_NAME': 'Job Name',
      'stack_name': 'Stack Name',
      'STACK_NAME': 'Stack Name',
      'def_receive_bufsize': 'Def Receive Bufsize',
      'DEF_RECEIVE_BUFSIZE': 'Def Receive Bufsize',
      'def_send_bufsize': 'Def Send Bufsize',
      'DEF_SEND_BUFSIZE': 'Def Send Bufsize',
      'def_max_receive_bufsize': 'Max Receive Bufsize',
      'DEF_MAX_RECEIVE_BUFSIZE': 'Max Receive Bufsize',
      'maximum_queue_depth': 'Max Queue Depth',
      'MAXIMUM_QUEUE_DEPTH': 'Max Queue Depth',
      'max_retran_time': 'Max Retran Time',
      'MAX_RETRAN_TIME': 'Max Retran Time',
      'min_retran_time': 'Min Retran Time',
      'MIN_RETRAN_TIME': 'Min Retran Time',
      'roundtrip_gain': 'Roundtrip Gain',
      'ROUNDTRIP_GAIN': 'Roundtrip Gain',
      'variance_gain': 'Variance Gain',
      'VARIANCE_GAIN': 'Variance Gain',
      'variance_multiple': 'Variance Multiple',
      'VARIANCE_MULTIPLE': 'Variance Multiple',
      'default_keepalive': 'Default Keepalive',
      'DEFAULT_KEEPALIVE': 'Default Keepalive',
      'delay_ack': 'Delay ACK',
      'DELAY_ACK': 'Delay ACK',
      'restrict_low_port': 'Restrict Low Port',
      'RESTRICT_LOW_PORT': 'Restrict Low Port',
      'send_garbage': 'Send Garbage',
      'SEND_GARBAGE': 'Send Garbage',
      'tcp_timestamp': 'TCP Timestamp',
      'TCP_TIMESTAMP': 'TCP Timestamp',
      'ttls': 'TTLS',
      'TTLS': 'TTLS',
      'finwait2time': 'Finwait2 Time',
      'FINWAIT2TIME': 'Finwait2 Time',
      'system_name': 'System Name',
      'SYSTEM_NAME': 'System Name',
      'created_at': 'Created At',
      'CREATED_AT': 'Created At',
      'updated_at': 'Updated At',
      'UPDATED_AT': 'Updated At'
    },
    tcpcons: {
      'foreign_ip_address': 'Foreign IP',
      'FOREIGN_IP_ADDRESS': 'Foreign IP',
      'remote_port': 'Remote Port',
      'REMOTE_PORT': 'Remote Port',
      'local_port': 'Local Port',
      'LOCAL_PORT': 'Local Port',
      'application_name': 'Application',
      'APPLICATION_NAME': 'Application',
      'type_of_open': 'Type of Open',
      'TYPE_OF_OPEN': 'Type of Open',
      'interval_bytes_in': 'Bytes In',
      'INTERVAL_BYTES_IN': 'Bytes In',
      'interval_bytes_out': 'Bytes Out',
      'INTERVAL_BYTES_OUT': 'Bytes Out',
      'connection_status': 'Connection Status',
      'CONNECTION_STATUS': 'Connection Status',
      'remote_host_name': 'Remote Host',
      'REMOTE_HOST_NAME': 'Remote Host',
      'system_name': 'System Name',
      'SYSTEM_NAME': 'System Name',
      'created_at': 'Created At',
      'CREATED_AT': 'Created At',
      'updated_at': 'Updated At',
      'UPDATED_AT': 'Updated At'
    },
    actcons: {
      'foreign_ip_address': 'Foreign IP',
      'FOREIGN_IP_ADDRESS': 'Foreign IP',
      'remote_port': 'Remote Port',
      'REMOTE_PORT': 'Remote Port',
      'local_ip_address': 'Local IP',
      'LOCAL_IP_ADDRESS': 'Local IP',
      'local_port': 'Local Port',
      'LOCAL_PORT': 'Local Port',
      'application_name': 'Application',
      'APPLICATION_NAME': 'Application',
      'type_of_open': 'Type of Open',
      'TYPE_OF_OPEN': 'Type of Open',
      'interval_bytes_in': 'Bytes In',
      'INTERVAL_BYTES_IN': 'Bytes In',
      'interval_bytes_out': 'Bytes Out',
      'INTERVAL_BYTES_OUT': 'Bytes Out',
      'connection_status': 'Connection Status',
      'CONNECTION_STATUS': 'Connection Status',
      'remote_host_name': 'Remote Host',
      'REMOTE_HOST_NAME': 'Remote Host',
      'system_name': 'System Name',
      'SYSTEM_NAME': 'System Name',
      'created_at': 'Created At',
      'CREATED_AT': 'Created At',
      'updated_at': 'Updated At',
      'UPDATED_AT': 'Updated At'
    },
    vtmbuff: {
      'system_name': 'System',
      'SYSTEM_NAME': 'System',
      'iobuf_size': 'IOBuf Size',
      'IOBUF_SIZE': 'IOBuf Size',
      'iobuf_times_expanded': 'IOBuf Times Expanded',
      'IOBUF_TIMES_EXPANDED': 'IOBuf Times Expanded',
      'lpbuf_size': 'LPBuf Size',
      'LPBUF_SIZE': 'LPBuf Size',
      'lpbuf_times_expanded': 'LPBuf Times Expanded',
      'LPBUF_TIMES_EXPANDED': 'LPBuf Times Expanded',
      'lfbuf_size': 'LFBuf Size',
      'LFBUF_SIZE': 'LFBuf Size',
      'lfbuf_times_expanded': 'LFBuf Times Expanded',
      'LFBUF_TIMES_EXPANDED': 'LFBuf Times Expanded',
      'record_timestamp': 'Timestamp',
      'RECORD_TIMESTAMP': 'Timestamp',
      'timestamp': 'Timestamp'
    },
    connsrpz: {
      'foreign_ip_address': 'Foreign IP',
      'FOREIGN_IP_ADDRESS': 'Foreign IP',
      'active_conns': 'Active Conns',
      'ACTIVE_CONNS': 'Active Conns',
      'average_rtt_ms': 'Avg RTT (ms)',
      'AVERAGE_RTT_MS': 'Avg RTT (ms)',
      'max_rtt_ms': 'Max RTT (ms)',
      'MAX_RTT_MS': 'Max RTT (ms)',
      'interval_bytes_in_sum': 'Bytes In',
      'INTERVAL_BYTES_IN_SUM': 'Bytes In',
      'interval_bytes_out_sum': 'Bytes Out',
      'INTERVAL_BYTES_OUT_SUM': 'Bytes Out',
      'stack_name': 'Stack',
      'STACK_NAME': 'Stack',
      'remote_host_name': 'Remote Host',
      'REMOTE_HOST_NAME': 'Remote Host',
      'record_timestamp': 'Timestamp',
      'RECORD_TIMESTAMP': 'Timestamp',
      'timestamp': 'Timestamp'
    },
    udpconf: {
      'job_name': 'Job Name',
      'JOB_NAME': 'Job Name',
      'stack_name': 'Stack Name',
      'STACK_NAME': 'Stack Name',
      'def_recv_bufsize': 'Def Recv Bufsize',
      'DEF_RECV_BUFSIZE': 'Def Recv Bufsize',
      'def_send_bufsize': 'Def Send Bufsize',
      'DEF_SEND_BUFSIZE': 'Def Send Bufsize',
      'check_summing': 'Check Summing',
      'CHECK_SUMMING': 'Check Summing',
      'restrict_low_port': 'Restrict Low Port',
      'RESTRICT_LOW_PORT': 'Restrict Low Port',
      'udp_queue_limit': 'UDP Queue Limit',
      'UDP_QUEUE_LIMIT': 'UDP Queue Limit',
      'system_name': 'System Name',
      'SYSTEM_NAME': 'System Name',
      'created_at': 'Created At',
      'CREATED_AT': 'Created At',
      'updated_at': 'Updated At',
      'UPDATED_AT': 'Updated At'
    }
  }

  // Network Dataset display label fonksiyonu (genel)
  const getNetworkDisplayLabelLocal = (datasetKey) => (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const mapping = networkColumnMapping[datasetKey]
    if (mapping && mapping[key]) return mapping[key]
    if (mapping && mapping[key.toUpperCase()]) return mapping[key.toUpperCase()]
    if (mapping && mapping[key.toLowerCase()]) return mapping[key.toLowerCase()]
    // Fallback: normalize and title case
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Storage Dataset display label fonksiyonu (genel)
  const getStorageDisplayLabelLocal = (datasetKey) => (rawKey) => {
    const key = String(rawKey || '').trim(); if (!key) return ''
    const mapping = storageColumnMapping[datasetKey]
    if (mapping && mapping[key]) return mapping[key]
    if (mapping && mapping[key.toUpperCase()]) return mapping[key.toUpperCase()]
    if (mapping && mapping[key.toLowerCase()]) return mapping[key.toLowerCase()]
    // Fallback: normalize and title case
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Dataset metadata (aliases + API hooks + popular columns)
  const datasetConfigs = {
    stacks: {
      title: 'Network Stacks',
      aliases: ['stacks', 'stack', 'tcpip stack', 'tcp/ip stack', 'ip stack'],
      primaryAliases: ['stacks', 'stack'],
      fetch: databaseAPI.getMainviewNetworkStacks,
      check: databaseAPI.checkTableExistsStacks,
      staticColumns: ['jobnam8', 'stepnam8', 'jtarget', 'asid8', 'mvslvlx8', 'ver_rel', 'startc8', 'ipaddrc8', 'status18'],
      getDisplayLabel: getNetworkDisplayLabelLocal('stacks')
    },
    stackcpu: {
      title: 'Network StackCPU',
      aliases: ['stackcpu', 'stack cpu', 'tcpip cpu', 'stack cpu usage'],
      primaryAliases: ['stackcpu'],
      fetch: databaseAPI.getMainviewNetworkStackCPU,
      check: databaseAPI.checkTableExistsStackCPU,
      staticColumns: ['statstks', 'ippktrcd', 'ippktrtr', 'ipoutred', 'ipoutrtr'],
      getDisplayLabel: getNetworkDisplayLabelLocal('stackcpu')
    },
    vtamcsa: {
      title: 'Network VTAMCSA',
      aliases: ['vtamcsa', 'vtam csa', 'csa vtam'],
      primaryAliases: ['vtamcsa'],
      fetch: databaseAPI.getMainviewNetworkVtamcsa,
      check: databaseAPI.checkTableExistsVtamcsa,
      staticColumns: ['csacur', 'csamax', 'csalim', 'csausage', 'c24cur', 'c24max', 'vtmcur', 'vtmmax'],
      getDisplayLabel: getNetworkDisplayLabelLocal('vtamcsa')
    },
    tcpconf: {
      title: 'Network TCPCONF',
      aliases: ['tcpconf', 'tcp conf', 'tcp configuration', 'tcp ayar', 'tcp config'],
      primaryAliases: ['tcpconf'],
      fetch: databaseAPI.getMainviewNetworkTcpconf,
      check: databaseAPI.checkTableExiststcpconf,
      staticColumns: ['job_name', 'stack_name', 'def_receive_bufsize', 'def_send_bufsize', 'def_max_receive_bufsize', 'maximum_queue_depth', 'default_keepalive', 'delay_ack', 'finwait2time', 'ttls'],
      getDisplayLabel: getNetworkDisplayLabelLocal('tcpconf')
    },
    tcpcons: {
      title: 'Network TCPCONS',
      aliases: ['tcpcons', 'tcp cons', 'tcp connections', 'tcp bağlantı', 'connections'],
      primaryAliases: ['tcpcons'],
      fetch: databaseAPI.getMainviewNetworktcpcons,
      check: databaseAPI.checkTableExiststcpcons,
      staticColumns: ['foreign_ip_address', 'remote_port', 'local_port', 'application_name', 'type_of_open', 'interval_bytes_in', 'interval_bytes_out', 'connection_status', 'remote_host_name', 'system_name'],
      getDisplayLabel: getNetworkDisplayLabelLocal('tcpcons')
    },
    udpconf: {
      title: 'Network UDPCONF',
      aliases: ['udpconf', 'udp conf', 'udp configuration', 'udp ayar'],
      primaryAliases: ['udpconf'],
      fetch: databaseAPI.getMainviewNetworkUdpconf,
      check: databaseAPI.checkTableExistsudpconf,
      staticColumns: ['job_name', 'stack_name', 'def_recv_bufsize', 'def_send_bufsize', 'check_summing', 'restrict_low_port', 'udp_queue_limit'],
      getDisplayLabel: getNetworkDisplayLabelLocal('udpconf')
    },
    actcons: {
      title: 'Network ACTCONS',
      aliases: ['actcons', 'act cons', 'active connections', 'aktif bağlantı'],
      primaryAliases: ['actcons'],
      fetch: databaseAPI.getMainviewNetworkactcons,
      check: databaseAPI.checkTableExistsactcons,
      staticColumns: ['foreign_ip_address', 'remote_port', 'local_ip_address', 'local_port', 'application_name', 'type_of_open', 'interval_bytes_in', 'interval_bytes_out', 'connection_status', 'remote_host_name', 'system_name'],
      getDisplayLabel: getNetworkDisplayLabelLocal('actcons')
    },
    vtmbuff: {
      title: 'Network VTMBUFF',
      aliases: ['vtmbuff', 'vtm buff'],
      primaryAliases: ['vtmbuff'],
      fetch: databaseAPI.getMainviewNetworkVtmbuff,
      check: databaseAPI.checkTableExistsVtmbuff,
      staticColumns: ['system_name', 'iobuf_size', 'iobuf_times_expanded', 'lpbuf_size', 'lpbuf_times_expanded', 'lfbuf_size', 'lfbuf_times_expanded'],
      getDisplayLabel: getNetworkDisplayLabelLocal('vtmbuff')
    },
    tcpstor: {
      title: 'Network TCPSTOR',
      aliases: ['tcpstor', 'tcp stor', 'tcp storage'],
      primaryAliases: ['tcpstor'],
      fetch: databaseAPI.getMainviewNetworkTcpstor,
      check: databaseAPI.checkTableExistsTcpstor,
      staticColumns: ['step_name', 'system_name', 'ecsa_current', 'ecsa_max', 'ecsa_limit', 'ecsa_free', 'private_current', 'private_max'],
      getDisplayLabel: getNetworkDisplayLabelLocal('tcpstor')
    },
    connsrpz: {
      title: 'Network CONNSRPZ',
      aliases: ['connsrpz', 'conn srpz', 'connsprz'],
      primaryAliases: ['connsrpz'],
      fetch: databaseAPI.getMainviewNetworkConnsrpz,
      check: databaseAPI.checkTableExistsConnsrpz,
      staticColumns: ['foreign_ip_address', 'active_conns', 'average_rtt_ms', 'max_rtt_ms', 'interval_bytes_in_sum', 'interval_bytes_out_sum', 'stack_name', 'remote_host_name'],
      getDisplayLabel: getNetworkDisplayLabelLocal('connsrpz')
    },
    // MQ Datasets
    qm: {
      title: 'MQ QM',
      aliases: ['qm', 'mq', 'queue manager', 'message queue'],
      primaryAliases: ['qm', 'mq'],
      fetch: databaseAPI.getMainviewMQQm,
      check: databaseAPI.checkTableExistsMQQm,
      staticColumns: [],
      getDisplayLabel: getQmDisplayLabelLocal,
      parseQuery: parseMqQuery
    },
    connz: {
      title: 'MQ CONNZ',
      aliases: ['connz', 'mq connz'],
      primaryAliases: ['connz'],
      fetch: databaseAPI.getMainviewMQConnz,
      check: databaseAPI.checkTableExistsMQConnz,
      staticColumns: ['Application Name', 'Type Of Information (Hex)', 'Address Space Identifier', 'Application Type(Maximum)', 'CICS Transaction Id', 'CICS Task number', 'IMS PSB Name', 'Object Name(Maximum)', 'Queue Manager'],
      getDisplayLabel: getConnzDisplayLabelLocal,
      parseQuery: parseConnzQuery
    },
    w2over: {
      title: 'MQ W2OVER',
      aliases: ['w2over', 'w2 over', 'mq w2over'],
      primaryAliases: ['w2over'],
      fetch: databaseAPI.getMainviewMQW2over,
      check: databaseAPI.checkTableExistsMQW2over,
      staticColumns: ['Channels Retrying', 'Local Queues at Max Depth High', 'Transmit Queues at Max Depth High', 'Dead-Letter Message Count', 'Queue Manager Events', 'Queue Manager Status', 'Free Pages in Page Set 0', 'Event Listener Status', 'Command Server Status'],
      getDisplayLabel: getW2overDisplayLabelLocal,
      parseQuery: parseW2overQuery
    },
    // ZOS System Datasets
    mvsSysover: {
      title: 'CPU',
      aliases: ['cpu', 'cpu performans ve kullanım', 'cpu performans', 'cpu kullanım', 'cpu kullanımı', 'mvs sysover', 'sysover', 'mvs', 'sysover data', 'system overview'],
      primaryAliases: ['cpu', 'cpu performans ve kullanım'],
      fetch: databaseAPI.getMainviewMvsSysover,
      check: databaseAPI.checkTableExists,
      staticColumns: ['syxsysn', 'succpub', 'sucziib', 'scicpavg', 'suciinrt', 'suklqior', 'sukadbpc', 'csrecspu', 'csreecpu', 'csresqpu', 'csreespu', 'bmctime', 'time'],
      getDisplayLabel: getZosDisplayLabelLocal('cpu')
    },
    jespool: {
      title: 'Spool',
      aliases: ['spool', 'iş kuyruğu yönetimi', 'iş kuyruğu', 'kuyruk yönetimi', 'jespool', 'jesp', 'jes pool', 'job entry subsystem', 'job queue'],
      primaryAliases: ['spool', 'iş kuyruğu yönetimi'],
      fetch: databaseAPI.getMainviewMvsJespool,
      check: databaseAPI.checkTableExistsJespool,
      staticColumns: ['total_volumes', 'total_files', 'total_tracks', 'total_cylinders', 'bmctime', 'time'],
      getDisplayLabel: getZosDisplayLabelLocal('jespool')
    },
    jcpu: {
      title: 'Address Space',
      aliases: ['address space', 'adres alanı yönetimi', 'adres alanı', 'adres alani', 'adres alanı', 'jcpu', 'j cpu', 'addressspace', 'address space data'],
      primaryAliases: ['address space', 'adres alanı yönetimi'],
      fetch: databaseAPI.getMainviewMvsJCPU,
      check: databaseAPI.checkTableExistsJCPU,
      staticColumns: ['jobname', 'jes_job_number', 'address_space_type', 'service_class_name', 'asgrnmc', 'job_step_being_monitored', 'all_cpu_seconds', 'unadj_cpu_util_with_all_enclaves', 'using_cpu_percentage', 'cpu_delay_percentage', 'average_priority', 'tcb_time', 'percentage_srb_time', 'interval_unadj_remote_enclave_cpu_use', 'job_total_cpu_time', 'other_address_space_enclave_cpu_time', 'ziip_total_cpu_time', 'ziip_interval_cpu_time', 'dependent_enclave_ziip_total_time', 'dependent_enclave_ziip_interval_time', 'dependent_enclave_ziip_on_cp_total', 'interval_cp_time', 'resource_group_name', 'resource_group_type', 'recovery_process_boost', 'implicit_cpu_critical_flag', 'bmctime', 'time'],
      getDisplayLabel: getZosDisplayLabelLocal('jcpu')
    },
    // RMF Datasets
    rmf_pgspp: {
      title: 'RMF PGSPP',
      aliases: ['rmf pgspp', 'pgspp', 'page space performance', 'page space', 'rmf page space'],
      primaryAliases: ['rmf pgspp', 'pgspp'],
      fetch: databaseAPI.getMainviewRmfPgspp,
      check: databaseAPI.checkTableExistsRmfPgspp,
      staticColumns: ['id', 'pdgnum', 'pdgtypc', 'pdgser', 'pdredevc', 'pdgstat', 'pdislupc', 'pdipxtav', 'pdipiort', 'pdippbav', 'pdgvioc', 'pdibsypc', 'pdgdsn', 'timestamp'],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_pgspp')
    },
    rmf_ard: {
      title: 'RMF ARD',
      aliases: ['rmf ard', 'ard', 'application response data', 'application response', 'rmf application'],
      primaryAliases: ['rmf ard', 'ard'],
      fetch: databaseAPI.getMainviewRmfArd,
      check: databaseAPI.checkTableExistsRmfArd,
      staticColumns: ['jobname', 'device_connection_time_seconds', 'current_fixed_frames_16m', 'current_fixed_frame_count', 'cross_memory_register', 'session_srm_service_absorption_rate', 'session_cpu_seconds_tcb_mode', 'cpu_seconds', 'excp_rate_per_second', 'swap_page_rate_per_second', 'interval_lpa_page_rate', 'interval_csa_page_in_rate', 'realtime_non_vio_page_rate', 'private_vio_hiperspace_page_rate'],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_ard')
    },
    rmf_trx: {
      title: 'RMF TRX',
      aliases: ['rmf trx', 'trx', 'transaction performance', 'transaction', 'rmf transaction'],
      primaryAliases: ['rmf trx', 'trx'],
      fetch: databaseAPI.getMainviewRmfTrx,
      check: databaseAPI.checkTableExistsRmfTrx,
      staticColumns: ['mxgcnm', 'mxgcpn', 'mxgtypc', 'mxiasac', 'mxixavg', 'mxirate', 'mxircp', 'bmctime', 'time'],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_trx')
    },
    rmf_asrm: {
      title: 'RMF ASRM',
      aliases: ['rmf asrm', 'asrm', 'address space resource', 'address space resource management', 'rmf resource'],
      primaryAliases: ['rmf asrm', 'asrm'],
      fetch: databaseAPI.getMainviewRmfAsrm,
      check: databaseAPI.checkTableExistsRmfAsrm,
      staticColumns: ['asgname', 'asgcnmc', 'asgpgp', 'assactm', 'asgrtm', 'asstrc', 'assjsw', 'assscsck', 'assmsock', 'assiock', 'asssrsck', 'asswmck'],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_asrm')
    },
    rmf_srcs: {
      title: 'RMF SRCS',
      aliases: ['rmf srcs', 'srcs', 'system resource data', 'system resource', 'rmf system resource'],
      primaryAliases: ['rmf srcs', 'srcs'],
      fetch: databaseAPI.getMainviewRmfSrcs,
      check: databaseAPI.checkTableExistsRmfSrcs,
      staticColumns: ['splafcav', 'spluicav', 'splstfav', 'spllpfav', 'spllffav', 'splcpfav', 'splclfav', 'splrffav', 'splqpcav', 'splqpeav', 'sclinav', 'scllotav', 'sclotrav', 'sclotwav'],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_srcs')
    },
    rmf_asd: {
      title: 'RMF ASD',
      aliases: ['rmf asd', 'asd', 'address space data', 'address space dataset', 'rmf address space'],
      primaryAliases: ['rmf asd', 'asd'],
      fetch: databaseAPI.getMainviewRmfAsd,
      check: databaseAPI.checkTableExistsRmfAsd,
      staticColumns: [],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_asd')
    },
    rmf_spag: {
      title: 'RMF SPAG',
      aliases: ['rmf spag', 'spag', 'storage paging data', 'storage paging', 'paging data', 'rmf paging'],
      primaryAliases: ['rmf spag', 'spag'],
      fetch: databaseAPI.getMainviewRmfSpag,
      check: databaseAPI.checkTableExistsRmfSpag,
      staticColumns: ['spllnirt', 'splcinrt', 'splcotrt', 'ssltswrt', 'splsinrt', 'splsotrt', 'splppirt', 'splpport', 'splhvprt', 'splctwav', 'splafcav', 'spluicav', 'splpesrt', 'splmgaav', 'splesfav', 'splpeart'],
      getDisplayLabel: getRmfDisplayLabelLocal('rmf_spag')
    },
    // CMF Datasets
    cmf_dspcz: {
      title: 'CMF DSPCZ',
      aliases: ['cmf dspcz', 'dspcz', 'data space cache', 'data space', 'cmf data space'],
      primaryAliases: ['cmf dspcz', 'dspcz'],
      fetch: databaseAPI.getMainviewCmfDspcz,
      check: databaseAPI.checkTableExistsCmfDspcz,
      staticColumns: ['onam', 'dspname', 'asid', 'key', 'typx', 'scox', 'refx', 'prox', 'csiz', 'csizavg', 'msiz', 'msizavg'],
      getDisplayLabel: getRmfDisplayLabelLocal('cmf_dspcz')
    },
    cmf_xcfsys: {
      title: 'CMF XCFSYS',
      aliases: ['cmf xcfsys', 'xcfsys', 'cross system coupling', 'xcf system', 'cmf xcf'],
      primaryAliases: ['cmf xcfsys', 'xcfsys'],
      fetch: databaseAPI.getMainviewCmfXcfsys,
      check: databaseAPI.checkTableExistsCmfXcfsys,
      staticColumns: ['from_system', 'to_system', 'transport_class', 'total_messages', 'percent_messages_big', 'percent_messages_fit', 'percent_messages_small', 'no_paths_count', 'no_buffers_count', 'percent_messages_degraded', 'avg_used_message_blocks', 'max_message', 'percent_system_buffers_used', 'max_message_blocks', 'path_direction'],
      getDisplayLabel: getRmfDisplayLabelLocal('cmf_xcfsys')
    },
    cmf_jcsa: {
      title: 'CMF JCSA',
      aliases: ['cmf jcsa', 'jcsa', 'job control storage', 'job control', 'cmf job'],
      primaryAliases: ['cmf jcsa', 'jcsa'],
      fetch: databaseAPI.getMainviewCmfJcsa,
      check: databaseAPI.checkTableExistsCmfJcsa,
      staticColumns: ['jobname', 'jes_id', 'asid', 'csa_in_use_percent', 'ecsa_in_use_percent', 'sqa_in_use_percent', 'esqa_in_use_percent', 'csa_in_use', 'ecsa_in_use', 'sqa_in_use', 'esqa_in_use', 'total_used_common_storage', 'total_used_percent'],
      getDisplayLabel: getRmfDisplayLabelLocal('cmf_jcsa')
    },
    cmf_xcfmbr: {
      title: 'CMF XCFMBR',
      aliases: ['cmf xcfmbr', 'xcfmbr', 'xcf member', 'cmf xcf member'],
      primaryAliases: ['cmf xcfmbr', 'xcfmbr'],
      fetch: databaseAPI.getMainviewCmfXcfmbr,
      check: databaseAPI.checkTableExistsCmfXcfmbr,
      staticColumns: [],
      getDisplayLabel: getRmfDisplayLabelLocal('cmf_xcfmbr')
    },
    cmf_syscpc: {
      title: 'CMF SYSCPC',
      aliases: ['cmf syscpc', 'syscpc', 'system cpc', 'cpc capacity', 'cmf cpc'],
      primaryAliases: ['cmf syscpc', 'syscpc'],
      fetch: databaseAPI.getMainviewCmfSyscpc,
      check: databaseAPI.checkTableExistsCmfSyscpc,
      staticColumns: ['smf_id', 'system_name', 'hardware_name', 'cpu_model', 'cpc_capacity', 'base_cpc_capacity', 'capacity_on_demand'],
      getDisplayLabel: getRmfDisplayLabelLocal('cmf_syscpc')
    },
    // Storage Datasets
    csasum: {
      title: 'Storage CSASUM',
      aliases: ['storage csasum', 'csasum', 'common storage area summary', 'common storage', 'csa summary', 'storage csa'],
      primaryAliases: ['storage csasum', 'csasum'],
      fetch: databaseAPI.getMainviewStorageCsasum,
      check: databaseAPI.checkTableExistsCsasum,
      staticColumns: ['csa_in_use_percent', 'ecsa_in_use_percent', 'rucsa_in_use_percent', 'sqa_in_use_percent', 'total_cs_used_percent', 'percent_used_high_shared_storage', 'timestamp', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('csasum')
    },
    frminfo_center: {
      title: 'Storage FRMINFO Central',
      aliases: ['storage frminfo central', 'frminfo center', 'frminfo central', 'frame information central', 'frame central', 'storage central'],
      primaryAliases: ['storage frminfo central', 'frminfo central'],
      fetch: databaseAPI.getMainviewStorageFrminfoCenter,
      check: databaseAPI.checkTableExistsFrminfoCenter,
      staticColumns: ['spispcav', 'spispcmn', 'spispcmx', 'spilpfav', 'spilpfmn', 'spilpfmx', 'spicpfav', 'spicpfmn', 'spicpfmx', 'spiqpcav', 'spiqpcmn', 'spiqpcmx', 'spiapfav', 'spiapfmn', 'spiapfmx', 'spiafcav', 'spiafcmn', 'spitfuav', 'spiafumn', 'spiafumx', 'spitcpct', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('frminfo_center')
    },
    frminfo_fixed: {
      title: 'Storage FRMINFO Fixed',
      aliases: ['storage frminfo fixed', 'frminfo fixed', 'frame information fixed', 'frame fixed', 'storage fixed'],
      primaryAliases: ['storage frminfo fixed', 'frminfo fixed'],
      fetch: databaseAPI.getMainviewStorageFrminfofixed,
      check: databaseAPI.checkTableExistsFrminfofixed,
      staticColumns: ['sqa_avg', 'sqa_min', 'sqa_max', 'lpa_avg', 'lpa_min', 'lpa_max', 'csa_avg', 'lsqa_avg', 'lsqa_min', 'lsqa_max', 'private_avg', 'private_min', 'private_max', 'fixed_below_16m_avg', 'fixed_below_16m_min', 'fixed_below_16m_max', 'fixed_total_avg', 'fixed_total_min', 'fixed_total_max', 'fixed_percentage', 'timestamp'],
      getDisplayLabel: getStorageDisplayLabelLocal('frminfo_fixed')
    },
    frminfo_high_virtual: {
      title: 'Storage FRMINFO High Virtual',
      aliases: ['storage frminfo high virtual', 'frminfo high virtual', 'frminfo highvirtual', 'frame information high virtual', 'high virtual', 'storage high virtual'],
      primaryAliases: ['storage frminfo high virtual', 'frminfo high virtual'],
      fetch: databaseAPI.getMainviewStorageFrminfoHighVirtual,
      check: databaseAPI.checkTableExistsFrminfoHighVirtual,
      staticColumns: ['hv_common_avg', 'hv_common_min', 'hv_common_max', 'hv_shared_avg', 'hv_shared_min', 'hv_shared_max', 'timestamp', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('frminfo_high_virtual')
    },
    sysfrmiz: {
      title: 'Storage SYSFRMIZ',
      aliases: ['storage sysfrmiz', 'sysfrmiz', 'system frame information', 'system frame', 'frame information system'],
      primaryAliases: ['storage sysfrmiz', 'sysfrmiz'],
      fetch: databaseAPI.getMainviewStoragesysfrmiz,
      check: databaseAPI.checkTableExistsSysfrmiz,
      staticColumns: ['spgid', 'spiuonlf', 'spluicav', 'spifinav', 'sprefncp', 'spispcav', 'spreasrp', 'spilpfav', 'sprealpp', 'spicpfav', 'spreavpp', 'spiqpcav', 'sprelsqp', 'spiapfav', 'spreprvp', 'spiafcav', 'spreavlp', 'spihvcav', 'sprecmnp', 'spihvsav', 'spreshrp', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('sysfrmiz')
    }
  }

  const ensureColumnsLoaded = async (datasetKey) => {
    if (!datasetKey || columnsCache[datasetKey]) return
    const cfg = datasetConfigs[datasetKey]
    if (!cfg) return
    try {
      if (typeof cfg.check === 'function') {
        const resp = await cfg.check({})
        const cols = resp?.data?.tableInfo?.columns?.map?.(c => c.column_name) || []
        if (cols.length > 0) {
          setColumnsCache(prev => ({ ...prev, [datasetKey]: cols }))
          return
        }
      }
      if (Array.isArray(cfg.staticColumns) && cfg.staticColumns.length > 0) {
        setColumnsCache(prev => ({ ...prev, [datasetKey]: cfg.staticColumns }))
      }
    } catch {
      if (Array.isArray(cfg.staticColumns) && cfg.staticColumns.length > 0) {
        setColumnsCache(prev => ({ ...prev, [datasetKey]: cfg.staticColumns }))
      }
    }
  }

  // Generic table query helper for all datasets (Network + MQ + ZOS)
  const queryDataset = async (lowerMessage, fetchFunction, title, datasetKey) => {
    const listAll = LIST_ALL_KEYWORDS.some(k => lowerMessage.includes(k))
    const cfg = datasetConfigs[datasetKey]
    
    setIsLoading(true)
    setIsTyping(true)
    setMessages(prev => [...prev, { text: `${title} verisini çekiyorum...`, sender: 'bot', timestamp: getMessageTime() }])

    try {
      const response = await fetchFunction({})
      if (!response?.data?.success) {
        setMessages(prev => [...prev, { text: `${title} verisi alınamadı.`, sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }

      const rows = Array.isArray(response.data.data) ? response.data.data : []
      if (rows.length === 0) {
        setMessages(prev => [...prev, { text: `${title} için veri bulunamadı.`, sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }

      // Mesajda sadece dataset adı var mı kontrol et (kolon belirtilmemiş)
      const datasetAliases = cfg?.aliases || []
      const messageTokens = lowerMessage.trim().split(/\s+/).filter(Boolean)
      const onlyDatasetName = messageTokens.length === 1 && datasetAliases.some(alias => {
        const aliasLower = alias.toLowerCase()
        const aliasTokens = aliasLower.split(/\s+/).filter(Boolean)
        // Mesaj sadece dataset alias'ını içeriyorsa
        return messageTokens[0] === aliasTokens[0] || normalizeKey(messageTokens[0]) === normalizeKey(aliasTokens[0])
      })

      if (onlyDatasetName && !listAll) {
        await ensureColumnsLoaded(datasetKey)
        const keys = getAllKeys(rows)
        let examples = keys
        if ((!examples || examples.length === 0) && datasetKey) {
          examples = columnsCache[datasetKey] || cfg?.staticColumns || []
        }
        const message = buildDatasetInfoMessage(title, examples, datasetKey)
        setMessages(prev => [...prev, { text: message, sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }

      if (listAll) {
        const summary = buildSummary(rows, 20, datasetKey)
        setMessages(prev => [...prev, { text: `📦 ${title} - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }

      const keys = getAllKeys(rows)
      const getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
      
      // MQ ve ZOS dataset'leri için özel parse fonksiyonu varsa kullan
      let target = null
      if (cfg?.parseQuery) {
        target = cfg.parseQuery(lowerMessage)
      }
      
      // Parse query ile bulunamadıysa, genel kolon arama yap (getDisplayLabel ile)
      if (!target || !target.col) {
        const picked = pickColumnByMessage(lowerMessage, keys, getDisplayLabel)
        if (picked) {
          target = { col: picked, label: getDisplayLabel(picked) }
        }
      }

      if (!target || !target.col) {
        let examples = keys
        if ((!examples || examples.length === 0) && datasetKey) {
          await ensureColumnsLoaded(datasetKey)
          examples = columnsCache[datasetKey] || cfg?.staticColumns || []
        }
        const message = buildColumnNotFoundMessage(title, examples, datasetKey)
        setMessages(prev => [...prev, { text: message, sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }

      const picked = target.col
      const pickedLabel = target.label || getDisplayLabel(picked)
      
      const row = rows.find(r => r?.[picked] !== null && r?.[picked] !== undefined && String(r?.[picked]).trim() !== '') || rows[0]
      const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at || row?.time || row?.timestamp
      
      // MQ QM ve ZOS CPU için özel formatlama (sayısal değerler için)
      let formattedVal
      const val = Number.isFinite(Number(row?.[picked])) ? Number(row?.[picked]) : null
      if (val !== null && (cfg?.title === 'MQ QM' || cfg?.title === 'CPU')) {
        formattedVal = Math.abs(val) < 1 ? val.toFixed(4) : val.toLocaleString('tr-TR')
      } else {
        formattedVal = formatValue(row?.[picked])
      }
      
      const reply = `📦 ${title} - ${pickedLabel}\n• Değer: ${formattedVal}\n• Zaman: ${formatTrDate(ts)}`
      setMessages(prev => [...prev, { text: reply, sender: 'bot', timestamp: getMessageTime() }])
      setIsLoading(false)
      setIsTyping(false)
    } catch (err) {
      // Hata detaylarını sadece console'da tut
      console.error(`${title} query error:`, err)
      setMessages(prev => [...prev, { 
        text: 'Üzgünüm, aradığınız veri alınırken bir hata oluştu. Lütfen tekrar deneyin.', 
        sender: 'bot', 
        timestamp: getMessageTime() 
      }])
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Autocomplete suggestions
  const updateHintList = async (value) => {
    const v = String(value || '')
    const lower = v.toLowerCase()
    const tokens = lower.split(/\s+/).filter(Boolean)
    const sugs = []

    if (tokens.length <= 1) {
      // Dataset name suggestions 
      const needle = normalizeKey(lower)
      const allowIncludes = needle.length >= ALIAS_INCLUDE_MIN
      const seenKeys = new Set() // Tekrar eden dataset'leri önlemek için
      
      // Özel durum: "storage" yazıldığında tüm storage tablolarını göster
      if (lower.includes('storage') || normalizeKey(lower) === 'storage') {
        Object.entries(datasetConfigs).forEach(([key, cfg]) => {
          // Title'da "Storage" geçen tüm dataset'leri ekle
          if (cfg.title && cfg.title.toLowerCase().includes('storage')) {
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              // Primary alias'ı kullan, yoksa key'i kullan
              const insertText = cfg.primaryAliases?.[0] || key
              sugs.push({ type: 'dataset', datasetKey: key, display: cfg.title, insertText: insertText })
            }
          }
        })
      }
      
      if (needle.length > 0) {
        Object.entries(datasetConfigs).forEach(([key, cfg]) => {
          // Önce primaryAliases'i kontrol et, sonra tüm aliases'i (çok kelimeli alias'lar için)
          const primaryList = cfg.primaryAliases || []
          const allAliases = cfg.aliases || []
          // Her iki listeyi de kontrol et (primaryAliases öncelikli ama çok kelimeli alias'lar da dahil)
          // Tekrar edenleri önlemek için Set kullan
          const uniqueAliases = new Set([...primaryList, ...allAliases])
          const allLists = Array.from(uniqueAliases)
          
          let hasAliasMatch = false
          let bestMatch = null
          let bestMatchScore = 0
          
          // Eşleşen alias'ları bul ve en iyi eşleşmeyi seç
          allLists.forEach(a => {
            const an = normalizeKey(a)
            const matches = allowIncludes ? an.includes(needle) : an.startsWith(needle)
            if (matches) {
              hasAliasMatch = true
              
              // Skor hesapla: primary alias daha yüksek skor, exact match daha yüksek skor
              const isPrimary = primaryList.includes(a)
              const isExactMatch = an === needle
              const score = (isPrimary ? 100 : 50) + (isExactMatch ? 50 : 0) + an.length
              
              if (score > bestMatchScore) {
                bestMatchScore = score
                const isMultiWord = a.split(/\s+/).length > 1
                const insertText = isMultiWord ? a : key
                bestMatch = { key, display: cfg.title, insertText }
              }
            }
          })
          
          // En iyi eşleşmeyi ekle (sadece bir tane)
          if (bestMatch && !seenKeys.has(bestMatch.key)) {
            seenKeys.add(bestMatch.key)
            sugs.push({ type: 'dataset', datasetKey: bestMatch.key, display: bestMatch.display, insertText: bestMatch.insertText })
          }
          
          // Eğer alias'ta eşleşme yoksa, title'da ara (örn: "Network" -> "Network Stacks", "Network TCPCONF")
          if (!hasAliasMatch && cfg.title) {
            const titleNormalized = normalizeKey(cfg.title)
            const titleMatches = allowIncludes ? titleNormalized.includes(needle) : titleNormalized.startsWith(needle)
            if (titleMatches && !seenKeys.has(key)) {
              seenKeys.add(key)
              sugs.push({ type: 'dataset', datasetKey: key, display: cfg.title, insertText: key })
            }
          }
        })
      }
    }

    // Column suggestions when a dataset token is present
    let matchedDatasetKey = null
    outer: for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const a of cfg.aliases) {
        // Accept variations like "tcpcons u", "tcpcons'", etc.
        if (lower.includes(a)) { matchedDatasetKey = key; break outer }
      }
    }

    if (matchedDatasetKey) {
      await ensureColumnsLoaded(matchedDatasetKey)
      const cols = columnsCache[matchedDatasetKey] || datasetConfigs[matchedDatasetKey].staticColumns || []
      const lastToken = tokens[tokens.length - 1] || ''
      const cfg = datasetConfigs[matchedDatasetKey]
      const getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
      
      cols
        .filter(c => c && c.toLowerCase().includes(lastToken))
        .slice(0, 10)
        .forEach(c => {
          // TÜM dataset'ler için getDisplayLabel fonksiyonunu kullan (web uygulamasındaki kolon isimleriyle birebir aynı olması için)
          const displayName = getDisplayLabel(c)
          // insertText'te de display label kullan (web'deki gibi görünsün)
          sugs.push({ type: 'column', datasetKey: matchedDatasetKey, display: displayName, insertText: `${matchedDatasetKey} ${displayName}` })
        })
    }

    // If no dataset matched, still suggest global columns
    if (!matchedDatasetKey) {
      const lastToken = tokens[tokens.length - 1] || ''
      const all = []
      for (const [k, cfg] of Object.entries(datasetConfigs)) {
        const cols = (columnsCache[k] || cfg.staticColumns || []).slice(0, 20)
        cols.forEach(c => all.push({ datasetKey: k, column: c }))
      }
      
      all
        .filter(it => it.column && it.column.toLowerCase().includes(lastToken) && lastToken.length >= COLUMN_SUGGEST_MIN)
        .slice(0, SUGGESTION_LIMIT)
        .forEach(it => {
          // TÜM dataset'ler için getDisplayLabel fonksiyonunu kullan (web uygulamasındaki kolon isimleriyle birebir aynı olması için)
          const cfg = datasetConfigs[it.datasetKey]
          const getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
          const displayName = getDisplayLabel(it.column)
          // insertText'te de display label kullan (web'deki gibi görünsün)
          sugs.push({ type: 'column', datasetKey: it.datasetKey, display: displayName, insertText: `${it.datasetKey} ${displayName}` })
        })
    }

    // keep panel compact
    const limited = sugs.slice(0, SUGGESTION_LIMIT)
    setSuggestions(limited)
    if (!userClosedSuggestions) setShowSuggestions(limited.length > 0)
    setSelectedSuggestionIndex(limited.length > 0 ? 0 : -1)
  }

  const applySuggestion = (sug) => {
    if (!sug) return
    setInputMessage(sug.insertText + (sug.type === 'dataset' ? ' ' : ''))
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  // Try to infer dataset from a column name when user doesn't type dataset
  const guessDatasetByColumn = async (lowerMessage) => {
    try {
      const msgNorm = normalizeKey(lowerMessage)
      const candidates = []
      for (const [key, cfg] of Object.entries(datasetConfigs)) {
        try {
          await ensureColumnsLoaded(key)
          const cols = columnsCache[key] || cfg.staticColumns || []
          const hit = cols.some(c => msgNorm.includes(normalizeKey(c)))
          if (hit) candidates.push(key)
        } catch (err) {
          // Bir dataset'te hata olursa diğerlerine devam et
          console.error(`Error loading columns for ${key} in guessDatasetByColumn:`, err)
        }
      }
      if (candidates.length === 1) return candidates[0]
      return null
    } catch (err) {
      console.error('Error in guessDatasetByColumn:', err)
      return null
    }
  }

  const findDatasetsByColumn = async (rawTerm) => {
    const term = normalizeKey(rawTerm)
    const results = []
    if (!term) return results
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      try {
        await ensureColumnsLoaded(key)
        const cols = columnsCache[key] || cfg.staticColumns || []
        const getDisplayLabel = cfg?.getDisplayLabel || ((k) => k)
        
        for (const c of cols) {
          // Hem raw column name hem de display label'da ara
          const rawMatch = normalizeKey(c).includes(term)
          const displayLabel = getDisplayLabel(c)
          const displayMatch = normalizeKey(displayLabel).includes(term)
          
          if (rawMatch || displayMatch) {
            results.push({ datasetKey: key, title: cfg.title, column: c, displayLabel: displayLabel })
            break
          }
        }
      } catch (err) {
        // Bir dataset'te hata olursa diğerlerine devam et
        console.error(`Error loading columns for ${key}:`, err)
      }
    }
    return results
  }

  // Benzer dataset'leri bulan fonksiyon (fuzzy matching)
  const findSimilarDatasets = async (lowerMessage) => {
    const results = []
    const messageNormalized = normalizeKey(lowerMessage)
    const messageWords = lowerMessage.split(/\s+/).filter(Boolean)
    
    try {
      for (const [key, cfg] of Object.entries(datasetConfigs)) {
        let score = 0
        
        // Title'da arama
        const titleNormalized = normalizeKey(cfg.title)
        if (titleNormalized.includes(messageNormalized) || messageNormalized.includes(titleNormalized)) {
          score += 10
        }
        
        // Alias'larda arama
        for (const alias of cfg.aliases || []) {
          const aliasNormalized = normalizeKey(alias.toLowerCase())
          if (aliasNormalized.includes(messageNormalized) || messageNormalized.includes(aliasNormalized)) {
            score += 8
            break
          }
        }
        
        // Kolonlarda arama (display label ile)
        try {
          await ensureColumnsLoaded(key)
          const cols = columnsCache[key] || cfg.staticColumns || []
          const getDisplayLabel = cfg?.getDisplayLabel || ((k) => k)
          
          for (const c of cols) {
            const displayLabel = getDisplayLabel(c)
            const displayNormalized = normalizeKey(displayLabel)
            if (displayNormalized.includes(messageNormalized) || messageNormalized.includes(displayNormalized)) {
              score += 5
              break
            }
          }
        } catch (err) {
          // Kolon yükleme hatası olursa devam et
        }
        
        // Mesajdaki kelimelerin dataset title veya alias'larda geçmesi
        for (const word of messageWords) {
          const wordNormalized = normalizeKey(word)
          if (wordNormalized.length >= 3 && (titleNormalized.includes(wordNormalized) || cfg.aliases?.some(a => normalizeKey(a.toLowerCase()).includes(wordNormalized)))) {
            score += 3
          }
        }
        
        if (score > 0) {
          results.push({ key, title: cfg.title, score, primaryAlias: cfg.primaryAliases?.[0] || key })
        }
      }
      
      // Score'a göre sırala ve en yüksek 5'ini döndür
      results.sort((a, b) => b.score - a.score)
      return results.slice(0, 5)
    } catch (err) {
      console.error('Error finding similar datasets:', err)
      return []
    }
  }

  // Export utilities (command-based) - MQPage.jsx ile uyumlu, XLSX formatında
  const exportRowsToCSV = (rows, title, datasetKey = null) => {
    const dataRows = Array.isArray(rows) ? rows : []
    if (dataRows.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı')
      return
    }

    try {
      let rawHeaders = Object.keys(dataRows[0] || {})
      // Index kolonunu çıkar
      rawHeaders = rawHeaders.filter(h => h !== 'index')

      // Display label kullan (eğer varsa)
      let displayHeaders = rawHeaders
      if (datasetKey && datasetConfigs[datasetKey]?.getDisplayLabel) {
        const getDisplayLabel = datasetConfigs[datasetKey].getDisplayLabel
        displayHeaders = rawHeaders.map(h => getDisplayLabel(h) || h)
      } else {
        // Varsayılan: underscore'ları boşlukla değiştir, her kelimenin ilk harfini büyük yap
        displayHeaders = rawHeaders.map(h => h.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      }

      // XLSX kütüphanesini dinamik yükle
      const loadXlsx = () => new Promise((resolve, reject) => {
        if (window.XLSX) {
          resolve(window.XLSX)
          return
        }
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
        script.onload = () => resolve(window.XLSX)
        script.onerror = () => reject(new Error('XLSX yüklenemedi'))
        document.head.appendChild(script)
      })

      // Tarih formatı için yardımcı
      const now = new Date()
      const two = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${two(now.getMonth()+1)}-${two(now.getDate())}`

      loadXlsx().then((XLSX) => {
        try {
          // AOA (Array of Arrays) verisi: başlık + satırlar (her başlık ayrı hücrede)
          const aoa = [
            displayHeaders, // Her başlık ayrı dizi elemanı olarak (ayrı hücreler)
            ...dataRows.map(row => rawHeaders.map(h => {
              const v = row[h]
              if (v === null || v === undefined) return ''
              // Tarih stringlerini Date'e çevir (Excel tarih olarak algılar)
              if (typeof v === 'string' && v.match(/\d{4}-\d{2}-\d{2}/)) {
                const d = new Date(v)
                return isNaN(d.getTime()) ? v : d
              }
              return v
            }))
          ]

          const wb = XLSX.utils.book_new()
          const ws = XLSX.utils.aoa_to_sheet(aoa)

          // Kolon genişliklerini içeriğe göre hesapla (MQPage.jsx'deki gibi)
          const maxCols = rawHeaders.length
          const colWidths = Array.from({ length: maxCols }, (_, c) => {
            let maxLen = String(displayHeaders[c] || '').length
            for (let r = 1; r < aoa.length; r++) {
              const cell = aoa[r][c]
              const len = cell instanceof Date ? 19 : String(cell ?? '').length
              if (len > maxLen) maxLen = len
            }
            const wch = Math.min(60, Math.max(12, maxLen + 2))
            return { wch }
          })
          ws['!cols'] = colWidths

          XLSX.utils.book_append_sheet(wb, ws, (title || 'Export').slice(0, 31))
          const safeName = (title || 'dataset').replace(/[^a-zA-Z0-9_]/g, '_')
          XLSX.writeFile(wb, `${safeName}_${stamp}.xlsx`)
          toast.success('Excel dosyası başarıyla indirildi')
        } catch (xlsxErr) {
          console.error('XLSX oluşturma hatası, CSV ye düşülüyor:', xlsxErr)
          // XLSX başarısızsa CSV fallback (başlıklar ayrı hücrelerde)
          const escapeCSV = (value) => {
            if (value === null || value === undefined) return ''
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          }
          const formatValue = (value) => {
            if (value === null || value === undefined) return ''
            if (value instanceof Date) return value.toLocaleString('tr-TR')
            if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
              try { return new Date(value).toLocaleString('tr-TR') } catch { return value }
            }
            if (typeof value === 'number') return value.toLocaleString('tr-TR')
            return String(value)
          }
          // CSV'de de başlıklar ayrı hücrelerde (virgülle ayrılmış)
          const csvRows = dataRows.map(row => rawHeaders.map(h => escapeCSV(formatValue(row[h]))).join(','))
          const csv = [displayHeaders.join(','), ...csvRows].join('\r\n')
          const BOM = '\uFEFF'
          const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${(title || 'dataset').replace(/[^a-zA-Z0-9_]/g, '_')}_${stamp}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success('CSV dosyası başarıyla indirildi')
        }
      }).catch(() => {
        // XLSX yüklenemediyse doğrudan CSV fallback
        const escapeCSV = (value) => {
          if (value === null || value === undefined) return ''
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }
        const formatValue = (value) => {
          if (value === null || value === undefined) return ''
          if (value instanceof Date) return value.toLocaleString('tr-TR')
          if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
            try { return new Date(value).toLocaleString('tr-TR') } catch { return value }
          }
          if (typeof value === 'number') return value.toLocaleString('tr-TR')
          return String(value)
        }
        // CSV'de de başlıklar ayrı hücrelerde (virgülle ayrılmış)
        const csvRows = dataRows.map(row => rawHeaders.map(h => escapeCSV(formatValue(row[h]))).join(','))
        const csv = [displayHeaders.join(','), ...csvRows].join('\r\n')
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(title || 'dataset').replace(/[^a-zA-Z0-9_]/g, '_')}_${stamp}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('CSV dosyası başarıyla indirildi')
      })
    } catch (error) {
      console.error('Excel export hatası:', error)
      toast.error('Excel oluşturulurken hata oluştu')
    }
  }

  const exportRowsToPDF = async (rows, title, datasetKey = null) => {
    const dataRows = Array.isArray(rows) ? rows : []
    if (dataRows.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı')
      return
    }

    // jsPDF ve AutoTable eklentisini dinamik yükle ve tabloyu düzgün biçimle
    const ensureJsPDF = () => new Promise((resolve) => {
      if (window.jspdf?.jsPDF) return resolve()
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = () => resolve()
      document.head.appendChild(s)
    })

    const ensureAutoTable = () => new Promise((resolve) => {
      if (window.jspdf?.jsPDF && typeof window.jspdf.jsPDF === 'function' && typeof window.jspdf.jsPDF.API?.autoTable === 'function') {
        return resolve()
      }
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js'
      s.onload = () => resolve()
      document.head.appendChild(s)
    })

    try {
      await ensureJsPDF()
      await ensureAutoTable()

      const { jsPDF } = window.jspdf
      const headers = Object.keys(dataRows[0])
      
      // Display label kullan (eğer varsa)
      let displayHeaders = headers
      if (datasetKey && datasetConfigs[datasetKey]?.getDisplayLabel) {
        const getDisplayLabel = datasetConfigs[datasetKey].getDisplayLabel
        displayHeaders = headers.map(h => getDisplayLabel(h) || h)
      }
      
      // İstek gereği tüm PDF'ler A4 yatay
      const doc = new jsPDF('l', 'mm', 'a4')

      // Sayfa boyutları (A4 yatay: 297mm x 210mm)
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginLeft = 14
      const marginRight = 14
      const marginTop = 30
      const marginBottom = 20
      const availableWidth = pageWidth - marginLeft - marginRight

      // Font boyutu ve minimum kolon genişliği hesapla
      const fontSize = headers.length > 12 ? 6 : headers.length > 8 ? 7 : 8
      const minCellWidth = headers.length > 12 ? 14 : headers.length > 8 ? 18 : 24
      const cellPadding = 1.5

      // Kolon genişliklerini hesapla (içeriğe göre veya minimum genişlik)
      const calculateColumnWidths = (headerIndices) => {
        const widths = []
        let totalWidth = 0
        
        headerIndices.forEach((idx) => {
          const header = displayHeaders[idx]
          const sampleData = dataRows.slice(0, 10).map(row => String(row[headers[idx]] ?? '')).concat([header])
          const maxLength = Math.max(...sampleData.map(s => s.length))
          // Yaklaşık genişlik hesapla (font boyutuna göre)
          const estimatedWidth = Math.max(minCellWidth, (maxLength * fontSize * 0.6) + (cellPadding * 2))
          widths.push(Math.min(estimatedWidth, availableWidth * 0.4)) // Tek kolon maksimum %40
          totalWidth += widths[widths.length - 1]
        })
        
        return { widths, totalWidth }
      }

      // Kolonları sayfa genişliğine göre grupla
      const columnGroups = []
      let currentGroup = []
      let currentGroupWidth = 0

      headers.forEach((header, idx) => {
        const headerText = displayHeaders[idx]
        const sampleData = dataRows.slice(0, 10).map(row => String(row[header] ?? '')).concat([headerText])
        const maxLength = Math.max(...sampleData.map(s => s.length))
        const estimatedWidth = Math.max(minCellWidth, (maxLength * fontSize * 0.6) + (cellPadding * 2))
        const columnWidth = Math.min(estimatedWidth, availableWidth * 0.4)

        // Eğer bu kolonu eklemek sayfa genişliğini aşıyorsa, mevcut grubu kaydet ve yeni grup başlat
        if (currentGroup.length > 0 && currentGroupWidth + columnWidth > availableWidth) {
          columnGroups.push([...currentGroup])
          currentGroup = [idx]
          currentGroupWidth = columnWidth
        } else {
          currentGroup.push(idx)
          currentGroupWidth += columnWidth
        }
      })

      // Son grubu ekle
      if (currentGroup.length > 0) {
        columnGroups.push(currentGroup)
      }

      const totalPages = columnGroups.length

      // Başlık ve tarih yazımı için yardımcı fonksiyon (MQPage.jsx'deki gibi)
      const writeHeader = (partText = '') => {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(`${title || 'Veri Raporu'}${partText}`, marginLeft, 16)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, marginLeft, 24)
      }

      // Her kolon grubu için tablo oluştur
      columnGroups.forEach((groupIndices, groupIndex) => {
        // Her grup için yeni sayfa (ilk grup hariç)
        if (groupIndex > 0) {
          doc.addPage()
        }

        // Başlığa "Bölüm X/Y" ekle (MQPage.jsx'deki gibi)
        const partText = totalPages > 1 ? ` - Bölüm ${groupIndex + 1}/${totalPages}` : ''
        writeHeader(partText)

        // Bu grup için başlıklar ve veriler
        const groupHeaders = groupIndices.map(idx => displayHeaders[idx])
        const groupBody = dataRows.map((row) => groupIndices.map((idx) => String(row[headers[idx]] ?? '')))

        // Kolon genişliklerini hesapla
        const { widths: columnWidths } = calculateColumnWidths(groupIndices)
        const totalColumnWidth = columnWidths.reduce((sum, w) => sum + w, 0)
        
        // Eğer toplam genişlik sayfa genişliğinden küçükse, orantılı olarak genişlet
        let adjustedWidths = columnWidths
        if (totalColumnWidth < availableWidth && groupIndices.length > 1) {
          const scaleFactor = availableWidth / totalColumnWidth
          adjustedWidths = columnWidths.map(w => w * scaleFactor)
        }

        // Kolon stilleri
        const columnStyles = groupIndices.reduce((acc, idx, i) => {
          acc[i] = {
            cellWidth: adjustedWidths[i],
            halign: 'left',
            minCellWidth: minCellWidth
          }
          return acc
        }, {})

        // Bu grubun ilk sayfa numarasını kaydet (didDrawPage callback için)
        const groupStartPage = doc.internal.getCurrentPageInfo().pageNumber

        // Tablo oluştur
        doc.autoTable({
          head: [groupHeaders],
          body: groupBody,
          startY: marginTop,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: fontSize,
            cellPadding: cellPadding,
            overflow: 'linebreak',
            valign: 'middle',
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: 20,
            halign: 'left',
            fontStyle: 'bold',
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          columnStyles: columnStyles,
          didDrawPage: (dataArg) => {
            // AutoTable'ın otomatik oluşturduğu ek sayfalar için başlık tekrarı
            const currentPage = dataArg.pageNumber
            // Eğer bu grup için ilk sayfadan sonraki sayfalardaysak başlık ekle
            if (currentPage > groupStartPage) {
              writeHeader(partText)
            }
          },
        })
      })

      const now = new Date()
      const two = (n) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${two(now.getMonth()+1)}-${two(now.getDate())}_${two(now.getHours())}-${two(now.getMinutes())}-${two(now.getSeconds())}`
      doc.save(`${(title || 'dataset')}_${stamp}.pdf`)
      toast.success('Veriler PDF formatında indirildi')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('PDF oluşturulurken bir hata oluştu')
    }
  }

  const resolveDatasetFromMessage = (lowerMessage) => {
    // İlk kelimeye öncelik ver
    const words = lowerMessage.split(/\s+/).filter(Boolean)
    const firstWord = words[0] || ''
    const firstWordNormalized = normalizeKey(firstWord)
    const lowerMessageNormalized = normalizeKey(lowerMessage)
    
    // 1. EN ÖNCE: Tüm mesaj tam olarak bir alias ile eşleşiyor mu? (örn: "mq w2over" -> "mq w2over" alias'ı)
    // Bu, daha spesifik eşleşmeleri öncelemek için kritik
    const fullMatches = []
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        // Tam mesaj eşleşmesi (normalize edilmiş ve orijinal)
        if (lowerMessage === aliasLower || lowerMessageNormalized === aliasNormalized) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const aliasLength = aliasLower.length
          fullMatches.push({ key, cfg, isPrimary, aliasLength, alias: aliasLower })
        }
      }
    }
    
    if (fullMatches.length > 0) {
      fullMatches.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1
        return b.aliasLength - a.aliasLength // Daha uzun alias'lar öncelikli (daha spesifik)
      })
      const best = fullMatches[0]
      return { key: best.key, title: best.cfg.title, fetch: best.cfg.fetch }
    }
    
    // 2. İlk kelime tam olarak bir dataset alias'ı ile eşleşiyor mu?
    let firstWordMatch = null
    let firstWordMatchScore = 0
    
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        // Tam eşleşme (normalize edilmiş)
        if (firstWordNormalized === aliasNormalized) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 10 : 5) + (firstWord === aliasLower ? 2 : 0)
          if (score > firstWordMatchScore) {
            firstWordMatch = { key, cfg, isPrimary }
            firstWordMatchScore = score
          }
        }
        // Tam eşleşme (orijinal)
        else if (firstWord === aliasLower) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 10 : 5) + 2
          if (score > firstWordMatchScore) {
            firstWordMatch = { key, cfg, isPrimary }
            firstWordMatchScore = score
          }
        }
      }
    }
    
    if (firstWordMatch) {
      return { key: firstWordMatch.key, title: firstWordMatch.cfg.title, fetch: firstWordMatch.cfg.fetch }
    }
    
    // 3. İlk kelime bir alias'ın başlangıcı mı? (örn: "tcpconf" -> "tcp conf")
    let prefixMatch = null
    let prefixMatchScore = 0
    
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        if (firstWordNormalized.startsWith(aliasNormalized) && aliasNormalized.length >= 3) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 8 : 4) + aliasNormalized.length
          if (score > prefixMatchScore) {
            prefixMatch = { key, cfg, isPrimary, aliasLength: aliasLower.length }
            prefixMatchScore = score
          }
        }
        else if (aliasNormalized.startsWith(firstWordNormalized) && firstWordNormalized.length >= 3) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 8 : 4) + firstWordNormalized.length
          if (score > prefixMatchScore) {
            prefixMatch = { key, cfg, isPrimary, aliasLength: aliasLower.length }
            prefixMatchScore = score
          }
        }
      }
    }
    
    if (prefixMatch) {
      return { key: prefixMatch.key, title: prefixMatch.cfg.title, fetch: prefixMatch.cfg.fetch }
    }
    
    // 4. Tüm mesajda exact match (word boundary ile)
    const exactMatches = []
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const exactMatch = words.some(w => {
          const normalized = normalizeKey(w)
          const aliasNormalized = normalizeKey(aliasLower)
          return normalized === aliasNormalized
        })
        if (exactMatch) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          exactMatches.push({ key, cfg, score: 2, isPrimary, aliasLength: aliasLower.length, alias })
        }
      }
    }
    
    if (exactMatches.length > 0) {
      exactMatches.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1
        if (a.aliasLength !== b.aliasLength) return b.aliasLength - a.aliasLength
        return b.score - a.score
      })
      const best = exactMatches[0]
      return { key: best.key, title: best.cfg.title, fetch: best.cfg.fetch }
    }
    
    // 5. Son çare: includes ile kontrol et (normalize edilmiş ve daha spesifik olanlara öncelik ver)
    const includesMatches = []
    
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        if (lowerMessageNormalized.includes(aliasNormalized) && aliasNormalized.length >= 4) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const aliasLength = aliasNormalized.length
          includesMatches.push({ key, cfg, isPrimary, aliasLength, alias: aliasLower })
        }
        else if (lowerMessage.includes(aliasLower) && aliasLower.length >= 4) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const aliasLength = aliasLower.length
          includesMatches.push({ key, cfg, isPrimary, aliasLength, alias: aliasLower })
        }
      }
    }
    
    if (includesMatches.length > 0) {
      includesMatches.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1
        return b.aliasLength - a.aliasLength
      })
      const best = includesMatches[0]
      return { key: best.key, title: best.cfg.title, fetch: best.cfg.fetch }
    }
    
    // MQ special datasets (backward compatibility)
    if (lowerMessage.includes('connz')) {
      return { key: 'connz', title: 'MQ CONNZ', fetch: databaseAPI.getMainviewMQConnz }
    }
    if (lowerMessage.includes('w2over') || lowerMessage.includes('w2 over')) {
      return { key: 'w2over', title: 'MQ W2OVER', fetch: databaseAPI.getMainviewMQW2over }
    }
    if (lowerMessage.includes('qm') || lowerMessage.includes('queue manager') || lowerMessage.includes('message queue') || lowerMessage.includes('mq')) {
      return { key: 'qm', title: 'MQ QM', fetch: databaseAPI.getMainviewMQQm }
    }
    return null
  }

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading) return

    const message = inputMessage
    const lowerMessage = message.toLowerCase().trim()

    // Kullanıcı mesajını ekle
    const userMessage = { text: message, sender: 'user', timestamp: getMessageTime() }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    setIsLoading(true)
    setIsTyping(true)

    // Tüm async işlemleri try-catch ile koru
    try {
      // Çok kısa mesajlar için basit, profesyonel mesaj
      if (lowerMessage.length <= 1) {
        setMessages(prev => [...prev, { 
          text: 'Üzgünüm, aradığınız değeri bulamadım. Lütfen bir dataset adı veya dataset adı + kolon adı şeklinde sorgu yazın (örn: "cpu", "tcpconf stack_name").', 
          sender: 'bot', 
          timestamp: getMessageTime() 
        }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }

    // CPU tarih aralığı sorgusu (iki tarih arası min/max) - EN ÖNCE KONTROL ET
    const dateRange = extractDateRangeFromMessage(message)
    const hasCpuKeyword = lowerMessage.includes('cpu') || lowerMessage.includes('mvs') || lowerMessage.includes('sysover')
    
    if (dateRange && hasCpuKeyword) {
      setIsTyping(true)
      setMessages(prev => [...prev, { text: `${dateRange.startDate.toLocaleDateString('tr-TR')} ile ${dateRange.endDate.toLocaleDateString('tr-TR')} arasındaki CPU verilerini çekiyorum...`, sender: 'bot', timestamp: getMessageTime() }])
      
      try {
        const response = await databaseAPI.getMainviewMvsSysover({})
        
        if (response.data?.success) {
          const rows = Array.isArray(response.data.data) ? response.data.data : []
          
          // Tarih aralığına göre filtrele
          const filteredRows = rows.filter(row => {
            const rowDate = new Date(row.bmctime || row.created_at || row.time)
            return rowDate >= dateRange.startDate && rowDate <= dateRange.endDate
          })
          
          if (filteredRows.length === 0) {
            setMessages(prev => [...prev, { text: 'Belirtilen tarih aralığında CPU verisi bulunamadı.', sender: 'bot', timestamp: getMessageTime() }])
            setIsLoading(false)
            setIsTyping(false)
            return
          }
          
          // CPU Busy% değerlerini al (succpub)
          const cpuValues = filteredRows
            .map(row => parseFloat(row.succpub))
            .filter(val => !isNaN(val) && val !== null)
          
          if (cpuValues.length === 0) {
            setMessages(prev => [...prev, { text: 'Belirtilen tarih aralığında geçerli CPU değeri bulunamadı.', sender: 'bot', timestamp: getMessageTime() }])
            setIsLoading(false)
            setIsTyping(false)
            return
          }
          
          const minCpu = Math.min(...cpuValues)
          const maxCpu = Math.max(...cpuValues)
          const avgCpu = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length
          
          // Min ve max değerlerin hangi tarihte olduğunu bul
          const minRow = filteredRows.find(row => parseFloat(row.succpub) === minCpu)
          const maxRow = filteredRows.find(row => parseFloat(row.succpub) === maxCpu)
          
          const formatDateTime = (dateStr) => {
            if (!dateStr) return 'N/A'
            try {
              return new Date(dateStr).toLocaleString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
            } catch {
              return dateStr
            }
          }
          
          const responseText = `📊 CPU Analiz Raporu\n` +
            `📅 Tarih Aralığı: ${dateRange.startDate.toLocaleDateString('tr-TR')} - ${dateRange.endDate.toLocaleDateString('tr-TR')}\n\n` +
            `⚡ CPU Busy% İstatistikleri:\n` +
            `• Minimum: %${minCpu.toFixed(2)} (${formatDateTime(minRow?.bmctime || minRow?.created_at || minRow?.time)})\n` +
            `• Maximum: %${maxCpu.toFixed(2)} (${formatDateTime(maxRow?.bmctime || maxRow?.created_at || maxRow?.time)})\n` +
            `• Ortalama: %${avgCpu.toFixed(2)}\n` +
            `• Kayıt Sayısı: ${cpuValues.length}`
          
          setMessages(prev => [...prev, { text: responseText, sender: 'bot', timestamp: getMessageTime() }])
        } else {
          setMessages(prev => [...prev, { text: 'CPU verisi alınamadı. Lütfen daha sonra tekrar deneyin.', sender: 'bot', timestamp: getMessageTime() }])
        }
      } catch (error) {
        console.error('CPU tarih aralığı sorgusu hatası:', error)
        setMessages(prev => [...prev, { text: 'CPU verisi alınırken bir hata oluştu.', sender: 'bot', timestamp: getMessageTime() }])
      } finally {
        setIsLoading(false)
        setIsTyping(false)
      }
      return
    }

    // Export command: "<tablo adı> pdf" or "<tablo adı> excel"
    const exportType = lowerMessage.includes('pdf') ? 'pdf' : (lowerMessage.includes('excel') || lowerMessage.includes('csv') || lowerMessage.includes('xls')) ? 'excel' : null
    if (exportType) {
      const ds = resolveDatasetFromMessage(lowerMessage)
      if (!ds) {
        setMessages(prev => [...prev, { text: 'Hangi tabloyu istediğinizi anlayamadım. Örnek: "tcpcons pdf" veya "qm excel"', sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }
      setMessages(prev => [...prev, { text: `${ds.title} verisini ${exportType.toUpperCase()} olarak hazırlıyorum...`, sender: 'bot', timestamp: getMessageTime() }])
      try {
        const resp = await ds.fetch({})
        const rows = Array.isArray(resp?.data?.data) ? resp.data.data : []
        if (!resp?.data?.success || rows.length === 0) {
          setMessages(prev => [...prev, { text: `${ds.title} verisi bulunamadı.`, sender: 'bot', timestamp: getMessageTime() }])
          setIsLoading(false)
          setIsTyping(false)
          return
        }
        if (exportType === 'excel') exportRowsToCSV(rows, ds.title, ds.key)
        else await exportRowsToPDF(rows, ds.title, ds.key)
        setMessages(prev => [...prev, { text: `${ds.title} ${exportType.toUpperCase()} çıktısı hazırlandı.`, sender: 'bot', timestamp: getMessageTime() }])
      } catch (e) {
        setMessages(prev => [...prev, { text: `${ds.title} verisi alınırken bir hata oluştu.`, sender: 'bot', timestamp: getMessageTime() }])
      } finally {
        setIsLoading(false)
        setIsTyping(false)
      }
      return
    }

    // CPU datası isteğini kontrol et
    if (lowerMessage.includes('son cpu') || lowerMessage.includes('cpu getir') || lowerMessage.includes('cpu verisi')) {
      setMessages(prev => [...prev, { text: 'CPU verilerini çekiyorum...', sender: 'bot', timestamp: getMessageTime() }])
      
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
          
          setMessages(prev => [...prev, { text: cpuResponse, sender: 'bot', timestamp: getMessageTime() }])
        } else {
          setMessages(prev => [...prev, { text: 'CPU verisi alınamadı. Lütfen daha sonra tekrar deneyin.', sender: 'bot', timestamp: getMessageTime() }])
        }
      } catch (error) {
        setMessages(prev => [...prev, { text: 'CPU verisi alınırken bir hata oluştu.', sender: 'bot', timestamp: getMessageTime() }])
      } finally {
        setIsLoading(false)
        setIsTyping(false)
      }
      return
    }

    // Network datasets (alias-aware) - Tam mesaj eşleşmesine öncelik ver
    const words = lowerMessage.split(/\s+/).filter(Boolean)
    const firstWord = words[0] || ''
    const firstWordNormalized = normalizeKey(firstWord)
    const lowerMessageNormalized = normalizeKey(lowerMessage)
    
    // 1. EN ÖNCE: Tüm mesaj tam olarak bir alias ile eşleşiyor mu? (örn: "mq w2over" -> "mq w2over" alias'ı)
    // Bu, daha spesifik eşleşmeleri öncelemek için kritik
    const fullMatches = []
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        // Tam mesaj eşleşmesi (normalize edilmiş ve orijinal)
        if (lowerMessage === aliasLower || lowerMessageNormalized === aliasNormalized) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const aliasLength = aliasLower.length
          fullMatches.push({ key, cfg, isPrimary, aliasLength, alias: aliasLower })
        }
      }
    }
    
    if (fullMatches.length > 0) {
      fullMatches.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1
        return b.aliasLength - a.aliasLength // Daha uzun alias'lar öncelikli (daha spesifik)
      })
      const best = fullMatches[0]
      await queryDataset(lowerMessage, best.cfg.fetch, best.cfg.title, best.key)
      return
    }
    
    // 2. İlk kelime tam olarak bir dataset alias'ı ile eşleşiyor mu?
    let firstWordMatch = null
    let firstWordMatchScore = 0
    
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        // Tam eşleşme (normalize edilmiş)
        if (firstWordNormalized === aliasNormalized) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 10 : 5) + (firstWord === aliasLower ? 2 : 0)
          if (score > firstWordMatchScore) {
            firstWordMatch = { key, cfg, isPrimary }
            firstWordMatchScore = score
          }
        }
        // Tam eşleşme (orijinal)
        else if (firstWord === aliasLower) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 10 : 5) + 2
          if (score > firstWordMatchScore) {
            firstWordMatch = { key, cfg, isPrimary }
            firstWordMatchScore = score
          }
        }
      }
    }
    
    if (firstWordMatch) {
      await queryDataset(lowerMessage, firstWordMatch.cfg.fetch, firstWordMatch.cfg.title, firstWordMatch.key)
      return
    }
    
    // 3. İlk kelime bir alias'ın başlangıcı mı? (örn: "tcpconf" -> "tcp conf" normalize edildiğinde "tcpconf")
    // Bu durumda normalize edilmiş alias ilk kelimenin başlangıcı olmalı veya tam tersi
    let prefixMatch = null
    let prefixMatchScore = 0
    
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        // Normalize edilmiş alias, normalize edilmiş ilk kelimenin başlangıcı mı?
        // Örnek: "tcp conf" normalize -> "tcpconf", ilk kelime "tcpconf" normalize -> "tcpconf"
        // "tcpconf".startsWith("tcpconf") -> true
        if (firstWordNormalized.startsWith(aliasNormalized) && aliasNormalized.length >= 3) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 8 : 4) + aliasNormalized.length
          if (score > prefixMatchScore) {
            prefixMatch = { key, cfg, isPrimary, aliasLength: aliasLower.length }
            prefixMatchScore = score
          }
        }
        // Veya normalize edilmiş alias, normalize edilmiş ilk kelimenin başlangıcı mı?
        // Örnek: "tcpconf" normalize -> "tcpconf", "tcp conf" normalize -> "tcpconf"
        else if (aliasNormalized.startsWith(firstWordNormalized) && firstWordNormalized.length >= 3) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const score = (isPrimary ? 8 : 4) + firstWordNormalized.length
          if (score > prefixMatchScore) {
            prefixMatch = { key, cfg, isPrimary, aliasLength: aliasLower.length }
            prefixMatchScore = score
          }
        }
      }
    }
    
    if (prefixMatch) {
      await queryDataset(lowerMessage, prefixMatch.cfg.fetch, prefixMatch.cfg.title, prefixMatch.key)
      return
    }
    
    // 4. Tüm mesajda exact match (word boundary ile)
    const exactMatches = []
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        // Word boundary ile exact match
        const exactMatch = words.some(w => {
          const normalized = normalizeKey(w)
          const aliasNormalized = normalizeKey(aliasLower)
          return normalized === aliasNormalized
        })
        if (exactMatch) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          exactMatches.push({ key, cfg, score: 2, isPrimary, aliasLength: aliasLower.length })
        }
      }
    }
    
    // En yüksek skorlu ve primary olan eşleşmeyi seç
    if (exactMatches.length > 0) {
      exactMatches.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1
        if (a.aliasLength !== b.aliasLength) return b.aliasLength - a.aliasLength
        return b.score - a.score
      })
      const best = exactMatches[0]
      await queryDataset(lowerMessage, best.cfg.fetch, best.cfg.title, best.key)
      return
    }
    
    // 5. Son çare: includes ile kontrol et (ama normalize edilmiş ve daha spesifik olanlara öncelik ver)
    const includesMatches = []
    
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      for (const alias of cfg.aliases) {
        const aliasLower = alias.toLowerCase()
        const aliasNormalized = normalizeKey(aliasLower)
        
        // Normalize edilmiş mesaj, normalize edilmiş alias içeriyor mu?
        if (lowerMessageNormalized.includes(aliasNormalized) && aliasNormalized.length >= 4) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const aliasLength = aliasNormalized.length
          includesMatches.push({ key, cfg, isPrimary, aliasLength })
        }
        // Veya orijinal alias mesajda geçiyor mu?
        else if (lowerMessage.includes(aliasLower) && aliasLower.length >= 4) {
          const isPrimary = cfg.primaryAliases?.includes(alias) || false
          const aliasLength = aliasLower.length
          includesMatches.push({ key, cfg, isPrimary, aliasLength })
        }
      }
    }
    
    if (includesMatches.length > 0) {
      // En uzun ve primary alias'a sahip olanı seç
      includesMatches.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary ? 1 : -1
        return b.aliasLength - a.aliasLength
      })
      const best = includesMatches[0]
      await queryDataset(lowerMessage, best.cfg.fetch, best.cfg.title, best.key)
      return
    }

    // explicit keyword fallbacks removed (aliases already cover cases)

    // Column-only queries: infer dataset if possible (timeout ile)
    try {
      const inferencePromise = guessDatasetByColumn(lowerMessage)
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000)) // 2 saniye timeout
      const inferred = await Promise.race([inferencePromise, timeoutPromise])
      
      if (inferred) {
        const cfg = datasetConfigs[inferred]
        await queryDataset(lowerMessage, cfg.fetch, cfg.title, inferred)
        return
      }
    } catch (err) {
      // Hata durumunda devam et
      console.error('Error in guessDatasetByColumn:', err)
    }

    // If message looks like a column name, surface suggestions instead of generic fallback (timeout ile)
    if (/^[a-zA-Z0-9_]+$/.test(lowerMessage) && lowerMessage.length >= COLUMN_SUGGEST_MIN) {
      try {
        const matchesPromise = findDatasetsByColumn(lowerMessage)
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve([]), 2000)) // 2 saniye timeout
        const matches = await Promise.race([matchesPromise, timeoutPromise])
        
        if (matches && matches.length > 0) {
          const sugs = matches.slice(0, SUGGESTION_LIMIT).map(m => ({
            type: 'column', datasetKey: m.datasetKey, display: m.displayLabel || m.column, insertText: `${m.datasetKey} ${m.displayLabel || m.column}`
          }))
          setInputMessage(message)
          setSuggestions(sugs)
          setShowSuggestions(true)
          setSelectedSuggestionIndex(0)
          setIsLoading(false)
          setIsTyping(false)
          return
        }
      } catch (err) {
        // Hata durumunda devam et, fallback mesajına git
        console.error('Error in findDatasetsByColumn:', err)
      }
    }

    // Fallback mesajı aşağıda, genel bot cevapları kısmında işlenecek

    // Eski MQ kodları kaldırıldı - artık queryDataset kullanılıyor
    /*
    // MQ CONNZ data query (eski kod - datasetConfigs'teki alias'lar çalışmazsa buraya düşer)
    if (lowerMessage.includes('connz')) {
      const listAll = lowerMessage.includes('tüm') || lowerMessage.includes('hepsi') || lowerMessage.includes('kolon') || lowerMessage.includes('columns') || lowerMessage.includes('liste')
      let target = parseConnzQuery(lowerMessage)
      // display label/kolon adıyla dinamik eşleşme
      if (!target || !target.col) {
        try {
          const resp = await databaseAPI.getMainviewMQConnz({})
          const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
          const keys = getAllKeys(rows)
          const picked = pickColumnByMessage(lowerMessage, keys, getConnzDisplayLabelLocal)
          if (picked) target = { col: picked, label: getConnzDisplayLabelLocal(picked) }
        } catch {
          setIsLoading(false)
          setIsTyping(false)
        }
      }
      if (!target && !listAll) {
        setMessages(prev => [...prev, { text: 'CONNZ için örnek sorgular: Application Name, Type Of Information (Hex) (Count), Address Space Identifier, Application Type(Maximum), CICS Transaction Id. Tüm kolonlar için: "connz tüm" yazabilirsiniz.', sender: 'bot', timestamp: getMessageTime() }])
        setIsLoading(false)
        setIsTyping(false)
        return
      }
      setMessages(prev => [...prev, { text: `MQ CONNZ ${target ? target.label : 'tüm kolonlar'} verisini çekiyorum...`, sender: 'bot', timestamp: getMessageTime() }])
      try {
        const response = await databaseAPI.getMainviewMQConnz({})
        if (response.data?.success) {
          const rows = Array.isArray(response.data.data) ? response.data.data : []
          if (listAll) {
            const summary = buildSummary(rows, 20, 'connz')
            setMessages(prev => [...prev, { text: `📦 MQ CONNZ - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot', timestamp: getMessageTime() }])
          } else {
            const row = rows.find(r => {
              const v = r?.[target.col]
              return v !== null && v !== undefined && String(v).trim() !== ''
            }) || rows[0]
            const valueRaw = row?.[target.col]
            const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at
            const formattedVal = formatValue(valueRaw)
            const reply = `📦 MQ CONNZ - ${target.label}\n` +
              `• Değer: ${formattedVal}\n` +
              `• Zaman: ${formatTrDate(ts)}`
            setMessages(prev => [...prev, { text: reply, sender: 'bot', timestamp: getMessageTime() }])
          }
        } else {
          setMessages(prev => [...prev, { text: 'MQ CONNZ verisi alınamadı.', sender: 'bot', timestamp: getMessageTime() }])
        }
      } catch (err) {
        setMessages(prev => [...prev, { text: 'MQ CONNZ verisi alınırken bir hata oluştu.', sender: 'bot', timestamp: getMessageTime() }])
      } finally {
        setIsLoading(false)
        setIsTyping(false)
      }
      return
    }

    // MQ W2OVER data query
    if (lowerMessage.includes('w2over') || lowerMessage.includes('w2 over')) {
      const listAll = lowerMessage.includes('tüm') || lowerMessage.includes('hepsi') || lowerMessage.includes('kolon') || lowerMessage.includes('columns') || lowerMessage.includes('liste')
      let target = parseW2overQuery(lowerMessage)
      if (!target || !target.col) {
        try {
          const resp = await databaseAPI.getMainviewMQW2over({})
          const rows = Array.isArray(resp.data?.data) ? resp.data.data : []
          const keys = getAllKeys(rows)
          const picked = pickColumnByMessage(lowerMessage, keys, getW2overDisplayLabelLocal)
          if (picked) target = { col: picked, label: getW2overDisplayLabelLocal(picked) }
        } catch {}
      }
      if (!target && !listAll) {
        setMessages(prev => [...prev, { text: 'W2OVER için örnek sorgular: Channels Retrying, Local Queues at Max Depth High, Transmit Queues at Max Depth High, Dead-Letter Message Count, Queue Manager Events. Tüm kolonlar için: "w2over tüm" yazabilirsiniz.', sender: 'bot' }])
      } else {
        setMessages(prev => [...prev, { text: `MQ W2OVER ${target ? target.label : 'tüm kolonlar'} verisini çekiyorum...`, sender: 'bot' }])
        try {
          const response = await databaseAPI.getMainviewMQW2over({})
          if (response.data?.success) {
            const rows = Array.isArray(response.data.data) ? response.data.data : []
            if (listAll) {
              const summary = buildSummary(rows, 20, 'w2over')
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
      let mqTarget = parseMqQuery(lowerMessage)

      if (mqTarget && mqTarget.col) {
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
            const summary = buildSummary(rows, 20, 'qm')
            setMessages(prev => [...prev, { text: `📦 MQ QM - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot' }])
            return
          }
          const keys = getAllKeys(rows)
          const picked = pickColumnByMessage(lowerMessage, keys, getQmDisplayLabelLocal)
          if (!picked) {
            // Display label'ları kullan
            const preview = keys.slice(0, 10).map(key => getQmDisplayLabelLocal(key)).join(', ')
            setMessages(prev => [...prev, { text: `Aradığınız QM kolonu bulunamadı. Örnekler: ${preview}. Tümünü görmek için "qm tüm" yazabilirsiniz.`, sender: 'bot' }])
            return
          }
          const row = rows.find(r => r?.[picked] !== null && r?.[picked] !== undefined) || rows[0]
          const ts = row?.record_timestamp || row?.bmctime || row?.updated_at || row?.created_at
          const pickedLabel = getQmDisplayLabelLocal(picked)
          const reply = `📦 MQ QM - ${pickedLabel}\n• Değer: ${formatValue(row?.[picked])}\n• Zaman: ${formatTrDate(ts)}`
          setMessages(prev => [...prev, { text: reply, sender: 'bot' }])
        } else {
          setMessages(prev => [...prev, { text: 'MQ QM verisi alınamadı.', sender: 'bot' }])
        }
      } catch (err) {
        setMessages(prev => [...prev, { text: 'MQ QM verisi alınırken bir hata oluştu.', sender: 'bot' }])
      }
      return
    }
    */

    // Diğer bot cevapları (genel konuşma mesajları için)
    const botResponse = getBotResponse(message)
    if (botResponse && botResponse !== 'Anlıyorum. Daha fazla bilgi için lütfen detaylı bir soru sorun.') {
      // Genel konuşma mesajı varsa göster
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot', timestamp: getMessageTime() }])
      setIsLoading(false)
      setIsTyping(false)
      return
    }
    
    // Genel konuşma mesajı yoksa, hemen basit ve profesyonel bir mesaj göster (async işlem yapmadan)
    setMessages(prev => [...prev, { 
      text: 'Üzgünüm, aradığınız değeri bulamadım. Lütfen bir dataset adı veya dataset adı + kolon adı şeklinde sorgu yazın (örn: "cpu", "tcpconf stack_name").', 
      sender: 'bot', 
      timestamp: getMessageTime() 
    }])
    setIsLoading(false)
    setIsTyping(false)
    } catch (err) {
      // Genel hata yakalama - chatbot'un donmasını önle
      // Hata detaylarını sadece console'da tut, kullanıcıya basit mesaj göster
      console.error('Chatbot error in handleSendMessage:', err)
      setMessages(prev => [...prev, { 
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 
        sender: 'bot', 
        timestamp: getMessageTime() 
      }])
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Enter tuşu sadece mesaj gönderir, önerileri uygulamaz
      handleSendMessage()
    }
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      applySuggestion(suggestions[selectedSuggestionIndex] || suggestions[0])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
    // Enter tuşu artık önerileri uygulamıyor, sadece mesaj gönderiyor (handleKeyPress'te)
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
        <div className="fixed bottom-6 right-6 w-[380px] sm:w-96 h-[520px] max-h-[85vh] bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-700 animate-slide-up backdrop-blur-xl overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
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
                onClick={minimizeChatbot}
                className="hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-110"
                aria-label="Chatbot'u arka plana at"
                title="Arka plana at"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                </svg>
              </button>
              <button
                onClick={resetAndCloseChatbot}
                className="hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:scale-110"
                aria-label="Chatbot'u kapat ve sıfırla"
                title="Kapat ve sıfırla"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-800 relative">
            
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
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 flex-row">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 3.45 1.232 4.68 0C28.45 15.5 28.8 13.8 29 12c0-4.5-3-7.5-9-7.5s-9 3-9 7.5c0 1.8.55 3.5 1.318 4.702M5 14.5V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0023 19.5v-5a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 14.5z" />
                  </svg>
                </div>
                
                {/* Typing Bubble */}
                <div className="bg-gray-700 text-gray-100 border border-gray-600 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 font-medium">Yazıyor</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4 bg-gray-800">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => { setInputMessage(e.target.value); updateHintList(e.target.value) }}
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  placeholder="Mesajınızı yazın..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm transition-all"
                />
                {showSuggestions && suggestions.length > 0 && !isFullscreen && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800/95 border border-gray-700 rounded-xl shadow-2xl z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                      <span className="text-xs text-gray-300">Öneriler</span>
                      <button onClick={() => { setShowSuggestions(false); setUserClosedSuggestions(true) }} className="text-gray-400 hover:text-gray-200">×</button>
                    </div>
                    <div className="max-h-56 overflow-auto">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onMouseDown={(e) => { e.preventDefault(); applySuggestion(s) }}
                          className={`px-3 py-2 text-sm cursor-pointer ${i === selectedSuggestionIndex ? 'bg-gray-700' : 'bg-gray-800'} hover:bg-gray-700`}
                        >
                          <span className="text-gray-200">{s.display}</span>
                          {s.type === 'column' && <span className="text-gray-400">  · {datasetConfigs[s.datasetKey]?.title}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
            onClick={minimizeChatbot}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-8 animate-scale-in">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-[90vw] max-w-[1100px] h-[85vh] max-h-[820px] flex flex-col border border-gray-700 overflow-hidden">
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
                    onClick={minimizeChatbot}
                    className="hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 hover:scale-110"
                    aria-label="Chatbot'u arka plana at"
                    title="Arka plana at"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                    </svg>
                  </button>
                  <button
                    onClick={resetAndCloseChatbot}
                    className="hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 hover:scale-110"
                    aria-label="Chatbot'u kapat ve sıfırla"
                    title="Kapat ve sıfırla"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-gray-800 relative">
                
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
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-4 flex-row">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 3.45 1.232 4.68 0C28.45 15.5 28.8 13.8 29 12c0-4.5-3-7.5-9-7.5s-9 3-9 7.5c0 1.8.55 3.5 1.318 4.702M5 14.5V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0023 19.5v-5a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 14.5z" />
                      </svg>
                    </div>
                    
                    {/* Typing Bubble */}
                    <div className="bg-gray-700 text-gray-100 border border-gray-600 rounded-2xl px-5 py-4 shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">Yazıyor</span>
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></span>
                          <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></span>
                          <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 p-6 bg-gray-800">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => { setInputMessage(e.target.value); updateHintList(e.target.value) }}
                      onKeyPress={handleKeyPress}
                      onKeyDown={handleKeyDown}
                      placeholder="Mesajınızı yazın..."
                      className="w-full px-6 py-4 bg-gray-700 border border-gray-600 text-gray-100 placeholder:text-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base transition-all"
                    />
                    {showSuggestions && suggestions.length > 0 && isFullscreen && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800/95 border border-gray-700 rounded-2xl shadow-2xl z-50">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                          <span className="text-sm text-gray-300">Öneriler</span>
                          <button onClick={() => { setShowSuggestions(false); setUserClosedSuggestions(true) }} className="text-gray-400 hover:text-gray-200">×</button>
                        </div>
                        <div className="max-h-64 overflow-auto">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              onMouseDown={(e) => { e.preventDefault(); applySuggestion(s) }}
                              className={`px-4 py-2 text-base cursor-pointer ${i === selectedSuggestionIndex ? 'bg-gray-700' : 'bg-gray-800'} hover:bg-gray-700`}
                            >
                              <span className="text-gray-200">{s.display}</span>
                              {s.type === 'column' && <span className="text-gray-400">  · {datasetConfigs[s.datasetKey]?.title}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={inputMessage.trim() === ''}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
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
            transform: translateY(0);
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
