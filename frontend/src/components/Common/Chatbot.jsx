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
    // exact contains
    for (const k of keys) { if (msgNorm.includes(normalizeKey(k))) return k }
    if (labeler) {
      for (const k of keys) {
        const label = labeler(k)
        if (label) {
          const lab = normalizeKey(label)
          if (msgNorm.includes(lab) || fuzzyMatch(msgNorm, lab)) return k
        }
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
    
    return `📊 ${title}\n\nMevcut kolonlar:\n${displayColumns.join('\n')}${moreText}\n\n💡 Örnek sorgular:\n• ${datasetKey} ${columns[0] || 'kolon_adı'}\n• ${datasetKey} ${columns[1] || 'kolon_adı'}`
  }

  // Kolon bulunamadı mesajı oluştur
  const buildColumnNotFoundMessage = (title, examples, datasetKey) => {
    const cfg = datasetConfigs[datasetKey]
    const getDisplayLabel = cfg?.getDisplayLabel || ((key) => key)
    
    const displayExamples = examples.slice(0, 8).map(ex => {
      const displayName = getDisplayLabel(ex)
      return `• ${displayName}`
    })
    
    return `❓ ${title} için aradığınız kolon bulunamadı.\n\nMevcut kolonlar:\n${displayExamples.join('\n')}\n\n💡 Örnek sorgular:\n• ${datasetKey} ${examples[0] || 'kolon_adı'}\n• ${datasetKey} ${examples[1] || 'kolon_adı'}`
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
      'csa_in_use_percent': 'CSA Kullanım Yüzdesi',
      'ecsa_in_use_percent': 'ECSA Kullanım Yüzdesi',
      'rucsa_in_use_percent': 'RUCSA Kullanım Yüzdesi',
      'sqa_in_use_percent': 'SQA Kullanım Yüzdesi',
      'total_cs_used_percent': 'Toplam CS Kullanımı',
      'percent_used_high_shared_storage': 'High Shared Storage Kullanımı',
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
      staticColumns: ['jobnam8', 'stepnam8', 'jtarget', 'asid8', 'mvslvlx8', 'ver_rel', 'startc8', 'ipaddrc8', 'status18']
    },
    stackcpu: {
      title: 'Network StackCPU',
      aliases: ['stackcpu', 'stack cpu', 'tcpip cpu', 'stack cpu usage'],
      primaryAliases: ['stackcpu'],
      fetch: databaseAPI.getMainviewNetworkStackCPU,
      check: databaseAPI.checkTableExistsStackCPU,
      staticColumns: ['statstks', 'ippktrcd', 'ippktrtr', 'ipoutred', 'ipoutrtr']
    },
    vtamcsa: {
      title: 'Network VTAMCSA',
      aliases: ['vtamcsa', 'vtam csa', 'csa vtam'],
      primaryAliases: ['vtamcsa'],
      fetch: databaseAPI.getMainviewNetworkVtamcsa,
      check: databaseAPI.checkTableExistsVtamcsa,
      staticColumns: ['csacur', 'csamax', 'csalim', 'csausage', 'c24cur', 'c24max', 'vtmcur', 'vtmmax']
    },
    tcpconf: {
      title: 'Network TCPCONF',
      aliases: ['tcpconf', 'tcp conf', 'tcp configuration', 'tcp ayar', 'tcp config'],
      primaryAliases: ['tcpconf'],
      fetch: databaseAPI.getMainviewNetworkTcpconf,
      check: databaseAPI.checkTableExiststcpconf,
      staticColumns: ['job_name', 'stack_name', 'def_receive_bufsize', 'def_send_bufsize', 'def_max_receive_bufsize', 'maximum_queue_depth', 'default_keepalive', 'delay_ack', 'finwait2time', 'ttls']
    },
    tcpcons: {
      title: 'Network TCPCONS',
      aliases: ['tcpcons', 'tcp cons', 'tcp connections', 'tcp bağlantı', 'connections'],
      primaryAliases: ['tcpcons'],
      fetch: databaseAPI.getMainviewNetworktcpcons,
      check: databaseAPI.checkTableExiststcpcons,
      staticColumns: ['foreign_ip_address', 'remote_port', 'local_port', 'application_name', 'type_of_open', 'interval_bytes_in', 'interval_bytes_out', 'connection_status', 'remote_host_name', 'system_name']
    },
    udpconf: {
      title: 'Network UDPCONF',
      aliases: ['udpconf', 'udp conf', 'udp configuration', 'udp ayar'],
      primaryAliases: ['udpconf'],
      fetch: databaseAPI.getMainviewNetworkUdpconf,
      check: databaseAPI.checkTableExistsudpconf,
      staticColumns: ['job_name', 'stack_name', 'def_recv_bufsize', 'def_send_bufsize', 'check_summing', 'restrict_low_port', 'udp_queue_limit']
    },
    actcons: {
      title: 'Network ACTCONS',
      aliases: ['actcons', 'act cons', 'active connections', 'aktif bağlantı'],
      primaryAliases: ['actcons'],
      fetch: databaseAPI.getMainviewNetworkactcons,
      check: databaseAPI.checkTableExistsactcons,
      staticColumns: ['foreign_ip_address', 'remote_port', 'local_ip_address', 'local_port', 'application_name', 'type_of_open', 'interval_bytes_in', 'interval_bytes_out', 'connection_status', 'remote_host_name', 'system_name']
    },
    vtmbuff: {
      title: 'Network VTMBUFF',
      aliases: ['vtmbuff', 'vtm buff'],
      primaryAliases: ['vtmbuff'],
      fetch: databaseAPI.getMainviewNetworkVtmbuff,
      check: databaseAPI.checkTableExistsVtmbuff,
      staticColumns: []
    },
    tcpstor: {
      title: 'Network TCPSTOR',
      aliases: ['tcpstor', 'tcp stor', 'tcp storage'],
      primaryAliases: ['tcpstor'],
      fetch: databaseAPI.getMainviewNetworkTcpstor,
      check: databaseAPI.checkTableExistsTcpstor,
      staticColumns: []
    },
    connsrpz: {
      title: 'Network CONNSRPZ',
      aliases: ['connsrpz', 'conn srpz', 'connsprz'],
      primaryAliases: ['connsrpz'],
      fetch: databaseAPI.getMainviewNetworkConnsrpz,
      check: databaseAPI.checkTableExistsConnsrpz,
      staticColumns: []
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
      getDisplayLabel: getCpuDisplayLabelLocal,
      parseQuery: parseCpuQuery
    },
    jespool: {
      title: 'Spool',
      aliases: ['spool', 'iş kuyruğu yönetimi', 'iş kuyruğu', 'kuyruk yönetimi', 'jespool', 'jesp', 'jes pool', 'job entry subsystem', 'job queue'],
      primaryAliases: ['spool', 'iş kuyruğu yönetimi'],
      fetch: databaseAPI.getMainviewMvsJespool,
      check: databaseAPI.checkTableExistsJespool,
      staticColumns: ['id', 'bmctime', 'time', 'smf_id', 'total_volumes', 'spool_util', 'total_tracks', 'used_tracks', 'active_spool_util', 'total_active_tracks', 'used_active_tracks', 'active_vols', 'volume', 'status', 'volume_util', 'volume_tracks', 'volume_used', 'other_vols'],
      getDisplayLabel: getSpoolDisplayLabelLocal,
      parseQuery: parseSpoolQuery
    },
    jcpu: {
      title: 'Address Space',
      aliases: ['address space', 'adres alanı yönetimi', 'adres alanı', 'adres alani', 'adres alanı', 'jcpu', 'j cpu', 'addressspace', 'address space data'],
      primaryAliases: ['address space', 'adres alanı yönetimi'],
      fetch: databaseAPI.getMainviewMvsJCPU,
      check: databaseAPI.checkTableExistsJCPU,
      staticColumns: ['jobname', 'jes_job_number', 'address_space_type', 'service_class_name', 'asgrnmc', 'job_step_being_monitored', 'all_cpu_seconds', 'unadj_cpu_util', 'using_cpu_p', 'cpu_delay_p', 'average_priority', 'tcb_time', 'srb_time', 'interval_unadj_remote_enclave_cpu_use', 'job_total_cpu_time', 'other_addr_space_enclave_cpu_time', 'ziip_total_cpu_time', 'ziip_interval_cpu_time', 'dep_enclave_ziip_total_time', 'dep_enclave_ziip_interval_time', 'dep_enclave_ziip_on_cp_total', 'interval_cp_time', 'resource_group_name', 'resource_group_type', 'recovery_process_boost', 'implicit_cpu_critical_flag', 'bmctime', 'time'],
      getDisplayLabel: getAddressSpaceDisplayLabelLocal,
      parseQuery: parseAddressSpaceQuery
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
      title: 'CSASUM',
      aliases: ['csasum', 'common storage area summary', 'common storage', 'csa summary', 'storage csa'],
      primaryAliases: ['csasum', 'common storage area summary'],
      fetch: databaseAPI.getMainviewStorageCsasum,
      check: databaseAPI.checkTableExistsCsasum,
      staticColumns: ['csa_in_use_percent', 'ecsa_in_use_percent', 'rucsa_in_use_percent', 'sqa_in_use_percent', 'total_cs_used_percent', 'percent_used_high_shared_storage', 'timestamp', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('csasum')
    },
    frminfo_center: {
      title: 'FRMINFO Central',
      aliases: ['frminfo center', 'frminfo central', 'frame information central', 'frame central', 'storage central'],
      primaryAliases: ['frminfo center', 'frminfo central'],
      fetch: databaseAPI.getMainviewStorageFrminfoCenter,
      check: databaseAPI.checkTableExistsFrminfoCenter,
      staticColumns: ['spispcav', 'spispcmn', 'spispcmx', 'spilpfav', 'spilpfmn', 'spilpfmx', 'spicpfav', 'spicpfmn', 'spicpfmx', 'spiqpcav', 'spiqpcmn', 'spiqpcmx', 'spiapfav', 'spiapfmn', 'spiapfmx', 'spiafcav', 'spiafcmn', 'spitfuav', 'spiafumn', 'spiafumx', 'spitcpct', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('frminfo_center')
    },
    frminfo_fixed: {
      title: 'FRMINFO Fixed',
      aliases: ['frminfo fixed', 'frame information fixed', 'frame fixed', 'storage fixed'],
      primaryAliases: ['frminfo fixed', 'frame information fixed'],
      fetch: databaseAPI.getMainviewStorageFrminfofixed,
      check: databaseAPI.checkTableExistsFrminfofixed,
      staticColumns: ['sqa_avg', 'sqa_min', 'sqa_max', 'lpa_avg', 'lpa_min', 'lpa_max', 'csa_avg', 'lsqa_avg', 'lsqa_min', 'lsqa_max', 'private_avg', 'private_min', 'private_max', 'fixed_below_16m_avg', 'fixed_below_16m_min', 'fixed_below_16m_max', 'fixed_total_avg', 'fixed_total_min', 'fixed_total_max', 'fixed_percentage', 'timestamp'],
      getDisplayLabel: getStorageDisplayLabelLocal('frminfo_fixed')
    },
    frminfo_high_virtual: {
      title: 'FRMINFO High Virtual',
      aliases: ['frminfo high virtual', 'frminfo highvirtual', 'frame information high virtual', 'high virtual', 'storage high virtual'],
      primaryAliases: ['frminfo high virtual', 'frame information high virtual'],
      fetch: databaseAPI.getMainviewStorageFrminfoHighVirtual,
      check: databaseAPI.checkTableExistsFrminfoHighVirtual,
      staticColumns: ['hv_common_avg', 'hv_common_min', 'hv_common_max', 'hv_shared_avg', 'hv_shared_min', 'hv_shared_max', 'timestamp', 'bmctime'],
      getDisplayLabel: getStorageDisplayLabelLocal('frminfo_high_virtual')
    },
    sysfrmiz: {
      title: 'SYSFRMIZ',
      aliases: ['sysfrmiz', 'system frame information', 'system frame', 'frame information system'],
      primaryAliases: ['sysfrmiz', 'system frame information'],
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
        const summary = buildSummary(rows, 20)
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
      console.error(`${title} query error:`, err)
      setMessages(prev => [...prev, { text: `${title} verisi alınırken bir hata oluştu.`, sender: 'bot', timestamp: getMessageTime() }])
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
      if (needle.length > 0) {
        Object.entries(datasetConfigs).forEach(([key, cfg]) => {
          const baseList = needle.length <= ALIAS_INCLUDE_MIN - 1 ? (cfg.primaryAliases || cfg.aliases) : cfg.aliases
          const hit = baseList.some(a => {
            const an = normalizeKey(a)
            return allowIncludes ? an.includes(needle) : an.startsWith(needle)
          })
          if (hit) sugs.push({ type: 'dataset', datasetKey: key, display: cfg.title, insertText: key })
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
      cols
        .filter(c => c && c.toLowerCase().includes(lastToken))
        .slice(0, 10)
        .forEach(c => sugs.push({ type: 'column', datasetKey: matchedDatasetKey, display: c, insertText: `${matchedDatasetKey} ${c}` }))
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
        .forEach(it => sugs.push({ type: 'column', datasetKey: it.datasetKey, display: `${it.column}`, insertText: `${it.datasetKey} ${it.column}` }))
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
    const msgNorm = normalizeKey(lowerMessage)
    const candidates = []
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      await ensureColumnsLoaded(key)
      const cols = columnsCache[key] || cfg.staticColumns || []
      const hit = cols.some(c => msgNorm.includes(normalizeKey(c)))
      if (hit) candidates.push(key)
    }
    if (candidates.length === 1) return candidates[0]
    return null
  }

  const findDatasetsByColumn = async (rawTerm) => {
    const term = normalizeKey(rawTerm)
    const results = []
    if (!term) return results
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      await ensureColumnsLoaded(key)
      const cols = columnsCache[key] || cfg.staticColumns || []
      for (const c of cols) {
        if (normalizeKey(c).includes(term)) {
          results.push({ datasetKey: key, title: cfg.title, column: c })
          break
        }
      }
    }
    return results
  }

  // Export utilities (command-based)
  const exportRowsToCSV = (rows, title) => {
    const dataRows = Array.isArray(rows) ? rows : []
    if (dataRows.length === 0) return
    const headerKeys = getAllKeys(dataRows)
    if (headerKeys.length === 0) return
    const escapeCsv = (v) => {
      const s = v === null || v === undefined ? '' : String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const header = headerKeys.map(escapeCsv).join(',')
    const body = dataRows.map(r => headerKeys.map(k => escapeCsv(r?.[k])).join(',')).join('\n')
    const csv = header + '\n' + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
    a.download = `${(title || 'dataset').replace(/\s+/g, '_')}_${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const ensureJsPdfLoaded = async () => {
    try {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = resolve
        s.onerror = reject
        document.body.appendChild(s)
      })
      return window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null
    } catch {
      return null
    }
  }

  const exportRowsToPDF = async (rows, title) => {
    const dataRows = Array.isArray(rows) ? rows : []
    if (dataRows.length === 0) return
    const headerKeys = getAllKeys(dataRows)
    if (headerKeys.length === 0) return

    const JsPDFCtor = await ensureJsPdfLoaded()
    if (JsPDFCtor) {
      const doc = new JsPDFCtor({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const left = 40, top = 50, lineHeight = 16
      let y = top

      const docTitle = title || 'Veri Çıktısı'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(docTitle, left, y)
      y += lineHeight
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Oluşturma: ${new Date().toLocaleString('tr-TR')}`, left, y)
      y += lineHeight * 1.5

      const maxCharsPerCol = headerKeys.map(k => {
        const maxCell = dataRows.slice(0, 200).reduce((m, r) => Math.max(m, String(r?.[k] ?? '').length), String(k).length)
        return Math.min(Math.max(maxCell, String(k).length), 40)
      })
      const charToPt = 6
      const colWidths = maxCharsPerCol.map(c => c * charToPt)
      const totalWidth = colWidths.reduce((a, b) => a + b, 0)
      const scale = totalWidth > (pageWidth - left * 2) ? (pageWidth - left * 2) / totalWidth : 1
      const widths = colWidths.map(w => w * scale)

      // Header
      let x = left
      doc.setFont('helvetica', 'bold')
      headerKeys.forEach((h, i) => {
        const text = String(h)
        doc.text(text.substring(0, Math.floor(widths[i] / charToPt)), x, y, { baseline: 'top' })
        x += widths[i]
      })
      y += lineHeight
      doc.setFont('helvetica', 'normal')

      // Rows
      const maxRows = 3000
      for (let rIndex = 0; rIndex < Math.min(dataRows.length, maxRows); rIndex++) {
        const r = dataRows[rIndex]
        x = left
        headerKeys.forEach((k, i) => {
          const raw = r?.[k]
          const cell = raw === null || raw === undefined ? '' : String(raw)
          const text = cell.substring(0, Math.floor(widths[i] / charToPt))
          doc.text(text, x, y, { baseline: 'top' })
          x += widths[i]
        })
        y += lineHeight
        if (y > pageHeight - 40) {
          doc.addPage()
          y = top
        }
      }

      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
      doc.save(`${(title || 'dataset').replace(/\s+/g, '_')}_${ts}.pdf`)
      return
    }

    // Fallback: open print dialog
    const w = window.open('', '_blank')
    if (!w) return
    const docTitle = title || 'Veri Çıktısı'
    const style = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; }
        h1 { font-size: 18px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; }
        .meta { margin: 8px 0 16px; color: #444; }
      </style>
    `
    const thead = `<tr>${headerKeys.map(h => `<th>${h}</th>`).join('')}</tr>`
    const limitRows = dataRows.slice(0, 2000)
    const tbody = limitRows.map(r => `<tr>${headerKeys.map(k => `<td>${r?.[k] ?? ''}</td>`).join('')}</tr>`).join('')
    w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\"/>${style}</head><body>`)
    w.document.write(`<h1>${docTitle}</h1>`)
    w.document.write(`<div class=\"meta\">Oluşturma: ${new Date().toLocaleString('tr-TR')}</div>`)
    w.document.write(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`)
    w.document.write('</body></html>')
    w.document.close()
    w.focus()
    w.print()
  }

  const resolveDatasetFromMessage = (lowerMessage) => {
    // Check configured datasets by aliases
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      if (cfg.aliases.some(a => lowerMessage.includes(a))) {
        return { key, title: cfg.title, fetch: cfg.fetch }
      }
    }
    // MQ special datasets
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
        if (exportType === 'excel') exportRowsToCSV(rows, ds.title)
        else exportRowsToPDF(rows, ds.title)
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

    // Network datasets (alias-aware)
    for (const [key, cfg] of Object.entries(datasetConfigs)) {
      if (cfg.aliases.some(a => lowerMessage.includes(a))) {
        await queryDataset(lowerMessage, cfg.fetch, cfg.title, key)
        return
      }
    }

    // explicit keyword fallbacks removed (aliases already cover cases)

    // Column-only queries: infer dataset if possible
    const inferred = await guessDatasetByColumn(lowerMessage)
    if (inferred) {
      const cfg = datasetConfigs[inferred]
      await queryDataset(lowerMessage, cfg.fetch, cfg.title, inferred)
      return
    }

    // If message looks like a column name, surface suggestions instead of generic fallback
    if (/^[a-zA-Z0-9_]+$/.test(lowerMessage) && lowerMessage.length >= COLUMN_SUGGEST_MIN) {
      const matches = await findDatasetsByColumn(lowerMessage)
      if (matches.length > 0) {
        const sugs = matches.slice(0, SUGGESTION_LIMIT).map(m => ({
          type: 'column', datasetKey: m.datasetKey, display: `${m.column}`, insertText: `${m.datasetKey} ${m.column}`
        }))
        setInputMessage(message)
        setSuggestions(sugs)
        setShowSuggestions(true)
        setSelectedSuggestionIndex(0)
        setIsLoading(false)
        setIsTyping(false)
        return
      }
    }

    // Fallback: anlamadı mesajı
    setMessages(prev => [...prev, { text: 'Üzgünüm, ne demek istediğinizi tam olarak anlayamadım. Lütfen daha detaylı bir soru sorun veya bir dataset adı belirtin.', sender: 'bot', timestamp: getMessageTime() }])
    setIsLoading(false)
    setIsTyping(false)

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
            const summary = buildSummary(rows, 20)
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
            const summary = buildSummary(rows, 20)
            setMessages(prev => [...prev, { text: `📦 MQ QM - Tüm Kolonlar (son değerler)\n${summary}`, sender: 'bot' }])
            return
          }
          const keys = getAllKeys(rows)
          const picked = pickColumnByMessage(lowerMessage, keys, getQmDisplayLabelLocal)
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
      if (showSuggestions && selectedSuggestionIndex >= 0) return
      e.preventDefault()
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
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      applySuggestion(suggestions[selectedSuggestionIndex] || suggestions[0])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
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
