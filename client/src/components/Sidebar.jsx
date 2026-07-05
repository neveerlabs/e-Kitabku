import { useState, useRef } from 'react'
import { Plus, Trash2, Edit3, BookOpen, GripVertical, Github, X } from 'lucide-react'

export default function Sidebar({ data, activeBab, onSelect, onAddBab, onDeleteBab, onRenameBab, onReorderBab }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
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

  const handleDeleteClick = (key) => {
    setDeleteTarget(key)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget !== null) {
      onDeleteBab(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      <div className="p-4 border-b flex-shrink-0">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm transition"
        >
          <Plus className="w-4 h-4" /> Tambah Bab
        </button>
        {showAdd && (
          <div className="mt-3 space-y-2">
            <input
              placeholder="Key (contoh: sholat)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              placeholder="Judul (contoh: Bab Sholat)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button onClick={handleAdd} className="w-full bg-green-500 text-white py-1 rounded text-sm hover:bg-green-600 transition">
              Simpan
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {babKeys.map((key, index) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(key)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-50 transition ${
              activeBab === key ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical className="w-4 h-4" />
              </span>
              <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm truncate">{data[key].title}</span>
            </div>
            <div className="flex gap-1 opacity-0 hover:opacity-100 transition">
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
                onClick={(e) => { e.stopPropagation(); handleDeleteClick(key) }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm p-2">
        <a
          href="https://github.com/neveerlabs/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 w-full h-full bg-white/80 hover:bg-white border border-gray-200/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <Github className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
            neveerlabs
          </span>
          <span className="ml-auto text-gray-400 group-hover:text-gray-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        </a>
      </div>

      {/* Modal Konfirmasi Hapus Bab */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-red-600">Konfirmasi Hapus Bab</h3>
              <button onClick={handleDeleteCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-700">
                Apakah Anda yakin ingin menghapus bab <strong>"{data[deleteTarget]?.title}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Semua artikel di dalam bab ini juga akan terhapus. Data yang dihapus tidak dapat dikembalikan.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}