import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { HSK_DATA } from './data/generated/hsk-data'
import type { HanziEntry, HskLevel, ReviewGrade, ReviewState } from './data/types'
import { gradeReview, isDue } from './lib/srs'
import { loadReviewStates, loadSettings, resetAllProgress, saveReviewStates, saveSettings } from './lib/storage'
import { HanziPractice } from './components/HanziPractice'

const LEVELS: HskLevel[] = [1, 2, 3, 4, 5, 6]

function formatDue(state?: ReviewState) {
  if (!state) return 'New'
  const due = new Date(state.dueAt).getTime()
  const now = Date.now()
  if (due <= now) return 'Due now'
  const minutes = Math.ceil((due - now) / 60000)
  if (minutes < 90) return `Due in ${minutes}m`
  const hours = Math.ceil(minutes / 60)
  if (hours < 36) return `Due in ${hours}h`
  return `Due in ${Math.ceil(hours / 24)}d`
}

function pickNext(entries: HanziEntry[], states: Record<string, ReviewState>, currentId?: string) {
  const due = entries.filter(e => e.id !== currentId).filter(e => isDue(states[e.id])).sort((a, b) => (states[a.id]?.dueAt || '').localeCompare(states[b.id]?.dueAt || ''))
  if (due.length) return due[0]
  const unseen = entries.filter(e => e.id !== currentId && !states[e.id])
  if (unseen.length) return unseen[0]
  return entries.find(e => e.id !== currentId) ?? entries[0]
}

function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [states, setStates] = useState<Record<string, ReviewState>>(loadReviewStates)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'study' | 'browse' | 'review'>('study')
  const [revealed, setRevealed] = useState(false)
  const selectedLevel = settings.selectedLevel as HskLevel
  const levelEntries = useMemo(() => HSK_DATA.filter(e => e.hskLevel === selectedLevel), [selectedLevel])
  const [currentId, setCurrentId] = useState(levelEntries[0]?.id ?? HSK_DATA[0]?.id)

  useEffect(() => {
    if (!levelEntries.find(e => e.id === currentId)) {
      setCurrentId(levelEntries[0]?.id ?? HSK_DATA[0]?.id)
      setRevealed(false)
    }
  }, [selectedLevel, levelEntries, currentId])

  const visibleEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return levelEntries.filter(e => !q || e.character.includes(q) || e.pinyin.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q) || e.radical.toLowerCase().includes(q))
  }, [levelEntries, query])

  const dueEntries = useMemo(() => HSK_DATA.filter(e => isDue(states[e.id])), [states])
  const current = HSK_DATA.find(e => e.id === currentId) ?? visibleEntries[0] ?? HSK_DATA[0]
  const levelStats = LEVELS.map(level => {
    const all = HSK_DATA.filter(e => e.hskLevel === level)
    const learned = all.filter(e => states[e.id]?.repetitions > 0).length
    const due = all.filter(e => isDue(states[e.id])).length
    return { level, total: all.length, learned, due }
  })

  const updateSettings = (next: typeof settings) => { setSettings(next); saveSettings(next) }
  const selectLevel = (level: HskLevel) => { updateSettings({ ...settings, selectedLevel: level }); setMode('study'); setRevealed(false) }
  const applyGrade = (grade: ReviewGrade) => {
    if (!current) return
    const next = gradeReview(states[current.id], grade); next.id = current.id
    const nextStates = { ...states, [current.id]: next }
    setStates(nextStates); saveReviewStates(nextStates)
    const pool = mode === 'review' ? dueEntries : levelEntries
    const nextEntry = pickNext(pool.length ? pool : levelEntries, nextStates, current.id)
    setCurrentId(nextEntry?.id ?? current.id); setRevealed(false)
  }
  const startDueReview = () => { setMode('review'); setCurrentId((dueEntries[0] ?? HSK_DATA[0]).id); setRevealed(false) }
  const progressPct = levelEntries.length ? Math.round((levelEntries.filter(e => states[e.id]?.repetitions > 0).length / levelEntries.length) * 100) : 0

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">字</div><div><h1>HanziForge</h1><p>Recognise. Recall. Write. Review.</p></div></div>
      <section className="panel"><div className="panel-title">HSK Levels</div><div className="level-grid">{levelStats.map(item => <button key={item.level} className={item.level === selectedLevel ? 'level active' : 'level'} onClick={() => selectLevel(item.level as HskLevel)}><strong>HSK {item.level}</strong><span>{item.learned}/{item.total} learned</span><em>{item.due} due</em></button>)}</div></section>
      <section className="panel stats"><div><strong>{dueEntries.length}</strong><span>due now</span></div><div><strong>{progressPct}%</strong><span>level progress</span></div></section>
      <div className="sidebar-actions"><button onClick={startDueReview}>Review due cards</button><button className="ghost" onClick={() => { if (confirm('Reset all local progress?')) { resetAllProgress(); setStates({}) } }}>Reset progress</button></div>
    </aside>
    <section className="workspace">
      <nav className="topbar"><div className="tabs"><button className={mode === 'study' ? 'active' : ''} onClick={() => setMode('study')}>Study</button><button className={mode === 'review' ? 'active' : ''} onClick={startDueReview}>Review</button><button className={mode === 'browse' ? 'active' : ''} onClick={() => setMode('browse')}>Browse</button></div><input placeholder="Search character, pinyin, meaning, radical..." value={query} onChange={event => { setQuery(event.target.value); setMode('browse') }} /></nav>
      {mode === 'browse' ? <section className="browser"><div className="section-heading"><h2>HSK {selectedLevel} Browser</h2><p>{visibleEntries.length} of {levelEntries.length} characters</p></div><div className="character-grid">{visibleEntries.map(entry => <button key={entry.id} className={entry.id === current?.id ? 'char-tile active' : 'char-tile'} onClick={() => { setCurrentId(entry.id); setMode('study'); setRevealed(false) }}><span className="tile-char">{entry.character}</span><span>{entry.pinyin}</span><small>{entry.definition}</small><em>{formatDue(states[entry.id])}</em></button>)}</div></section> : <section className="study-layout"><section className="card hero-card"><div className="card-status"><span>HSK {current.hskLevel}</span><span>{formatDue(states[current.id])}</span></div><div className="hanzi-large">{current.character}</div><button className="reveal" onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide answer' : 'Reveal pinyin and meaning'}</button><div className={revealed ? 'answer open' : 'answer'}><h2>{current.pinyin}</h2><p>{current.definition || 'No definition provided yet.'}</p></div><div className="metadata"><div><span>Radical</span><strong>{current.radical}</strong></div><div><span>Strokes</span><strong>{current.strokeCount}</strong></div><div><span>Frequency</span><strong>{current.frequencyRank ?? '—'}</strong></div><div><span>Standard #</span><strong>{current.generalStandard || '—'}</strong></div></div><div className="mnemonic"><span>Memory hook</span><p>{current.mnemonic || `Use the radical ${current.radical} as the visual anchor, then connect the shape to “${current.definition}”.`}</p></div><div className="grade-row"><button onClick={() => applyGrade('again')} className="again">Again</button><button onClick={() => applyGrade('hard')} className="hard">Hard</button><button onClick={() => applyGrade('good')} className="good">Good</button><button onClick={() => applyGrade('easy')} className="easy">Easy</button></div></section><HanziPractice entry={current} /></section>}
    </section>
  </main>
}

createRoot(document.getElementById('root')!).render(<App />)
