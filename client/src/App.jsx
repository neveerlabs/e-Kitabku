import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { Search, File, X, Pencil, Trash2 } from 'lucide-react'
import Sidebar from './components/Sidebar'
import TopicList from './components/TopicList'
import TopicEditor from './components/TopicEditor'
import PathInput from './components/PathInput'
import Toast from './components/Toast'
import TickerBar from './components/TickerBar'

function App() {
  const [data, setData] = useState(null)
  const [activeBab, setActiveBab] = useState(null)
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingTopic, setEditingTopic] = useState(null)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showFloatingSearch, setShowFloatingSearch] = useState(false)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const floatingSearchRef = useRef(null)
  const floatingInputRef = useRef(null)

  const [backgroundImage, setBackgroundImage] = useState(() => localStorage.getItem('kitabku-bg') || '')
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [bgFiles, setBgFiles] = useState([])
  const [isBgDark, setIsBgDark] = useState(false)

  useEffect(() => {
    localStorage.setItem('kitabku-bg', backgroundImage)
    if (!backgroundImage) {
      setIsBgDark(false)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = backgroundImage
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      let r = 0, g = 0, b = 0
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      const count = data.length / 4
      r /= count
      g /= count
      b /= count
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      setIsBgDark(luminance < 128)
    }
    img.onerror = () => setIsBgDark(false)
  }, [backgroundImage])

  const fetchBgFiles = useCallback(async () => {
    try {
      const res = await axios.get('/api/backgrounds')
      setBgFiles(res.data)
    } catch (e) {
      console.error('Failed to load background images:', e)
    }
  }, [])

  const handleSelectBg = (file) => {
    setBackgroundImage(`/background/${file}`)
    setShowBgPicker(false)
  }

  const handleRemoveBg = () => {
    setBackgroundImage('')
    setShowBgPicker(false)
  }

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchData = async () => {
    if (!path) return
    setLoading(true)
    try {
      const res = await axios.get('/api/data')
      setData(res.data)
      setError('')
      const keys = Object.keys(res.data)
      if (keys.length > 0 && !activeBab) setActiveBab(keys[0])
    } catch (e) {
      console.error('[Kitabku Editor] Failed to fetch data:', e);
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPath = async (newPath) => {
    setPath(newPath)
    try {
      await axios.post('/api/set-path', { path: newPath })
      const res = await axios.get('/api/data')
      setData(res.data)
      const keys = Object.keys(res.data)
      if (keys.length > 0) setActiveBab(keys[0])
      setError('')
    } catch (e) {
      console.error('[Kitabku Editor] Set path error:', e);
      setError(e.response?.data?.error || 'Invalid path')
    }
  }

  const saveData = async (newData) => {
    try {
      const res = await axios.put('/api/data', newData)
      setData(newData)
      if (res.data.synced) {
        showToast('Data saved and synced to GitHub', 'success')
      } else {
        showToast('Data saved locally (GitHub sync failed or skipped)', 'warning')
      }
    } catch (e) {
      console.error('[Kitabku Editor] Save failed:', e)
      setError('Failed to save')
      showToast('Failed to save data', 'error')
    }
  }

  const addBab = (key, title) => {
    if (!key || data[key]) return alert('Key already exists or empty')
    const newData = { ...data, [key]: { title, topics: [] } }
    saveData(newData)
  }

  const deleteBab = (key) => {
    if (!confirm(`Delete chapter "${key}"?`)) return
    const newData = { ...data }
    delete newData[key]
    saveData(newData)
    if (activeBab === key) setActiveBab(null)
  }

  const updateBabTitle = (key, newTitle) => {
    const newData = { ...data }
    newData[key].title = newTitle
    saveData(newData)
  }

  const reorderBab = (oldIndex, newIndex) => {
    if (!data || oldIndex === newIndex) return
    const keys = Object.keys(data)
    if (oldIndex < 0 || newIndex < 0 || oldIndex >= keys.length || newIndex >= keys.length) return
    const reorderedKeys = [...keys]
    const [movedKey] = reorderedKeys.splice(oldIndex, 1)
    reorderedKeys.splice(newIndex, 0, movedKey)
    const newData = {}
    reorderedKeys.forEach(key => {
      newData[key] = data[key]
    })
    saveData(newData)
  }

  const addTopic = (babKey, topic) => {
    const newData = { ...data }
    newData[babKey].topics.push(topic)
    saveData(newData)
  }

  const updateTopic = (babKey, index, updatedTopic) => {
    const newData = { ...data }
    newData[babKey].topics[index] = updatedTopic
    saveData(newData)
  }

  const deleteTopic = (babKey, index) => {
    const newData = { ...data }
    newData[babKey].topics.splice(index, 1)
    saveData(newData)
  }

  const reorderTopic = (babKey, oldIndex, newIndex) => {
    if (!data || !data[babKey] || oldIndex === newIndex) return
    const topics = data[babKey].topics
    if (oldIndex < 0 || newIndex < 0 || oldIndex >= topics.length || newIndex >= topics.length) return
    const newTopics = [...topics]
    const [moved] = newTopics.splice(oldIndex, 1)
    newTopics.splice(newIndex, 0, moved)
    const newData = { ...data }
    newData[babKey] = { ...newData[babKey], topics: newTopics }
    saveData(newData)
  }

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    if (!query.trim() || !data) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    const q = query.toLowerCase().trim()
    const results = []
    for (const [key, bab] of Object.entries(data)) {
      if (bab.title.toLowerCase().includes(q)) {
        results.push({ type: 'bab', key, title: bab.title })
      }
      if (bab.topics && Array.isArray(bab.topics)) {
        bab.topics.forEach((topic, index) => {
          if (topic.title.toLowerCase().includes(q)) {
            results.push({ type: 'artikel', babKey: key, topicIndex: index, title: topic.title, id: topic.id })
          }
        })
      }
    }
    setSearchResults(results.slice(0, 20))
    setShowSearchResults(true)
  }, [data])

  const handleResultClick = (result) => {
    setShowSearchResults(false)
    setSearchQuery('')
    setShowFloatingSearch(false)
    if (result.type === 'bab') {
      setActiveBab(result.key)
    } else if (result.type === 'artikel') {
      setActiveBab(result.babKey)
      setTimeout(() => {
        setEditingTopic({ babKey: result.babKey, topicIndex: result.topicIndex })
      }, 50)
    }
  }

  const closeFloatingSearch = () => {
    setShowFloatingSearch(false)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false)
      }
      if (floatingSearchRef.current && !floatingSearchRef.current.contains(e.target)) {
        closeFloatingSearch()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (editingTopic) {
          setShowFloatingSearch(true)
          setSearchQuery('')
          setShowSearchResults(false)
          setTimeout(() => floatingInputRef.current?.focus(), 50)
        } else if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
      if (e.key === 'Escape' && showFloatingSearch) {
        closeFloatingSearch()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingTopic, showFloatingSearch])

  useEffect(() => {
    if (showBgPicker) {
      fetchBgFiles()
    }
  }, [showBgPicker, fetchBgFiles])

  if (!path) {
    return <PathInput onSetPath={handleSetPath} error={error} />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        data={data}
        activeBab={activeBab}
        onSelect={setActiveBab}
        onAddBab={addBab}
        onDeleteBab={deleteBab}
        onRenameBab={updateBabTitle}
        onReorderBab={reorderBab}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TickerBar />
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {data && activeBab ? data[activeBab]?.title : 'Select Chapter'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative search-input-wrapper" ref={searchRef}>
              <div className="flex items-center border border-gray-300 rounded-md px-3 py-1 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Searching..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim() && searchResults.length > 0) {
                      setShowSearchResults(true)
                    }
                  }}
                  className="outline-none bg-transparent text-sm w-48 md:w-64 pr-6"
                />
                <span className="shortcut-indicator text-xs text-gray-400 pointer-events-none absolute right-8">
                  Ctrl+K
                </span>
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar z-50 min-w-[200px] max-w-md">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                    >
                      <span className="text-sm truncate">{result.title}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        result.type === 'bab' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {result.type === 'bab' ? 'Chapter' : 'Article'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-center text-sm text-gray-500 z-50">
                  No data available
                </div>
              )}
            </div>
            <button onClick={fetchData} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition">
              Refresh
            </button>
            <div className="flex items-center gap-1.5 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200/60 shadow-sm transition-all hover:bg-gray-200/80 hover:border-gray-300 cursor-default">
              <File className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 font-mono leading-none whitespace-nowrap">
                {path}
              </span>
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto p-6 relative"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'auto'
          }}
        >
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {data && activeBab && (
            <TopicList
              topics={data[activeBab]?.topics || []}
              onAddTopic={(topic) => addTopic(activeBab, topic)}
              onEditTopic={(index) => setEditingTopic({ babKey: activeBab, topicIndex: index })}
              onDeleteTopic={(index) => deleteTopic(activeBab, index)}
              onReorderTopic={(oldIndex, newIndex) => reorderTopic(activeBab, oldIndex, newIndex)}
              isBgDark={isBgDark}
            />
          )}

          <button
            onClick={() => setShowBgPicker(true)}
            className="fixed bottom-6 right-6 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 z-40 opacity-0 hover:opacity-100"
            title="Change background"
          >
            <Pencil className="w-5 h-5 text-gray-600" />
          </button>
        </main>
      </div>

      {editingTopic && (
        <TopicEditor
          babKey={editingTopic.babKey}
          topicIndex={editingTopic.topicIndex}
          topic={data[editingTopic.babKey].topics[editingTopic.topicIndex]}
          onSave={(updatedTopic) => {
            updateTopic(editingTopic.babKey, editingTopic.topicIndex, updatedTopic)
          }}
          onClose={() => setEditingTopic(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showFloatingSearch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[100] pt-16 px-4">
          <div
            ref={floatingSearchRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100/20"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={floatingInputRef}
                type="text"
                placeholder="Searching..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 outline-none bg-transparent text-base text-gray-800 placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={closeFloatingSearch}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {showSearchResults && (
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 transition"
                    >
                      <span className="text-sm text-gray-800">{result.title}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        result.type === 'bab' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {result.type === 'bab' ? 'Chapter' : 'Article'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    We couldn't find anything for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
            {!searchQuery && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Enter keywords to search...
              </div>
            )}
            <div className="px-4 py-2 bg-gray-50/80 text-xs text-gray-400 flex justify-between items-center border-t border-gray-100">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 text-[10px] font-mono">Ctrl+K</kbd> to open</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 text-[10px] font-mono">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}

      {showBgPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowBgPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Choose Background</h3>
              <button onClick={() => setShowBgPicker(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-3 gap-3">
                {bgFiles.map((file) => (
                  <div
                    key={file}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 cursor-pointer transition"
                    onClick={() => handleSelectBg(file)}
                  >
                    <img
                      src={`/background/${file}`}
                      alt={file}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={handleRemoveBg}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
              >
                <Trash2 className="w-4 h-4" /> Remove Background
              </button>
              <button
                onClick={() => setShowBgPicker(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App