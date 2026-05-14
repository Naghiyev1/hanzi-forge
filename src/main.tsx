import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { HSK_VOCAB } from './data/generated/hsk-vocab-data'
import { HSK_CHARACTERS } from './data/generated/hsk-character-data'
import { HSK_VALIDATION_SUMMARY } from './data/generated/hsk-validation-summary'
import type { HskLevel, ReviewGrade, ReviewState, VocabEntry } from './data/types'
import { gradeReview, isDue } from './lib/srs'
import { loadReviewStates, loadSettings, resetAllProgress, saveReviewStates, saveSettings } from './lib/storage'
import { HanziPractice } from './components/HanziPractice'

const LEVELS: HskLevel[] = ['1', '2', '3', '4', '5', '6', '7-9']
const chineseChars = (word: string) => Array.from(new Set(Array.from(word).filter(ch => /[\u4e00-\u9fff]/.test(ch))))
function formatDue(state?: ReviewState) { if (!state) return 'New'; const due = new Date(state.dueAt).getTime(); const diff = due - Date.now(); if (diff <= 0) return 'Due now'; const m = Math.ceil(diff / 60000); if (m < 90) return `Due in ${m}m`; const h = Math.ceil(m / 60); if (h < 36) return `Due in ${h}h`; return `Due in ${Math.ceil(h / 24)}d` }
function pickNext(entries: VocabEntry[], states: Record<string, ReviewState>, currentId?: string) { const due = entries.filter(e => e.id !== currentId && isDue(states[e.id])); if (due.length) return due[0]; return entries.find(e => e.id !== currentId) ?? entries[0] }
function makeMnemonic(entry: VocabEntry) { const chars = chineseChars(entry.word); if (chars.length <= 1) return `Write ${entry.word} slowly, then connect the shape to “${entry.definition}”.`; return `Break it into ${chars.join(' / ')}. Learn the word meaning first, then practise each character inside it.` }

