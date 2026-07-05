import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function TickerBar() {
  const [events, setEvents] = useState([])
  const [dateLabel, setDateLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/ticker')
        setEvents(res.data.events || [])
        setDateLabel(res.data.date || '')
      } catch (err) {
        console.error('[Ticker] Failed to fetch:', err)
        setEvents(['Data sejarah tidak tersedia'])
      } finally {
        setLoading(false)
      }
    }
    fetchTicker()
    const interval = setInterval(fetchTicker, 3600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (loading || events.length === 0) return

    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const clone = content.cloneNode(true)
    container.appendChild(clone)

    const animate = () => {
      const currentPos = parseFloat(container.style.transform?.replace('translateX(', '') || '0')
      const newPos = currentPos - 0.5
      const width = content.scrollWidth
      if (newPos <= -width) {
        container.style.transform = `translateX(0px)`
        requestAnimationFrame(animate)
        return
      }
      container.style.transform = `translateX(${newPos}px)`
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [events, loading])

  if (loading) return <div className="h-8 bg-[#5452f6]"></div>
  if (events.length === 0) return null

  // Gabungkan event tanpa menambahkan dateLabel di depan
  const fullText = events.join(' | ')

  return (
    <div className="w-full bg-[#5452f6] overflow-hidden h-8 flex items-center select-none border-b border-white/10 shadow-sm">
      <div className="relative flex-1 overflow-hidden h-full">
        <div
          ref={containerRef}
          className="flex whitespace-nowrap h-full items-center"
          style={{ transform: 'translateX(0px)' }}
        >
          <div ref={contentRef} className="text-white text-xs font-medium px-3">
            {fullText}
          </div>
        </div>
      </div>
      <div className="hidden md:flex items-center px-3 text-white/60 text-[10px] border-l border-white/10 h-full bg-[#4a48d4]">
        <span className="font-mono">{dateLabel}</span>
      </div>
    </div>
  )
}