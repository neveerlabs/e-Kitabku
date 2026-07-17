import { useState, useRef } from 'react'
import { Plus, Edit3, Trash2, GripVertical, X } from 'lucide-react'

export default function TopicList({ topics, onAddTopic, onEditTopic, onDeleteTopic, onReorderTopic, isBgDark = false }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTopic, setNewTopic] = useState({ id: '', title: '', content: '', tags: [] })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleAdd = () => {
    if (!newTopic.id || !newTopic.title) return alert('ID and title are required')
    onAddTopic({
      id: newTopic.id,
      title: newTopic.title,
      content: newTopic.content || '',
      tags: []
    })
    setNewTopic({ id: '', title: '', content: '', tags: [] })
    setShowAddModal(false)
  }

  const handleDeleteClick = (idx) => {
    setDeleteTarget(idx)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget !== null) {
      onDeleteTopic(deleteTarget)
      setDeleteTarget(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteTarget(null)
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
      <div className="flex justify-between items-center mb-5">
        <h3 className={`text-lg font-semibold ${isBgDark ? 'text-white drop-shadow-md' : 'text-gray-700'}`}>
          Articles
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow border-0 outline-none"
        >
          New article
        </button>
      </div>

      <div className="space-y-2">
        {topics.map((topic, idx) => (
          <div
            key={topic.id || idx}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className="flex items-center justify-between bg-white/50 backdrop-blur-md border border-gray-200/60 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <span className="cursor-grab text-gray-300 hover:text-gray-500 transition">
                <GripVertical className="w-4 h-4" />
              </span>
              <div>
                <span className="font-medium text-gray-700">{topic.title}</span>
                <code className="ml-2 text-xs bg-gray-100/70 px-2 py-0.5 rounded-full text-gray-500">{topic.id}</code>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => onEditTopic(idx)}
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200/80 hover:text-white transition-all duration-200"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(idx)}
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200/80 hover:text-red-500 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-white/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Add a new article</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  placeholder="e.g., pembatalan-sholat"
                  value={newTopic.id}
                  onChange={(e) => setNewTopic({...newTopic, id: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  placeholder="e.g., Pembatalan Sholat"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={handleDeleteCancel}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-white/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-red-600">Confirm Deletion</h3>
              <button onClick={handleDeleteCancel} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-700">
                Are you sure you want to delete this article? Once deleted, this data cannot be restored.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}