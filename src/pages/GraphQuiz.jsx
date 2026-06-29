import { useState, useMemo } from 'react'
import { DataChart } from '../DataChart'

function cumulativePct(trials) {
  let c = 0
  return trials.map((t, i) => { if (t.result === 'correct') c++; return Math.round(c / (i + 1) * 1000) / 10 })
}

// Generate a plausible-looking but incorrect line graph (shuffled/reversed values)
function makeDistractorValues(values) {
  if (values.length <= 1) return [Math.max(0, values[0] - 20)]
  // reverse and offset so it looks plausible but different
  const reversed = [...values].reverse()
  return reversed.map(v => Math.min(100, Math.max(0, v + (Math.random() > 0.5 ? 15 : -15))))
}

function QuizCard({ item, onAnswer, answer }) {
  // Both options are line graphs — one correct (actual data), one distractor
  const distractorValues = useMemo(() => makeDistractorValues(item.values), [item.id])
  const [opts] = useState(() => {
    const correct = { type: 'line', values: item.values, color: '#1d6fc4', isCorrect: true }
    const distractor = { type: 'line', values: distractorValues, color: '#1d6fc4', isCorrect: false }
    return Math.random() > 0.5 ? [correct, distractor] : [distractor, correct]
  })

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
      <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 10 }}>{item.typeLabel}</div>

      {/* Data table */}
      <div style={{ marginBottom: 14, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {item.labels.map((l, i) => <th key={i} style={{ border: '1px solid var(--border)', padding: '4px 8px', fontWeight: 600 }}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {item.values.map((v, i) => <td key={i} style={{ border: '1px solid var(--border)', padding: '4px 8px', textAlign: 'center' }}>{typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(1) : v}{item.pct ? '%' : ''}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--soft)', marginBottom: 8 }}>Which graph correctly displays this data?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {opts.map((opt, i) => {
          const isSelected = answer !== undefined && opts[answer]?.isCorrect === opt.isCorrect && i === answer
          const sel = answer === i
          return (
            <div key={i} onClick={() => onAnswer(item.id, i, opt.isCorrect)}
              style={{ border: `2px solid ${sel ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 8, padding: 10, cursor: 'pointer', background: sel ? 'var(--blue-dim)' : 'var(--white)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--soft)', marginBottom: 8, textAlign: 'center' }}>Option {String.fromCharCode(65 + i)}</div>
              <div style={{ height: 120, position: 'relative' }}>
                <DataChart type="line" labels={item.labels} values={opt.values} color={opt.color} />
              </div>
            </div>
          )
        })}
      </div>
      {answer === undefined && <div style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'center', marginTop: 8 }}>Select the graph that matches the data table above</div>}
    </div>
  )
}

export default function GraphQuiz({ sessionData, onNext }) {
  // answers: { [itemId]: { selectedIndex, isCorrect } }
  const [answers, setAnswers] = useState({})

  const items = []
  sessionData.goals?.forEach((g, i) => {
    if (g.trials?.length > 0) items.push({ id: `goal_${i}`, name: g.name, typeLabel: 'Goal — % correct over trials', correctType: 'line', pct: true, labels: g.trials.map((_, j) => 'T' + (j + 1)), values: cumulativePct(g.trials) })
  })
  if (sessionData.frequencyBehavior?.name && sessionData.frequencyBehavior.count > 0)
    items.push({ id: 'freq', name: sessionData.frequencyBehavior.name, typeLabel: 'Frequency — event count per session', correctType: 'line', pct: false, labels: ['Session 1'], values: [sessionData.frequencyBehavior.count] })
  if (sessionData.durationBehavior?.entries?.length > 0)
    items.push({ id: 'dur', name: sessionData.durationBehavior.name, typeLabel: 'Duration — seconds per occurrence', correctType: 'line', pct: false, labels: sessionData.durationBehavior.entries.map((_, i) => 'Occ ' + (i + 1)), values: sessionData.durationBehavior.entries })
  if (sessionData.intervalSessions?.length > 0)
    items.push({ id: 'interval', name: sessionData.intervalSessions[0].behavior, typeLabel: 'Interval — % intervals with behavior per session', correctType: 'line', pct: true, labels: sessionData.intervalSessions.map((_, i) => 'S' + (i + 1)), values: sessionData.intervalSessions.map(s => Math.round(s.occurred / s.total * 1000) / 10) })

  function handleAnswer(id, selectedIndex, isCorrect) {
    setAnswers(p => ({ ...p, [id]: { selectedIndex, isCorrect } }))
  }

  function handleNext() {
    const quizResults = items.map(item => ({
      name: item.name,
      dataType: item.typeLabel,
      selectedCorrectGraph: answers[item.id]?.isCorrect ?? null,
      answered: item.id in answers,
    }))
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
          <p style={{ fontSize: 13, color: 'var(--soft)', marginBottom: 20 }}>Review the data table for each behavior or goal, then select the graph that correctly represents it.</p>
          {items.length === 0
            ? <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, textAlign: 'center', color: 'var(--faint)' }}>No data collected to graph. Click Next to continue.</div>
            : items.map(item => <QuizCard key={item.id} item={item} answer={answers[item.id]?.selectedIndex} onAnswer={handleAnswer} />)
          }
          <button onClick={handleNext} style={{ width: '100%', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontWeight: 700, fontSize: 14, marginTop: 8 }}>Continue to Session Note →</button>
        </div>
      </div>
    </div>
  )
}
