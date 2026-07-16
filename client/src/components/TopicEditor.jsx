import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Trash2, Eye, Bold, Italic, Highlighter, AlertTriangle, Tag, List, ExternalLink, Code, HelpCircle, Image, AlignJustify } from 'lucide-react'
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
  const editorTextareaRef = useRef(null)
  const previewContentRef = useRef(null)

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
    setModalTitle('Insert Redirect')
    setModalPlaceholder('Enter redirect name (e.g., definition1)')
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
    setModalTitle('Create Redirect Definition')
    setModalPlaceholder('Enter a unique name (e.g., definition1)')
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
    const selectedText = form.content.substring(start, end) || 'Quiztionary'
    const replacement = `<quiz>${selectedText}</quiz>\n<answer>Answer</answer>`
    const newContent = form.content.substring(0, start) + replacement + form.content.substring(end)
    setForm(prev => ({ ...prev, content: newContent }))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 7, start + 7 + selectedText.length)
    }, 0)
  }

  const insertPreviewTag = () => {
    setModalTitle('Insert Preview')
    setModalPlaceholder('Enter preview name (e.g., image1)')
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
          <button class="quiz-show-more">Show more</button>
        </div>
        <div class="quiz-answer">${answer}</div>
      </div>`
    })

    html = html.replace(/<preview>([^<]+)<\/preview>/g, (match, name) => {
      const preview = form.previews.find(p => p.name === name.trim())
      if (!preview || preview.files.length === 0) return '<div class="catatan-text">Preview not available</div>'
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
        setKitabPreview({ header: found.header || 'Untitled', kitab: found.kitab || '' })
      }
    }
    window.previewRedirect = (name) => {
      const defs = window.__redirectDefs || {}
      const content = defs[name] || '<p>No content available for this name.</p>'
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

  useEffect(() => {
    const editorTextarea = document.getElementById('content-editor')
    const previewContent = previewContentRef.current
    if (!editorTextarea || !previewContent) return

    let isSyncing = false

    const syncEditorToPreview = () => {
      if (isSyncing) return
      isSyncing = true
      const ratio = editorTextarea.scrollTop / (editorTextarea.scrollHeight - editorTextarea.clientHeight)
      previewContent.scrollTop = ratio * (previewContent.scrollHeight - previewContent.clientHeight)
      setTimeout(() => { isSyncing = false }, 10)
    }

    const syncPreviewToEditor = () => {
      if (isSyncing) return
      isSyncing = true
      const ratio = previewContent.scrollTop / (previewContent.scrollHeight - previewContent.clientHeight)
      editorTextarea.scrollTop = ratio * (editorTextarea.scrollHeight - editorTextarea.clientHeight)
      setTimeout(() => { isSyncing = false }, 10)
    }

    editorTextarea.addEventListener('scroll', syncEditorToPreview)
    previewContent.addEventListener('scroll', syncPreviewToEditor)

    return () => {
      editorTextarea.removeEventListener('scroll', syncEditorToPreview)
      previewContent.removeEventListener('scroll', syncPreviewToEditor)
    }
  }, [form.content])

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800"><span className="font-normal text-gray-600">{topic.title}</span></h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input value={form.id} onChange={e => setForm({...form, id: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML + Custom Markup)</label>
                <div className="flex gap-1 mb-2 overflow-x-auto whitespace-nowrap py-1">
                  <button onClick={() => insertText('((', '))')} title="Insert kitab tag"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <Tag className="w-3 h-3" /> Kitab
                  </button>
                  <button onClick={() => insertText('**', '**')} title="Highlight text (Select Text)"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <Highlighter className="w-3 h-3" /> Select
                  </button>
                  <button onClick={() => insertText('<b>', '</b>')} title="HTML bold"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <Bold className="w-3 h-3" /> Bold
                  </button>
                  <button onClick={() => insertText('<i>', '</i>')} title="HTML italic"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <Italic className="w-3 h-3" /> Italic
                  </button>
                  <button onClick={() => insertText('&emsp;', '')} title="Insert paragraph spacing"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <AlignJustify className="w-3 h-3" /> Paragraph
                  </button>
                  <button onClick={() => insertText('!!', '!!')} title="Dictionary"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <AlertTriangle className="w-3 h-3" /> Note
                  </button>
                  <button onClick={insertList} title="Insert list"
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <List className="w-3 h-3" /> List
                  </button>
                  <button onClick={insertRedirectButton} title="Insert redirect button"
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <ExternalLink className="w-3 h-3" /> Redirect
                  </button>
                  <button onClick={insertDefineBlock} title="Insert redirect definition block"
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <Code className="w-3 h-3" /> Define
                  </button>
                  <button onClick={insertQuizBlock} title="Insert Quiz"
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <HelpCircle className="w-3 h-3" /> Quiz
                  </button>
                  <button onClick={insertPreviewTag} title="Insert preview (image/video)"
                    className="px-2 py-1 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded text-xs flex items-center gap-1 flex-shrink-0 transition">
                    <Image className="w-3 h-3" /> Preview
                  </button>
                  <button onClick={syncTags} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs flex-shrink-0 ml-auto transition">
                    Sync Tags
                  </button>
                  <button onClick={syncPreviews} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs flex-shrink-0 transition">
                    Sync Preview
                  </button>
                </div>
                <textarea
                  id="content-editor"
                  ref={editorTextareaRef}
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  rows={15}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Manage tags</h4>
                  <button onClick={() => setForm(prev => ({
                    ...prev,
                    tags: [...prev.tags, { tag: '', header: '', kitab: '' }]
                  }))} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition">
                    <Plus className="w-3 h-3" /> Insert Tag
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {form.tags.map((tag, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50">
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-gray-500">Tag #{idx+1}</span>
                        <button onClick={() => {
                          const newTags = form.tags.filter((_, i) => i !== idx)
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <input placeholder="Variable (case-sensitive / exact match)" value={tag.tag}
                        onChange={e => {
                          const newTags = [...form.tags]
                          newTags[idx].tag = e.target.value
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                      <input placeholder="Header (book title)" value={tag.header}
                        onChange={e => {
                          const newTags = [...form.tags]
                          newTags[idx].header = e.target.value
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                      <textarea placeholder="Kitab Content (HTML, Arabic Text)" value={tag.kitab}
                        onChange={e => {
                          const newTags = [...form.tags]
                          newTags[idx].kitab = e.target.value
                          setForm(prev => ({ ...prev, tags: newTags }))
                        }}
                        rows={6}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-mono min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Preview Gallery</h4>
                  <button onClick={() => setForm(prev => ({
                    ...prev,
                    previews: [...prev.previews, { name: '', files: [] }]
                  }))} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition">
                    <Plus className="w-3 h-3" /> Insert Preview
                  </button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {form.previews.map((preview, pIdx) => (
                    <div key={pIdx} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <input placeholder="Unique preview name" value={preview.name}
                          onChange={e => {
                            const newPreviews = [...form.previews]
                            newPreviews[pIdx].name = e.target.value
                            setForm(prev => ({ ...prev, previews: newPreviews }))
                          }}
                          className="w-2/3 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                        <button onClick={() => removePreview(pIdx)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-2">
                        {preview.files.map((file, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                            <input placeholder="File name (e.g., photo.jpg)" value={file.src}
                              onChange={e => updatePreviewFile(pIdx, fIdx, 'src', e.target.value)}
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                            <select value={file.type} onChange={e => updatePreviewFile(pIdx, fIdx, 'type', e.target.value)}
                              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                            </select>
                            <button onClick={() => removePreviewFile(pIdx, fIdx)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button onClick={() => addFileToPreview(pIdx)} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition">
                          <Plus className="w-3 h-3" /> Add File
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow">
                Save
              </button>
              <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition">
                Cancel
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 border-l border-gray-100 bg-gray-50/80 relative overflow-hidden" ref={previewRef}>
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-md border border-white/30 text-xs font-medium text-gray-600">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span>Mobile preview</span>
              </div>
            </div>
            <div
              ref={previewContentRef}
              className="h-full overflow-y-auto px-5 py-4 pb-6 scroll-smooth custom-scrollbar"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/80 p-5 max-w-full">
                <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
              </div>
            </div>
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
                justify-center;
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{modalTitle}</h3>
              <button onClick={handleModalCancel} className="text-gray-400 hover:text-gray-600 transition">
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleModalCancel}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRedirectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{modalTitle}</h3>
              <button onClick={handleModalCancel} className="text-gray-400 hover:text-gray-600 transition">
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleModalCancel}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Save
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