// Sidebar.jsx
import { useState, useRef } from 'react'
import { Plus, Trash2, Edit3, BookOpen, GripVertical } from 'lucide-react'

export default function Sidebar({ data, activeBab, onSelect, onAddBab, onDeleteBab, onRenameBab, onReorderBab }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleAdd = () => {
    if (newKey && newTitle) {
      onAddBab(newKey, newTitle)
      setNewKey('')
      setNewTitle('')
      setShowAdd(false)
    }
  }

  const babKeys = data ? Object.keys(data) : []

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
      onReorderBab(fromIndex, toIndex)
    }
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleDragEnd = () => {
    dragItem.current = null
    dragOverItem.current = null
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-4 border-b">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Bab
        </button>
        {showAdd && (
          <div className="mt-3 space-y-2">
            <input
              placeholder="Key (contoh: sholat)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            />
            <input
              placeholder="Judul (contoh: Bab Sholat)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            />
            <button onClick={handleAdd} className="w-full bg-green-500 text-white py-1 rounded text-sm">
              Simpan
            </button>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto">
        {babKeys.map((key, index) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(key)}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
              activeBab === key ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical className="w-4 h-4" />
              </span>
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-sm truncate">{data[key].title}</span>
            </div>
            <div className="flex gap-1 opacity-0 hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newTitle = prompt('Judul baru:', data[key].title)
                  if (newTitle) onRenameBab(key, newTitle)
                }}
                className="text-gray-400 hover:text-blue-500"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteBab(key) }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}