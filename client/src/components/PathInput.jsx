import { useState, useRef } from 'react'
import { FolderOpen, Upload } from 'lucide-react'
import axios from 'axios'

export default function PathInput({ onSetPath, error }) {
  const [input, setInput] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) onSetPath(input.trim())
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadError('')

    if (!file.name.endsWith('.json')) {
      setUploadError('File must have .json extension')
      return
    }

    try {
      const text = await file.text()
      JSON.parse(text)

      const res = await axios.post('/api/upload', { content: text })
      if (res.data && res.data.path) {
        setInput(res.data.path)
        setUploadError('')
        onSetPath(res.data.path)
      } else {
        setUploadError('Failed to get path from server')
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setUploadError('File is not valid JSON')
      } else {
        setUploadError(err.response?.data?.error || 'Failed to upload file')
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex items-center gap-3 mb-6">
          <FolderOpen className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">Kitabku Editor</h1>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Enter path to data.json</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="/home/neverlabs/Documents/e-Kitabku/data.json"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition flex items-center gap-1"
            title="Select data.json file"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        {(error || uploadError) && (
          <p className="text-red-500 text-sm mt-2">{error || uploadError}</p>
        )}
        <button
          type="submit"
          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Open
        </button>
      </form>
    </div>
  )
}