import React, { useEffect, useMemo, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import type { HanziEntry } from '../data/types'

export function HanziPractice({ entry }: { entry: HanziEntry }) {
  const hostId = useMemo(() => `writer-${entry.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`, [entry.id])
  const writerRef = useRef<HanziWriter | null>(null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [mistakes, setMistakes] = useState(0)

  useEffect(() => {
    const element = document.getElementById(hostId)
    if (!element) return
    element.innerHTML = ''
    setQuizComplete(false); setMistakes(0)
    writerRef.current = HanziWriter.create(element, entry.character, { width: 260, height: 260, padding: 18, showOutline: true, showCharacter: false, strokeAnimationSpeed: 1, delayBetweenStrokes: 120, drawingWidth: 34 })
    return () => { try { writerRef.current?.cancelQuiz() } catch {}; writerRef.current = null }
  }, [entry.character, hostId])

  return <section className="practice-card">
    <div className="writer-toolbar">
      <button onClick={() => { writerRef.current?.cancelQuiz(); writerRef.current?.animateCharacter() }}>Animate</button>
      <button onClick={() => { setQuizComplete(false); setMistakes(0); writerRef.current?.quiz({ showHintAfterMisses: 2, highlightOnComplete: true, onMistake: () => setMistakes(m => m + 1), onComplete: () => setQuizComplete(true) }) }}>Stroke quiz</button>
      <button onClick={() => writerRef.current?.showCharacter()}>Show</button>
      <button onClick={() => writerRef.current?.hideCharacter()}>Hide</button>
    </div>
    <div id={hostId} className="writer-box" aria-label={`Practice writing ${entry.character}`} />
    <div className="practice-meta"><span>{mistakes} mistakes</span><span>{quizComplete ? 'Quiz complete' : 'Trace the strokes'}</span></div>
  </section>
}
