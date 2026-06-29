import { useState } from 'react'
import { DataChart } from '../DataChart'

function cumulativePct(trials) {
  let c = 0
  return trials.map((t, i) => { if (t.result === 'correct') c++; return Math.round(c / (i + 1) * 1000) / 10 })
}

function QuizCard({ item, onAnswer, answer }) {
  const lineOpt = { type: 'line', color: '#1d6fc4' }
  const barOpt  = { type: 'bar',  color: '#7F77DD' }
  const [opts] = useState(() => Math.random() > 0.5 ? [lineOpt, barOpt] : [barOpt, lineOpt])

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
      <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 12 }}>{item.typeLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {opts.map((opt, i) => (
          <div key={i} onClick={() => onAnswer(item.id, opt.type)}
            style={{ border: `2px solid ${answer === opt.type ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 8, padding: 10, cursor: 'pointer', background: answer === opt.type ? 'var(--blue-dim)' : 'var(--white)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--soft)', marginBottom: 8, textAlign: 'center' }}>Option {String.fromCharCode(65 + i)}</div>
            <div style={{ height: 120, position: 'relative' }}>
              <DataChart type={opt.type} labels={item.labels} values={item.values} color={opt.color} />
            </div>
          </div>
        ))}
      </div>
      {!answer && <div style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'center', marginTop: 8 }}>Select the most appropriate graph for this data</div>}
    </div>
  )
}

export default function GraphQuiz({ sessionData, onNext }) {
  const [answers, setAnswers] = useState({})

  const items = []
  sessionData.goals?.forEach((g, i) => {
    if (g.trials?.length > 0) items.push({ id: `goal_${i}`, name: g.name, typeLabel: 'Goal — % correct over trials', correctType: 'line', labels: g.trials.map((_, j) => 'T'+(j+1)), values: cumulativePct(g.trials) })
  })
  if (sessionData.frequencyBehavior?.name && sessionData.frequencyBehavior.count > 0)
    items.push({ id: 'freq', name: sessionData.frequencyBehavior.name, typeLabel: 'Frequency — event count', correctType: 'bar', labels: ['Session'], values: [sessionData.frequencyBehavior.count] })
  if (sessionData.durationBehavior?.entries?.length > 0)
    items.push({ id: 'dur', name: sessionData.durationBehavior.name, typeLabel: 'Duration — seconds per occurrence', correctType: 'line', labels: sessionData.durationBehavior.entries.map((_, i) => 'Occ '+(i+1)), values: sessionData.durationBehavior.entries })
  if (sessionData.intervalSessions?.length > 0)
    items.push({ id: 'interval', name: sessionData.intervalSessions[0].behavior, typeLabel: 'Interval — % intervals per session', correctType: 'line', labels: sessionData.intervalSessions.map((_, i) => 'S'+(i+1)), values: sessionData.intervalSessions.map(s => Math.round(s.occurred/s.total*1000)/10) })

  function handleNext() {
    const quizResults = items.map(item => ({ name: item.name, dataType: item.typeLabel, correctGraph: item.correctType, selectedGraph: answers[item.id] || 'not answered', correct: answers[item.id] === item.correctType }))
    onNext(quizResults)
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '48px 1fr', height: '100vh', overflow: 'hidden' }}>
      <div style={{ background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}><span style={{ color: '#6ea8e8' }}>Magnet</span> ABA</div>
        <div style={{ color: '#cfe0f5', fontSize: 12 }}>Step 2 of 4 — Graph Identification</div>
        <button onClick={handleNext} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 700, fontSize: 13 }}>Next →</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Graph Identification</h2>
          <p style={{ fontSize: 13, color: 'var(--soft)', marginBottom: 20 }}>For each behavior or goal, select the most appropriate graph to display the data.</p>
          {items.length === 0
            ? <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, textAlign: 'center', color: 'var(--faint)' }}>No data collected to graph. Click Next to continue.</div>
            : items.map(item => <QuizCard key={item.id} item={item} answer={answers[item.id]} onAnswer={(id, type) => setAnswers(p => ({ ...p, [id]: type }))} />)
          }
          <button onClick={handleNext} style={{ width: '100%', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontWeight: 700, fontSize: 14, marginTop: 8 }}>Continue to Session Note →</button>
        </div>
      </div>
    </div>
  )
}
