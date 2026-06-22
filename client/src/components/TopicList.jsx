// TopicList.jsx
import { useState, useRef } from 'react'
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react'

export default function TopicList({ topics, onAddTopic, onEditTopic, onDeleteTopic, onReorderTopic }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTopic, setNewTopic] = useState({ id: '', title: '', content: '', tags: [] })
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleAdd = () => {
    if (!newTopic.id || !newTopic.title) return alert('ID dan judul wajib')
    onAddTopic({
      id: newTopic.id,
      title: newTopic.title,
      content: newTopic.content || '',
      tags: []
    })
    setNewTopic({ id: '', title: '', content: '', tags: [] })
    setShowAdd(false)
  }

  const handleDragStart = (e, index) => {
    dragItem.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    dragOverItem.current = index
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const fromIndex = dragItem.current
    const toIndex = dragOverItem.current
    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onReorderTopic(fromIndex, toIndex)
    }
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleDragEnd = () => {
    dragItem.current = null
    dragOverItem.current = null
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Daftar Topik</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          <Plus className="w-4 h-4" /> Topik Baru
        </button>
      </div>
      {showAdd && (
        <div className="bg-white border p-4 rounded mb-4 grid grid-cols-2 gap-2">
          <input placeholder="ID" value={newTopic.id} onChange={e => setNewTopic({...newTopic, id: e.target.value})} className="border px-2 py-1 rounded text-sm" />
          <input placeholder="Judul" value={newTopic.title} onChange={e => setNewTopic({...newTopic, title: e.target.value})} className="border px-2 py-1 rounded text-sm" />
          <button onClick={handleAdd} className="col-span-2 bg-blue-500 text-white py-1 rounded text-sm">Tambah</button>
        </div>
      )}
      <div className="space-y-2">
        {topics.map((topic, idx) => (
          <div
            key={topic.id || idx}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className="flex items-center justify-between bg-white border p-3 rounded cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical className="w-4 h-4" />
              </span>
              <div>
                <span className="font-medium">{topic.title}</span>
                <code className="ml-2 text-xs bg-gray-100 px-1 rounded">{topic.id}</code>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEditTopic(idx)} className="text-gray-400 hover:text-blue-500">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => onDeleteTopic(idx)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}