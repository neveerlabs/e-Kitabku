import { useState } from 'react'
import { FolderOpen } from 'lucide-react'

export default function PathInput({ onSetPath, error }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) onSetPath(input.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex items-center gap-3 mb-6">
          <FolderOpen className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">Kitabku Editor</h1>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Path file data.json</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="/home/neverlabs/Documents/e-Kitabku/Pendataan/data.json"
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
          Buka File
        </button>
      </form>
    </div>
  )
}