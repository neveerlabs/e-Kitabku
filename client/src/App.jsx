// client/src/App.jsx
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import TopicList from './components/TopicList'
import TopicEditor from './components/TopicEditor'
import PathInput from './components/PathInput'
import Toast from './components/Toast'

function App() {
  const [data, setData] = useState(null)
  const [activeBab, setActiveBab] = useState(null)
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingTopic, setEditingTopic] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchData = async () => {
    if (!path) return
    setLoading(true)
    try {
      console.log('[Kitabku Editor] Fetching data from server...');
      const res = await axios.get('/api/data')
      setData(res.data)
      setError('')
      const keys = Object.keys(res.data)
      if (keys.length > 0 && !activeBab) setActiveBab(keys[0])
      console.log('[Kitabku Editor] Data fetched successfully');
    } catch (e) {
      console.error('[Kitabku Editor] Failed to fetch data:', e);
      setError('Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPath = async (newPath) => {
    setPath(newPath)
    try {
      console.log(`[Kitabku Editor] Setting path: ${newPath}`);
      await axios.post('/api/set-path', { path: newPath })
      const res = await axios.get('/api/data')
      setData(res.data)
      const keys = Object.keys(res.data)
      if (keys.length > 0) setActiveBab(keys[0])
      setError('')
      console.log('[Kitabku Editor] Path set and data loaded');
    } catch (e) {
      console.error('[Kitabku Editor] Set path error:', e);
      setError(e.response?.data?.error || 'Path tidak valid')
    }
  }

  const saveData = async (newData) => {
    try {
      console.log('[Kitabku Editor] Saving data...');
      const res = await axios.put('/api/data', newData)
      setData(newData)
      console.log('[Kitabku Editor] Save successful');
      if (res.data.synced) {
        showToast('Data saved and synced to GitHub', 'success');
        console.log('[Kitabku Editor] GitHub sync successful');
      } else {
        showToast('Data saved locally (GitHub sync failed or skipped)', 'warning');
        console.warn('[Kitabku Editor] GitHub sync may have failed');
      }
    } catch (e) {
      console.error('[Kitabku Editor] Save failed:', e);
      setError('Gagal menyimpan')
      showToast('Failed to save data', 'error');
    }
  }

  const addBab = (key, title) => {
    if (!key || data[key]) return alert('Key sudah ada / kosong')
    const newData = { ...data, [key]: { title, topics: [] } }
    saveData(newData)
  }

  const deleteBab = (key) => {
    if (!confirm(`Hapus bab "${key}"?`)) return
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
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {data && activeBab ? data[activeBab]?.title : 'Pilih Bab'}
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
              Refresh
            </button>
            <span className="text-xs text-gray-500 truncate max-w-xs">{path}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading && <p className="text-gray-500">Memuat...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {data && activeBab && (
            <TopicList
              topics={data[activeBab]?.topics || []}
              onAddTopic={(topic) => addTopic(activeBab, topic)}
              onEditTopic={(index) => setEditingTopic({ babKey: activeBab, topicIndex: index })}
              onDeleteTopic={(index) => deleteTopic(activeBab, index)}
              onReorderTopic={(oldIndex, newIndex) => reorderTopic(activeBab, oldIndex, newIndex)}
            />
          )}
        </main>
      </div>

      {editingTopic && (
        <TopicEditor
          babKey={editingTopic.babKey}
          topicIndex={editingTopic.topicIndex}
          topic={data[editingTopic.babKey].topics[editingTopic.topicIndex]}
          onSave={(updatedTopic) => {
            updateTopic(editingTopic.babKey, editingTopic.topicIndex, updatedTopic)
            setEditingTopic(null)
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
    </div>
  )
}

export default App