// client/src/components/Toast.jsx
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
                  'bg-yellow-100 border-yellow-400 text-yellow-800';

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertTriangle;

  return (
    <div className={`fixed bottom-6 right-6 z-[200] transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className={`flex items-center gap-3 px-5 py-3 border rounded-lg shadow-lg ${bgColor}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}