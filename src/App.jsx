import { useState, useEffect, useRef } from 'react'
import './App.css'
import './CrHeader.css'
import './TargetCard.css'
import './Dock.css'
import { DataChart } from './DataChart'
import { sendToWebhook } from './webhook'

const ANTECEDENTS = [
  'Attention presented', 'Attention removed', 'Stimulus added', 'Stimulus removed/altered',
  'Demand presented', 'Demand removed', 'Transition', 'Denied access/told no',
  'Routine change', 'Alone/unoccupied',
]
const CONSEQUENCES = [
  'Positive attention', 'Negative attention', 'Redirection', 'Stimulus added',
  'Demand/activity removed', 'Item/activity given', 'Item/activity removed', 'Ignored', 'Escape granted',
]
const WHO_PRESENT = ['Mom', 'Dad', 'Sibling', 'Teacher', 'Other caregiver', 'RBT only', 'Peer']
const LOCATIONS = ['Home', 'Community', 'Bathroom', 'Kitchen', 'Clinic', 'School', 'Vehicle']

function formatHMS(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function formatMinSec(ms) {
  const totalSec = Math.floor(ms / 1000)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function App() {
  const [techEmail, setTechEmail] = useState('')

  const [sessionRunning, setSessionRunning] = useState(false)
  const [sessionMs, setSessionMs] = useState(0)
  const sessionStartRef = useRef(null)
  const sessionIntervalRef = useRef(null)

  useEffect(() => {
    if (sessionRunning) {
      sessionStartRef.current = Date.now() - sessionMs
      sessionIntervalRef.current = setInterval(() => {
        setSessionMs(Date.now() - sessionStartRef.current)
      }, 1000)
    } else {
      clearInterval(sessionIntervalRef.current)
    }
    return () => clearInterval(sessionIntervalRef.current)
  }, [sessionRunning])

  // ---- frequency Bx (write-in, single dock item) ----
  const [freqName, setFreqName] = useState('')
  const [freqCount, setFreqCount] = useState(0)
  function bumpFreq(delta) {
    setFreqCount(c => Math.max(0, c + delta))
  }

  // ---- duration Bx (write-in, single dock item, start/stop) ----
  const [durName, setDurName] = useState('')
  const [durRunning, setDurRunning] = useState(false)
  const [durMs, setDurMs] = useState(0)
  const [durEntries, setDurEntries] = useState([])
  const durStartRef = useRef(null)
  const durIntervalRef = useRef(null)

  useEffect(() => {
    if (durRunning) {
      durStartRef.current = Date.now()
      durIntervalRef.current = setInterval(() => {
        setDurMs(Date.now() - durStartRef.current)
      }, 1000)
    } else {
      clearInterval(durIntervalRef.current)
    }
    return () => clearInterval(durIntervalRef.current)
  }, [durRunning])

  function toggleDurTimer() {
    if (durRunning) {
      const finalMs = Date.now() - durStartRef.current
      setDurEntries(prev => [...prev, Math.round(finalMs / 100) / 10])
      setDurRunning(false)
      setDurMs(0)
    } else {
      setDurRunning(true)
    }
  }

  // ---- interval recording ----
  const [intervalMethod, setIntervalMethod] = useState('whole')
  const [intervalBehaviorName, setIntervalBehaviorName] = useState('')
  const [numIntervals, setNumIntervals] = useState(10)
  const [intervalMarks, setIntervalMarks] = useState(Array(10).fill(false))
  const [intervalSessions, setIntervalSessions] = useState([])

  function buildIntervals(n) {
    setNumIntervals(n)
    setIntervalMarks(Array(n).fill(false))
  }
  function toggleInterval(i) {
    setIntervalMarks(prev => prev.map((v, idx) => idx === i ? !v : v))
  }
  function logIntervalSession() {
    const occurred = intervalMarks.filter(Boolean).length
    setIntervalSessions(prev => [...prev, {
      behavior: intervalBehaviorName || 'Untitled',
      method: intervalMethod,
      occurred,
      total: intervalMarks.length,
    }])
    setIntervalMarks(Array(numIntervals).fill(false))
  }

  // ---- ABC ----
  const [abcOpen, setAbcOpen] = useState(false)
  const [abcEntries, setAbcEntries] = useState([])
  const [abcDraft, setAbcDraft] = useState({ antecedent: '', behavior: '', consequence: '', who: '', location: '' })

  function toggleAbcField(field, value) {
    setAbcDraft(prev => ({ ...prev, [field]: prev[field] === value ? '' : value }))
  }
  function submitAbc() {
    if (!abcDraft.behavior.trim()) return
    setAbcEntries(prev => [...prev, { ...abcDraft, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setAbcDraft({ antecedent: '', behavior: '', consequence: '', who: '', location: '' })
    setAbcOpen(false)
  }

  const [sessionNote, setSessionNote] = useState('')

  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)

  async function handleSubmit() {
    if (!techEmail.trim()) {
      setSendStatus({ ok: false, msg: "Enter the trainer's email to send this session to." })
      return
    }
    setSending(true)
    setSendStatus(null)
    const payload = {
      trainerEmail: techEmail,
      sessionDurationSeconds: Math.round(sessionMs / 1000),
      submittedAt: new Date().toISOString(),
      frequencyBehavior: freqName ? { name: freqName, count: freqCount } : null,
      durationBehavior: durName ? { name: durName, entries: durEntries } : null,
      intervalSessions,
      abcEntries,
      sessionNote,
    }
    try {
      await sendToWebhook(payload)
      setSendStatus({ ok: true, msg: 'Session sent successfully.' })
    } catch (err) {
      setSendStatus({ ok: false, msg: err.message + ' — check the webhook is configured.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="app">
      <div className="cr-header">
        <div className="cr-brand">Central<span>Reach</span> <span style={{ color: '#cfe0f5', fontWeight: 400 }}>· session</span></div>
        <div className="cr-user">
          <strong>{techEmail || 'Trainer'}</strong>
          Magnet ABA
        </div>
      </div>

      <div className="cr-session-bar">
        <div>
          <div className="session-title">Session</div>
          <div className="session-sub">{sessionRunning ? 'In progress' : sessionMs > 0 ? 'Paused' : 'Not started'}</div>
        </div>
        <div className={`cr-timer ${sessionRunning ? 'running' : ''}`}>{formatHMS(sessionMs)}</div>
        <button className={`btn ${sessionRunning ? 'btn-stop' : 'btn-go'}`} style={{ width: 'auto', padding: '10px 16px' }}
          onClick={() => setSessionRunning(r => !r)}>
          {sessionRunning ? 'Pause' : sessionMs > 0 ? 'Resume' : 'Start session'}
        </button>
      </div>

      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Trainer's email</label>
          <input type="email" value={techEmail} onChange={e => setTechEmail(e.target.value)} placeholder="trainer@magnetaba.com" />
        </div>
      </div>

      <p className="section-title">Interval recording (discontinuous)</p>
      <div className="card">
        <div className="field">
          <label>Behavior</label>
          <input value={intervalBehaviorName} onChange={e => setIntervalBehaviorName(e.target.value)} placeholder="e.g. off-task" />
        </div>
        <div className="method-row">
          <button className={`method-btn ${intervalMethod === 'whole' ? 'active' : ''}`} onClick={() => setIntervalMethod('whole')}>Whole interval</button>
          <button className={`method-btn ${intervalMethod === 'partial' ? 'active' : ''}`} onClick={() => setIntervalMethod('partial')}>Partial interval</button>
        </div>
        <div className="field-row" style={{ marginBottom: 10 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Number of intervals</label>
            <input type="number" min={2} max={30} value={numIntervals}
              onChange={e => buildIntervals(Math.max(2, Math.min(30, parseInt(e.target.value) || 10)))} />
          </div>
        </div>
        <div className="interval-grid">
          {intervalMarks.map((v, i) => (
            <button key={i} className={`interval-cell ${v ? 'marked' : ''}`} onClick={() => toggleInterval(i)}>{i + 1}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={logIntervalSession}>Log interval session</button>
        {intervalSessions.length > 0 && (
          <div className="entry-list" style={{ marginTop: 14 }}>
            {intervalSessions.map((s, i) => (
              <div className="entry-row" key={i}>
                <div>
                  <div className="entry-main">{s.behavior}</div>
                  <div className="entry-sub">{s.method} interval</div>
                </div>
                <div>{Math.round((s.occurred / s.total) * 100)}%</div>
              </div>
            ))}
          </div>
        )}
        {intervalSessions.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p className="section-title">% intervals graph</p>
            <DataChart
              type="line"
              labels={intervalSessions.map((s, i) => 'S' + (i + 1))}
              values={intervalSessions.map(s => Math.round((s.occurred / s.total) * 1000) / 10)}
              color="#b3402f"
              yMax={100}
            />
          </div>
        )}
      </div>

      {freqName && freqCount > 0 && (
        <>
          <p className="section-title">Frequency graph — rate</p>
          <div className="card">
            <DataChart type="bar" labels={[freqName]} values={[freqCount]} color="#7F77DD" />
          </div>
        </>
      )}

      {durName && durEntries.length > 0 && (
        <>
          <p className="section-title">Duration graph — seconds per occurrence</p>
          <div className="card">
            <DataChart
              type="line"
              labels={durEntries.map((_, i) => 'Occ ' + (i + 1))}
              values={durEntries}
              color="#1d5fa8"
            />
          </div>
        </>
      )}

      {abcEntries.length > 0 && (
        <>
          <p className="section-title">ABC entries</p>
          <div className="card">
            {abcEntries.map((e, i) => (
              <div key={i} style={{ marginBottom: i < abcEntries.length - 1 ? 14 : 0, border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                <div className="abc-row">
                  <div className="abc-label" style={{ color: 'var(--ink-faint)' }}>Time</div>
                  <div className="abc-content">{e.time}</div>
                </div>
                <div className="abc-row abc-a">
                  <div className="abc-label">A</div>
                  <div className="abc-content">{e.antecedent || '—'}</div>
                </div>
                <div className="abc-row abc-b">
                  <div className="abc-label">B</div>
                  <div className="abc-content">{e.behavior}</div>
                </div>
                <div className="abc-row abc-c">
                  <div className="abc-label">C</div>
                  <div className="abc-content">{e.consequence || '—'}</div>
                </div>
                {(e.who || e.location) && (
                  <div className="abc-tags" style={{ margin: 10 }}>
                    <div className="abc-tag"><p className="tag-label">Who was present</p><p className="tag-value">{e.who || '—'}</p></div>
                    <div className="abc-tag"><p className="tag-label">Location</p><p className="tag-value">{e.location || '—'}</p></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="section-title">Session note</p>
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Narrative summary for this session</label>
          <textarea rows={6} value={sessionNote} onChange={e => setSessionNote(e.target.value)}
            placeholder="Summarize session activities, client presentation, caregiver communication, and any notable events..."
            style={{ resize: 'vertical', lineHeight: 1.5 }} />
        </div>
      </div>

      <p className="section-title">Submit session</p>
      <div className="card">
        {sendStatus && <div className={`status-msg ${sendStatus.ok ? 'ok' : 'err'}`}>{sendStatus.msg}</div>}
        <button className="btn btn-primary" disabled={sending} onClick={handleSubmit}>
          {sending ? 'Sending…' : 'Submit & email session'}
        </button>
      </div>

      <div className="dock">
        <div className="dock-item">
          <input className="dock-label-input" placeholder="Target behavior" value={freqName} onChange={e => setFreqName(e.target.value)} />
          <div className="dock-phase">Baseline</div>
          <div className="dock-controls">
            <button className="dock-btn" onClick={() => bumpFreq(-1)}>−</button>
            <div className="dock-count">{freqCount}</div>
            <button className="dock-btn" onClick={() => bumpFreq(1)}>+</button>
          </div>
        </div>
        <div className="dock-item">
          <input className="dock-label-input" placeholder="Target behavior" value={durName} onChange={e => setDurName(e.target.value)} />
          <div className="dock-phase">Baseline</div>
          <div className="dock-controls">
            <button className={`dock-play-btn ${durRunning ? 'running' : ''}`} onClick={toggleDurTimer}>
              {durRunning ? '■' : '▶'}
            </button>
            <div className={`dock-timer ${durRunning ? 'running' : ''}`}>{formatMinSec(durMs)}</div>
          </div>
        </div>
        <div className="dock-abc-corner">
          <button className="dock-abc-btn" onClick={() => setAbcOpen(true)}>ABC</button>
        </div>
      </div>

      {abcOpen && (
        <AbcModal
          draft={abcDraft}
          onToggle={toggleAbcField}
          onBehaviorChange={v => setAbcDraft(prev => ({ ...prev, behavior: v }))}
          onClose={() => setAbcOpen(false)}
          onSubmit={submitAbc}
        />
      )}
    </div>
  )
}

function AbcModal({ draft, onToggle, onBehaviorChange, onClose, onSubmit }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', zIndex: 50 }}>
      <div style={{ background: 'var(--paper)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', padding: 18, border: '1px solid var(--line)', borderBottom: 'none' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 14px' }}>ABC collection</p>

        <div className="field">
          <label>Behavior (write in)</label>
          <input value={draft.behavior} onChange={e => onBehaviorChange(e.target.value)} placeholder="e.g. Elopement" />
        </div>

        <PickList title="Antecedent" options={ANTECEDENTS} value={draft.antecedent} onPick={v => onToggle('antecedent', v)} />
        <PickList title="Consequence" options={CONSEQUENCES} value={draft.consequence} onPick={v => onToggle('consequence', v)} />
        <PickList title="Who was present" options={WHO_PRESENT} value={draft.who} onPick={v => onToggle('who', v)} />
        <PickList title="Location" options={LOCATIONS} value={draft.location} onPick={v => onToggle('location', v)} />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--line)' }} onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onSubmit}>Submit</button>
        </div>
      </div>
    </div>
  )
}

function PickList({ title, options, value, onPick }) {
  return (
    <div className="field">
      <label>{title}</label>
      <div style={{ border: '1px solid var(--line)', borderRadius: 8, maxHeight: 140, overflowY: 'auto' }}>
        {options.map(opt => (
          <div key={opt}
            onClick={() => onPick(opt)}
            style={{
              padding: '9px 12px',
              fontSize: 13,
              cursor: 'pointer',
              background: value === opt ? 'var(--blue-dim)' : 'transparent',
              color: value === opt ? 'var(--blue)' : 'var(--ink)',
              fontWeight: value === opt ? 600 : 400,
              borderBottom: '1px solid var(--line)',
            }}>
            {opt}
          </div>
        ))}
      </div>
    </div>
  )
}
