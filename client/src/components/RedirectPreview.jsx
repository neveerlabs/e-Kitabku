import { X } from 'lucide-react'

export default function RedirectPreview({ content, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#f8e6c4] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-amber-200">
        <div className="flex justify-between items-center p-4 border-b-2 border-dashed border-amber-300">
          <h3 className="text-xl font-serif text-amber-900">Konten Terkait</h3>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-900"><X className="w-5 h-5" /></button>
        </div>
        <div
          className="p-6 text-[#3c2a1a] text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
}