function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [states, setStates] = useState<Record<string, ReviewState>>(loadReviewStates)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'study' | 'browse' | 'review' | 'characters' | 'data'>('study')
  const [revealed, setRevealed] = useState(false)
  const [activeChar, setActiveChar] = useState('爱')

  const selectedLevel = settings.selectedLevel
  const levelEntries = useMemo(() => HSK_VOCAB.filter(e => e.level === selectedLevel), [selectedLevel])
  const levelChars = useMemo(() => HSK_CHARACTERS.filter(e => e.level === selectedLevel), [selectedLevel])
  const [currentId, setCurrentId] = useState(levelEntries[0]?.id ?? HSK_VOCAB[0].id)
  const current = HSK_VOCAB.find(e => e.id === currentId) ?? levelEntries[0] ?? HSK_VOCAB[0]
  const currentChars = chineseChars(current.word)
  React.useEffect(() => { if (!currentChars.includes(activeChar)) setActiveChar(currentChars[0] || '爱') }, [current.word])

  const visibleEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return levelEntries.filter(e => !q || e.word.includes(q) || e.pinyin.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q) || (e.pos || '').toLowerCase().includes(q))
  }, [levelEntries, query])
  const dueEntries = useMemo(() => HSK_VOCAB.filter(e => isDue(states[e.id])), [states])

  const levelStats = LEVELS.map(level => {
    const all = HSK_VOCAB.filter(e => e.level === level)
    const learned = all.filter(e => states[e.id]?.repetitions > 0).length
    const due = all.filter(e => isDue(states[e.id])).length
    const summary = HSK_VALIDATION_SUMMARY.find(s => s.level === level)
    return { level, total: all.length, learned, due, summary }
  })
  const progressPct = levelEntries.length ? Math.round(levelEntries.filter(e => states[e.id]?.repetitions > 0).length / levelEntries.length * 100) : 0

  const updateSettings = (next: typeof settings) => { setSettings(next); saveSettings(next) }
  const selectLevel = (level: HskLevel) => { updateSettings({ ...settings, selectedLevel: level }); const first = HSK_VOCAB.find(e => e.level === level); if (first) setCurrentId(first.id); setMode('study'); setRevealed(false) }
  const startDueReview = () => { setMode('review'); const next = dueEntries[0] ?? HSK_VOCAB[0]; setCurrentId(next.id); setRevealed(false) }
  const applyGrade = (grade: ReviewGrade) => { const next = gradeReview(states[current.id], grade, current.id); const nextStates = { ...states, [current.id]: next }; setStates(nextStates); saveReviewStates(nextStates); const pool = mode === 'review' ? dueEntries : levelEntries; const nextEntry = pickNext(pool.length ? pool : levelEntries, nextStates, current.id); setCurrentId(nextEntry?.id ?? current.id); setRevealed(false) }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">字</div><div><h1>HanziForge</h1><p>HSK 3.0 vocabulary + writing</p></div></div>
      <section className="panel"><div className="panel-title">HSK 3.0 Levels</div><div className="level-grid">{levelStats.map(item => <button key={item.level} className={item.level === selectedLevel ? 'level active' : 'level'} onClick={() => selectLevel(item.level as HskLevel)}><strong>HSK {item.level}</strong><span>{item.learned}/{item.total} vocab</span><em>{item.summary?.expectedCharactersFromPdf} chars</em></button>)}</div></section>
      <section className="panel stats"><div><strong>{dueEntries.length}</strong><span>due now</span></div><div><strong>{progressPct}%</strong><span>level progress</span></div></section>
      <div className="sidebar-actions"><button onClick={startDueReview}>Review due vocab</button><button className="ghost" onClick={() => setMode('data')}>Data check</button><button className="ghost" onClick={() => { if (confirm('Reset all local progress?')) { resetAllProgress(); setStates({}) } }}>Reset progress</button></div>
    </aside>

    <section className="workspace">
      <nav className="topbar"><div className="tabs"><button className={mode === 'study' ? 'active' : ''} onClick={() => setMode('study')}>Study</button><button className={mode === 'review' ? 'active' : ''} onClick={startDueReview}>Review</button><button className={mode === 'characters' ? 'active' : ''} onClick={() => setMode('characters')}>Characters</button><button className={mode === 'browse' ? 'active' : ''} onClick={() => setMode('browse')}>Browse</button></div><input placeholder="Search word, pinyin, meaning, POS..." value={query} onChange={e => { setQuery(e.target.value); setMode('browse') }} /></nav>

      {mode === 'data' && <section className="browser"><div className="section-heading"><h2>Dataset validation</h2><p>Imported from HSK 3.0 PDFs</p></div><div className="validation-grid">{HSK_VALIDATION_SUMMARY.map(s => <div key={s.level} className="validation-card"><h3>HSK {s.level}</h3><p>Entries: <strong>{s.entries}</strong> / {s.expectedEntries}</p><p>Single-character rows: <strong>{s.characterRows}</strong></p><p>Unique single characters: <strong>{s.uniqueCharacters}</strong></p><p>PDF character count: <strong>{s.expectedCharactersFromPdf}</strong></p><p>Word rows: <strong>{s.wordRows}</strong> / {s.expectedWordsFromPdf}</p><span className={s.status === 'ok' ? 'ok' : 'warn'}>{s.status}</span></div>)}</div></section>}

      {mode === 'browse' && <section className="browser"><div className="section-heading"><h2>HSK {selectedLevel} Vocabulary</h2><p>{visibleEntries.length} of {levelEntries.length} entries</p></div><div className="vocab-grid">{visibleEntries.map(entry => <button key={entry.id} className={entry.id === current.id ? 'vocab-tile active' : 'vocab-tile'} onClick={() => { setCurrentId(entry.id); setMode('study'); setRevealed(false) }}><span className="tile-word">{entry.word}</span><span>{entry.pinyin}</span><small>{entry.definition}</small><em>{formatDue(states[entry.id])}</em></button>)}</div></section>}

      {mode === 'characters' && <section className="browser"><div className="section-heading"><h2>HSK {selectedLevel} Characters</h2><p>{levelChars.length} unique characters in this level's vocabulary</p></div><div className="character-grid">{levelChars.map(ch => <button key={ch.id} className={ch.character === activeChar ? 'char-tile active' : 'char-tile'} onClick={() => { setActiveChar(ch.character); const example = HSK_VOCAB.find(e => e.word.includes(ch.character) && e.level === selectedLevel); if (example) setCurrentId(example.id) }}><span className="tile-char">{ch.character}</span><small>{ch.examples.slice(0,3).map(e => e.word).join(' · ')}</small></button>)}</div><HanziPractice character={activeChar} /></section>}

      {(mode === 'study' || mode === 'review') && <section className="study-layout"><section className="card hero-card"><div className="card-status"><span>HSK {current.level}</span><span>{formatDue(states[current.id])}</span></div><div className="hanzi-large word-large">{current.word}</div><button className="reveal" onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide answer' : 'Reveal pinyin and meaning'}</button><div className={revealed ? 'answer open' : 'answer'}><h2>{current.pinyin}</h2><p>{current.pos ? <strong>{current.pos} </strong> : null}{current.definition || 'No definition provided.'}</p>{current.also && <p className="also">{current.also}</p>}</div><div className="metadata"><div><span>Level</span><strong>{current.level}</strong></div><div><span>Chars</span><strong>{currentChars.length}</strong></div><div><span>POS</span><strong>{current.pos || '—'}</strong></div><div><span>Status</span><strong>{formatDue(states[current.id])}</strong></div></div><div className="mnemonic"><span>Memory hook</span><p>{makeMnemonic(current)}</p></div>{currentChars.length > 1 && <div className="char-picker"><span>Practise character:</span>{currentChars.map(ch => <button key={ch} className={ch === activeChar ? 'active' : ''} onClick={() => setActiveChar(ch)}>{ch}</button>)}</div>}<div className="grade-row"><button onClick={() => applyGrade('again')} className="again">Again</button><button onClick={() => applyGrade('hard')} className="hard">Hard</button><button onClick={() => applyGrade('good')} className="good">Good</button><button onClick={() => applyGrade('easy')} className="easy">Easy</button></div></section><HanziPractice character={activeChar} /></section>}
    </section>
  </main>
}

createRoot(document.getElementById('root')!).render(<App />)
