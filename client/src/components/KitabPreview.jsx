import { X } from 'lucide-react'

export default function KitabPreview({ header, kitab, onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/30 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100/80 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            {header || 'Kitab'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          className="p-6 text-right font-['Amiri','Traditional Arabic','Times New Roman',serif] text-lg leading-loose text-gray-800"
          style={{ direction: 'rtl', unicodeBidi: 'embed' }}
          dangerouslySetInnerHTML={{ __html: kitab }}
        />
      </div>
    </div>
  )
}