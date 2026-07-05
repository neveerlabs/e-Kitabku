import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

export default function EditorModal({ mode, babKey, topicIndex, data, onClose, onUpdateTopic, onUpdateTags, onUpdateBabTitle }) {
  const topic = data[babKey]?.topics[topicIndex]
  const [form, setForm] = useState({ id: '', title: '', content: '', tags: [] })

  useEffect(() => {
    if (mode === 'topic' && topic) {
      setForm({
        id: topic.id,
        title: topic.title,
        content: topic.content,
        tags: [...topic.tags]
      })
    } else if (mode === 'tags' && topic) {
      setForm({ tags: [...topic.tags] })
    }
  }, [mode, topic])

  const handleSaveTopic = () => {
    if (topic) {
      onUpdateTopic(babKey, topicIndex, { ...topic, ...form })
    }
    onClose()
  }

  const handleSaveTags = () => {
    if (topic) {
      onUpdateTags(babKey, topicIndex, form.tags)
    }
    onClose()
  }

  const addTag = () => {
    setForm(prev => ({
      ...prev,
      tags: [...prev.tags, { tag: '', header: '', kitab: '' }]
    }))
  }

  const updateTag = (index, field, value) => {
    const newTags = [...form.tags]
    newTags[index][field] = value
    setForm(prev => ({ ...prev, tags: newTags }))
  }

  const removeTag = (index) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            {mode === 'topic' ? 'Edit Artikel' : mode === 'tags' ? 'Edit Tags' : 'Edit Judul Bab'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'topic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  value={form.id}
                  onChange={e => setForm({...form, id: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konten (HTML)</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  rows={6}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm font-mono"
                />
              </div>
              <button
                onClick={handleSaveTopic}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Simpan
              </button>
            </>
          )}

          {mode === 'tags' && (
            <>
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-700">Daftar Tags</h4>
                <button onClick={addTag} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                  <Plus className="w-4 h-4" />
                  Tambah Tag
                </button>
              </div>
              {form.tags.map((tag, idx) => (
                <div key={idx} className="border border-gray-200 p-3 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Tag #{idx+1}</span>
                    <button onClick={() => removeTag(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    placeholder="Tag (cth: Lihat Hlm 48 Jld 1)"
                    value={tag.tag}
                    onChange={e => updateTag(idx, 'tag', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="Header sumber kitab"
                    value={tag.header}
                    onChange={e => updateTag(idx, 'header', e.target.value)}
                    className="w-full border border-gray-300 px-2 py-1 rounded text-sm"
                  />
                  <textarea
                    placeholder="Isi kitab (HTML Arab)"
                    value={tag.kitab}
                    onChange={e => updateTag(idx, 'kitab', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 px-2 py-1 rounded text-sm font-mono"
                  />
                </div>
              ))}
              <button
                onClick={handleSaveTags}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Simpan Tags
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}