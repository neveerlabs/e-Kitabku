import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Trash2, Eye, Bold, Highlighter, AlertTriangle, Tag, List, ExternalLink, Code, HelpCircle, Image } from 'lucide-react'
import KitabPreview from './KitabPreview'
import RedirectPreview from './RedirectPreview'

export default function TopicEditor({ babKey, topicIndex, topic, onSave, onClose }) {
  const [form, setForm] = useState({
    id: topic.id,
    title: topic.title,
    content: topic.content || '',
    tags: [...(topic.tags || [])],
    previews: [...(topic.previews || [])]
  })
  const [kitabPreview, setKitabPreview] = useState(null)
  const [redirectPreview, setRedirectPreview] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showRedirectModal, setShowRedirectModal] = useState(false)
  const [modalInput, setModalInput] = useState('')
  const [modalPlaceholder, setModalPlaceholder] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [onModalConfirm, setOnModalConfirm] = useState(null)
  const previewRef = useRef(null)
  const modalInputRef = useRef(null)

  const handleSave = useCallback(() => {
    onSave({ ...topic, ...form })
  }, [onSave, topic, form])

  const syncTags = () => {
    const regex = /\(\(([^)]+)\)\)/g
    const matches = [...form.content.matchAll(regex)]
    const usedTags = [...new Set(matches.map(m => m[1]))]
    const existingTags = form.tags.map(t => t.tag)
    const missing = usedTags.filter(t => !existingTags.includes(t))
    if (missing.length > 0) {
      const newTags = [...form.tags, ...missing.map(t => ({ tag: t, header: '', kitab: '' }))]
      setForm(prev => ({ ...prev, tags: newTags }))
    }
  }

  const syncPreviews = () => {
    const regex = /<preview>([^<]+)<\/preview>/g
    const matches = [...form.content.matchAll(regex)]
    const usedNames = [...new Set(matches.map(m => m[1].trim()))]
    const existingNames = form.previews.map(p => p.name)
    const missing = usedNames.filter(n => !existingNames.includes(n))
    if (missing.length > 0) {
      const newPreviews = [...form.previews, ...missing.map(n => ({ name: n, files: [] }))]
      setForm(prev => ({ ...prev, previews: newPreviews }))
    }
  }

  const insertText = (before, after = '') => {
    const textarea = document.getElementById('content-editor')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = form.content.substring(start, end)
    const replacement = before + selectedText + after
    const newContent = form.content.substring(0, start) + replacement + form.content.substring(end)
    setForm(prev => ({ ...prev, content: newContent }))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertList = () => {
    const textarea = document.getElementById('content-editor')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = form.content.substring(start, end)
    const replacement = `<ul>\n  <li>${selectedText}</li>\n</ul>`
    const newContent = form.content.substring(0, start) + replacement + form.content.substring(end)
    setForm(prev => ({ ...prev, content: newContent }))
    setTimeout(() => {
      textarea.focus()
      const newCursor = start + 6
      textarea.setSelectionRange(newCursor, newCursor + selectedText.length)
    }, 0)
  }

  const insertRedirectButton = () => {
    setModalTitle('Sisipkan Redirect')
    setModalPlaceholder('Masukkan nama redirect (contoh: definisi1)')
    setModalInput('')
    setOnModalConfirm(() => (name) => {
      if (name && name.trim()) {
        const trimmed = name.trim()
        insertText(`<[redirect]>${trimmed}</[redirect]>`, '')
      }
    })
    setShowRedirectModal(true)
    setTimeout(() => modalInputRef.current?.focus(), 100)
  }

  const insertDefineBlock = () => {
    setModalTitle('Buat Definisi Redirect')
    setModalPlaceholder('Masukkan nama unik (contoh: definisi1)')
    setModalInput('')
    setOnModalConfirm(() => (name) => {
      if (name && name.trim()) {
        const trimmed = name.trim()
        insertText(`<[{${trimmed}}]>\n`, `\n</[{${trimmed}}]>`)
      }
    })
    setShowRedirectModal(true)
    setTimeout(() => modalInputRef.current?.focus(), 100)
  }

  const insertQuizBlock = () => {
    const textarea = document.getElementById('content-editor')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = form.content.substring(start, end) || 'Pertanyaan'
    const replacement = `<quiz>${selectedText}</quiz>\n<answer>Jawaban</answer>`
    const newContent = form.content.substring(0, start) + replacement + form.content.substring(end)
    setForm(prev => ({ ...prev, content: newContent }))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 7, start + 7 + selectedText.length)
    }, 0)
  }

  const insertPreviewTag = () => {
    setModalTitle('Sisipkan Preview')
    setModalPlaceholder('Masukkan nama preview (contoh: gambar1)')
    setModalInput('')
    setOnModalConfirm(() => (name) => {
      if (name && name.trim()) {
        insertText(`<preview>${name.trim()}</preview>`, '')
      }
    })
    setShowPreviewModal(true)
    setTimeout(() => modalInputRef.current?.focus(), 100)
  }

  const handleModalConfirm = () => {
    if (onModalConfirm) {
      onModalConfirm(modalInput)
    }
    setShowPreviewModal(false)
    setShowRedirectModal(false)
    setModalInput('')
    setOnModalConfirm(null)
  }

  const handleModalCancel = () => {
    setShowPreviewModal(false)
    setShowRedirectModal(false)
    setModalInput('')
    setOnModalConfirm(null)
  }

  const handleModalKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleModalConfirm()
    } else if (e.key === 'Escape') {
      handleModalCancel()
    }
  }

  const renderPreview = () => {
    let html = form.content

    const redirectDefs = {}
    const defineRegex = /<\[\{([^}]+)\}\]>([\s\S]*?)<\/\[\{\1\}\]>/g
    html = html.replace(defineRegex, (match, name, inner) => {
      redirectDefs[name] = inner
      return inner
    })

    html = html.replace(/<\[redirect\]>\s*([^<]+)<\/\[redirect\]>/g, (match, redirectName) => {
      const escaped = redirectName.replace(/'/g, "\\'").trim()
      return `<span class="redirect-tombol" onclick="window.previewRedirect('${escaped}')">${redirectName}</span>`
    })

    html = html.replace(/<quiz>([\s\S]*?)<\/quiz>\s*<answer>([\s\S]*?)<\/answer>/g, (match, question, answer) => {
      return `<div class="quiz-block">
        <div class="quiz-question">
          <span class="quiz-question-text">${question}</span>
          <button class="quiz-show-more">Lihat selengkapnya</button>
        </div>
        <div class="quiz-answer">${answer}</div>
      </div>`
    })

    html = html.replace(/<preview>([^<]+)<\/preview>/g, (match, name) => {
      const preview = form.previews.find(p => p.name === name.trim())
      if (!preview || preview.files.length === 0) return '<div class="catatan-text">Preview tidak tersedia</div>'
      const filesHtml = preview.files.map((f, i) => {
        if (f.type === 'video') return `<video src="/img/preview/${f.src}" controls class="preview-media ${i===0?'active':''}" data-index="${i}"></video>`
        return `<img src="/img/preview/${f.src}" class="preview-media ${i===0?'active':''}" data-index="${i}" alt="preview">`
      }).join('')
      const dots = preview.files.map((_, i) => `<span class="preview-dot ${i===0?'active':''}" data-index="${i}"></span>`).join('')
      const navButtons = preview.files.length > 1 ? `
        <button class="preview-nav prev">&lt;</button>
        <button class="preview-nav next">&gt;</button>
      ` : ''
      return `<div class="preview-container" data-preview="${name.trim()}">
        <div class="preview-media-wrapper">${filesHtml}</div>
        <div class="preview-indicators">${dots}</div>
        ${navButtons}
      </div>`
    })

    html = html.replace(/\(\(([^)]+)\)\)/g, (match, tag) => {
      const tagData = form.tags.find(t => t.tag === tag)
      if (tagData) {
        return `<span class="kitab-tombol" onclick="window.previewKitab('${tag}')">${tag}</span>`
      }
      return match
    })
    html = html.replace(/\*\*(.*?)\*\*/g, '<span class="highlight-text">$1</span>')
    html = html.replace(/!!(.*?)!!/g, '<div class="catatan-text">$1</div>')

    window.__redirectDefs = redirectDefs
    return html
  }

  useEffect(() => {
    window.previewKitab = (tag) => {
      const found = form.tags.find(t => t.tag === tag)
      if (found) {
        setKitabPreview({ header: found.header || 'Tanpa Judul', kitab: found.kitab || '' })
      }
    }
    window.previewRedirect = (name) => {
      const defs = window.__redirectDefs || {}
      const content = defs[name] || '<p>Tidak ada konten untuk nama ini.</p>'
      setRedirectPreview(content)
    }
    return () => {
      delete window.previewKitab
      delete window.previewRedirect
      delete window.__redirectDefs
    }
  }, [form.tags, form.content])

  useEffect(() => {
    if (!previewRef.current) return
    const container = previewRef.current

    const initPreviews = () => {
      const containers = container.querySelectorAll('.preview-container')
      containers.forEach(container => {
        const mediaElements = container.querySelectorAll('.preview-media')
        const dots = container.querySelectorAll('.preview-dot')
        const prevBtn = container.querySelector('.preview-nav.prev')
        const nextBtn = container.querySelector('.preview-nav.next')
        let currentIndex = 0

        const showSlide = (index) => {
          mediaElements.forEach(m => m.classList.remove('active'))
          dots.forEach(d => d.classList.remove('active'))
          if (mediaElements[index]) {
            mediaElements[index].classList.add('active')
            dots[index].classList.add('active')
            currentIndex = index
          }
        }

        if (prevBtn) {
          prevBtn.onclick = (e) => {
            e.stopPropagation()
            const newIndex = (currentIndex - 1 + mediaElements.length) % mediaElements.length
            showSlide(newIndex)
          }
        }
        if (nextBtn) {
          nextBtn.onclick = (e) => {
            e.stopPropagation()
            const newIndex = (currentIndex + 1) % mediaElements.length
            showSlide(newIndex)
          }
        }

        dots.forEach(dot => {
          dot.onclick = (e) => {
            e.stopPropagation()
            const index = parseInt(dot.getAttribute('data-index'), 10)
            showSlide(index)
          }
        })
      })
    }

    const initQuizBlocks = () => {
      const quizBlocks = container.querySelectorAll('.quiz-block')
      quizBlocks.forEach(block => {
        const textSpan = block.querySelector('.quiz-question-text')
        const showBtn = block.querySelector('.quiz-show-more')
        const questionDiv = block.querySelector('.quiz-question')
        if (!textSpan || !questionDiv) return

        function checkOverflow() {
          const isOverflow = textSpan.scrollWidth > textSpan.clientWidth
          block.classList.toggle('has-overflow', isOverflow)
        }

        function toggleBlock(e) {
          block.classList.toggle('expanded')
          if (block.classList.contains('expanded')) {
            block.classList.remove('has-overflow')
          } else {
            requestAnimationFrame(() => {
              setTimeout(checkOverflow, 50)
            })
          }
        }

        questionDiv.removeEventListener('click', toggleBlock)
        if (showBtn) {
          showBtn.removeEventListener('click', toggleBlock)
        }

        questionDiv.addEventListener('click', toggleBlock)
        if (showBtn) {
          showBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            toggleBlock(e)
          })
        }

        requestAnimationFrame(() => {
          setTimeout(checkOverflow, 100)
        })
      })
    }

    initPreviews()
    initQuizBlocks()
  }, [form.content, form.previews, form.tags])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const addFileToPreview = (previewIndex) => {
    const newPreviews = [...form.previews]
    newPreviews[previewIndex].files.push({ src: '', type: 'image' })
    setForm(prev => ({ ...prev, previews: newPreviews }))
  }

  const updatePreviewFile = (previewIndex, fileIndex, field, value) => {
    const newPreviews = [...form.previews]
    newPreviews[previewIndex].files[fileIndex][field] = value
    setForm(prev => ({ ...prev, previews: newPreviews }))
  }

  const removePreviewFile = (previewIndex, fileIndex) => {
    const newPreviews = [...form.previews]
    newPreviews[previewIndex].files.splice(fileIndex, 1)
    setForm(prev => ({ ...prev, previews: newPreviews }))
  }

  const removePreview = (index) => {
    const newPreviews = form.previews.filter((_, i) => i !== index)
    setForm(prev => ({ ...prev, previews: newPreviews }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Edit Artikel: {topic.title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">ID</label>
                <input value={form.id} onChange={e => setForm({...form, id: e.target.value})}
                  className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Judul</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Konten (HTML + Markup Khusus)</label>
                <div className="flex gap-1 mb-2 overflow-x-auto whitespace-nowrap py-1">
                  <button onClick={() => insertText('((', '))')} title="Sisipkan kitab tag"
                    className="px-2 py-1 bg-yellow-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <Tag className="w-3 h-3" /> Kitab
                  </button>
                  <button onClick={() => insertText('**', '**')} title="Highlight teks (seperti seleksi)"
                    className="px-2 py-1 bg-yellow-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <Highlighter className="w-3 h-3" /> Select
                  </button>
                  <button onClick={() => insertText('<b>', '</b>')} title="Tebalkan teks (HTML bold)"
                    className="px-2 py-1 bg-yellow-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <Bold className="w-3 h-3" /> Bold
                  </button>
                  <button onClick={() => insertText('!!', '!!')} title="Catatan penting"
                    className="px-2 py-1 bg-yellow-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <AlertTriangle className="w-3 h-3" /> Note
                  </button>
                  <button onClick={insertList} title="Masukkan daftar"
                    className="px-2 py-1 bg-yellow-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <List className="w-3 h-3" /> List
                  </button>
                  <button onClick={insertRedirectButton} title="Sisipkan tombol redirect"
                    className="px-2 py-1 bg-green-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <ExternalLink className="w-3 h-3" /> Redirect
                  </button>
                  <button onClick={insertDefineBlock} title="Sisipkan blok definisi redirect"
                    className="px-2 py-1 bg-green-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <Code className="w-3 h-3" /> Define
                  </button>
                  <button onClick={insertQuizBlock} title="Sisipkan Quiz"
                    className="px-2 py-1 bg-purple-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <HelpCircle className="w-3 h-3" /> Quiz
                  </button>
                  <button onClick={insertPreviewTag} title="Sisipkan preview gambar/video"
                    className="px-2 py-1 bg-pink-100 border rounded text-xs flex items-center gap-1 flex-shrink-0">
                    <Image className="w-3 h-3" /> Preview
                  </button>
                  <button onClick={syncTags} className="px-2 py-1 bg-blue-100 border rounded text-xs flex-shrink-0 ml-auto">
                    Sync Tags
                  </button>
                  <button onClick={syncPreviews} className="px-2 py-1 bg-blue-100 border rounded text-xs flex-shrink-0">
                    Sync Preview
                  </button>
                </div>
                <textarea
                  id="content-editor"
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  rows={15}
                  className="w-full border px-3 py-2 rounded font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Daftar Tags</h4>
                  <button onClick={() => setForm(prev => ({
                    ...prev,
                    tags: [...prev.tags, { tag: '', header: '', kitab: '' }]
                  }))} className="text-sm text-blue-600 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Tag
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {form.tags.map((tag, idx) => (
                    <div key={idx} className="border p-3 rounded space-y-2 bg-gray-50">
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold">Tag #{idx+1}</span>
                        <button onClick={() => {
                          const newTags = form.tags.filter((_, i) => i !== idx)
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <input placeholder="Teks tag (harus sama persis)" value={tag.tag}
                        onChange={e => {
                          const newTags = [...form.tags]
                          newTags[idx].tag = e.target.value
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }}
                        className="w-full border px-2 py-1 rounded text-sm"
                      />
                      <input placeholder="Header (judul modal kitab)" value={tag.header}
                        onChange={e => {
                          const newTags = [...form.tags]
                          newTags[idx].header = e.target.value
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }}
                        className="w-full border px-2 py-1 rounded text-sm"
                      />
                      <textarea placeholder="Isi kitab (HTML, aksara Arab)" value={tag.kitab}
                        onChange={e => {
                          const newTags = [...form.tags]
                          newTags[idx].kitab = e.target.value
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }}
                        rows={6}
                        className="w-full border px-2 py-1 rounded text-sm font-mono min-h-[120px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Daftar Preview</h4>
                  <button onClick={() => setForm(prev => ({
                    ...prev,
                    previews: [...prev.previews, { name: '', files: [] }]
                  }))} className="text-sm text-blue-600 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Preview
                  </button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {form.previews.map((preview, pIdx) => (
                    <div key={pIdx} className="border p-3 rounded space-y-2 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <input placeholder="Nama unik preview" value={preview.name}
                          onChange={e => {
                            const newPreviews = [...form.previews]
                            newPreviews[pIdx].name = e.target.value
                            setForm(prev => ({ ...prev, previews: newPreviews }))
                          }}
                          className="w-2/3 border px-2 py-1 rounded text-sm"
                        />
                        <button onClick={() => removePreview(pIdx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-2">
                        {preview.files.map((file, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                            <input placeholder="Nama file (misal: foto.jpg)" value={file.src}
                              onChange={e => updatePreviewFile(pIdx, fIdx, 'src', e.target.value)}
                              className="flex-1 border px-2 py-1 rounded text-sm"
                            />
                            <select value={file.type} onChange={e => updatePreviewFile(pIdx, fIdx, 'type', e.target.value)}
                              className="border px-2 py-1 rounded text-sm">
                              <option value="image">Gambar</option>
                              <option value="video">Video</option>
                            </select>
                            <button onClick={() => removePreviewFile(pIdx, fIdx)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button onClick={() => addFileToPreview(pIdx)} className="text-xs text-blue-600 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Tambah File
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Simpan
              </button>
              <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                Batal
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 border-l p-4 overflow-y-auto bg-gray-50" ref={previewRef}>
            <h4 className="font-medium flex items-center gap-1 mb-2"><Eye className="w-4 h-4" /><i> Mobile preview</i></h4>
            <div className="bg-white border rounded p-4 shadow-inner max-w-full"
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
            <style>{`
              .artikel-isi {
                font-size: 1rem;
                line-height: 1.8;
                color: #3f3324;
                text-align: justify;
              }
              .artikel-isi p {
                margin-bottom: 1.2rem;
              }
              .highlight-text {
                background-color: #fff1c0 !important;
                padding: 2px 4px;
                border-radius: 6px;
                font-weight: 500;
              }
              .catatan-text {
                font-style: italic;
                color: #6b4f39;
                background: rgba(200, 170, 140, 0.1);
                padding: 10px 15px;
                border-left: 4px solid #b5926a;
                margin: 15px 0;
                border-radius: 0 12px 12px 0;
                font-size: 0.95rem;
              }
              .kitab-tombol {
                display: inline-block;
                background: #e6d5b8;
                color: #4f3f30;
                padding: 2px 12px;
                border-radius: 30px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid #b5926a;
                transition: all 0.2s;
                margin: 0 4px;
                white-space: nowrap;
              }
              .kitab-tombol:hover {
                background: #d4b690;
                transform: scale(1.02);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .redirect-tombol {
                display: inline-block;
                background: #e6d5b8;
                color: #4f3f30;
                padding: 2px 12px;
                border-radius: 30px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid #b5926a;
                transition: all 0.2s;
                margin: 0 4px;
                white-space: nowrap;
              }
              .redirect-tombol:hover {
                background: #d4b690;
                transform: scale(1.02);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .quiz-block {
                background: #fefaf4;
                border: 1px solid #d8bc9c;
                border-radius: 20px;
                margin: 15px 0;
                overflow: hidden;
              }
              .quiz-block .quiz-question {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                cursor: pointer;
                gap: 8px;
              }
              .quiz-block .quiz-question-text {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: #4f3f30;
                font-size: 1rem;
                line-height: 1.7;
              }
              .quiz-block.expanded .quiz-question-text {
                white-space: normal;
                overflow: visible;
              }
              .quiz-block .quiz-show-more {
                flex-shrink: 0;
                background: #e6d5b8;
                border: 1px solid #b5926a;
                border-radius: 30px;
                padding: 2px 12px;
                font-size: 0.85rem;
                color: #4f3f30;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                display: none;
              }
              .quiz-block.has-overflow:not(.expanded) .quiz-show-more {
                display: inline-block;
              }
              .quiz-block.expanded .quiz-show-more {
                display: none;
              }
              .quiz-show-more:hover {
                background: #d4b690;
              }
              .quiz-block .quiz-answer {
                display: none;
                padding: 0 15px 15px;
                border-top: 1px dashed #d8bc9c;
                color: #3f3324;
                font-size: 1rem;
                line-height: 1.7;
              }
              .quiz-block.expanded .quiz-answer {
                display: block;
              }
              .preview-container {
                position: relative;
                max-width: 100%;
                margin: 20px 0;
                text-align: center;
                overflow: hidden;
              }
              .preview-media-wrapper {
                position: relative;
              }
              .preview-media {
                display: none;
                max-width: 100%;
                max-height: 300px;
                margin: 0 auto;
                border-radius: 16px;
                object-fit: contain;
              }
              .preview-media.active {
                display: block;
              }
              .preview-indicators {
                display: flex;
                justify-content: center;
                gap: 6px;
                margin-top: 10px;
              }
              .preview-dot {
                width: 8px;
                height: 8px;
                background: #d8bc9c;
                border-radius: 50%;
                cursor: pointer;
                transition: 0.2s;
              }
              .preview-dot.active {
                background: #a88664;
                width: 10px;
                height: 10px;
              }
              .preview-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(200, 180, 160, 0.6);
                border: none;
                font-size: 2rem;
                color: #4f3f30;
                cursor: pointer;
                padding: 0 10px;
                line-height: 1;
                border-radius: 30px;
                backdrop-filter: blur(4px);
                transition: opacity 0.25s ease, background 0.2s;
                z-index: 10;
                opacity: 0.7;
              }
              .preview-nav:hover {
                background: rgba(180, 150, 120, 0.8);
                opacity: 1;
              }
              .preview-container:hover .preview-nav {
                opacity: 1;
              }
              .preview-nav.prev {
                left: 10px;
              }
              .preview-nav.next {
                right: 10px;
              }
              ul, ol {
                list-style-type: disc;
                padding-left: 20px;
                margin: 0.5rem 0;
              }
              ol {
                list-style-type: decimal;
              }
              li {
                margin-bottom: 0.25rem;
              }
              .bg-white.border.rounded.p-4 {
                max-width: 100%;
                overflow-x: hidden;
              }
            `}</style>
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{modalTitle}</h3>
              <button onClick={handleModalCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <input
                ref={modalInputRef}
                type="text"
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyDown={handleModalKeyDown}
                placeholder={modalPlaceholder}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleModalCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRedirectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{modalTitle}</h3>
              <button onClick={handleModalCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <input
                ref={modalInputRef}
                type="text"
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                onKeyDown={handleModalKeyDown}
                placeholder={modalPlaceholder}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleModalCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {kitabPreview && (
        <KitabPreview header={kitabPreview.header} kitab={kitabPreview.kitab} onClose={() => setKitabPreview(null)} />
      )}
      {redirectPreview && (
        <RedirectPreview content={redirectPreview} onClose={() => setRedirectPreview(null)} />
      )}
    </div>
  )
}
