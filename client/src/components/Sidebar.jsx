import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Edit3, BookOpen, GripVertical, Github, X } from 'lucide-react'
import axios from 'axios'

export default function Sidebar({ data, activeBab, onSelect, onAddBab, onDeleteBab, onRenameBab, onReorderBab }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [hoverCard, setHoverCard] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState(null)
  const [githubData, setGithubData] = useState(null)
  const [loading, setLoading] = useState(false)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)
  const cardRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const fetchGithubData = async () => {
      if (githubData) return
      setLoading(true)
      try {
        const res = await axios.get('https://api.github.com/users/neveerlabs')
        setGithubData({
          avatar: res.data.avatar_url,
          name: res.data.name || 'neveerlabs',
          bio: res.data.bio || 'Developer & Content Creator',
          repos: res.data.public_repos || 0,
          followers: res.data.followers || 0,
          following: res.data.following || 0
        })
      } catch (err) {
        console.error('[GitHub] Failed to fetch user data:', err)
        setGithubData({
          avatar: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
          name: 'neveerlabs',
          bio: 'GitHub Profile',
          repos: 0,
          followers: 0,
          following: 0
        })
      } finally {
        setLoading(false)
      }
    }
    fetchGithubData()
  }, [])

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

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setHoverCard(true)
    }, 400)
    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setTimeout(() => {
      setHoverCard(false)
    }, 200)
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

      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm p-2 relative">
        <div
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
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
          </a>

          {hoverCard && githubData && !loading && (
            <div
              ref={cardRef}
              className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-fade-in-up"
            >
              <a
                href="https://github.com/neveerlabs/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="p-4">
                  {/* Header: Avatar + Nama */}
                  <div className="flex items-center gap-3">
                    <img
                      src={githubData.avatar}
                      alt="neveerlabs"
                      className="w-12 h-12 rounded-full border-2 border-gray-200 flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">
                        M. Syalman Al Farizi
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        @neveerlabs
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Developer & Content Creator
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {githubData.repos} repositori
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {githubData.followers} pengikut
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {githubData.following} menci
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Github className="w-3 h-3" />
                      github.com/neveerlabs
                      <svg className="w-3 h-3 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

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