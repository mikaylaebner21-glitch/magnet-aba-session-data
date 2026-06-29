import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DataCollection from './App'
import GraphQuiz from './pages/GraphQuiz'
import CalendarPage from './pages/CalendarPage'
import SessionNote from './pages/SessionNote'

function Router() {
  const [page, setPage] = useState('collect') // collect | quiz | calendar | note
  const [sessionData, setSessionData] = useState(null)
  const [quizResults, setQuizResults] = useState(null)
  const [sessionMeta, setSessionMeta] = useState(null)

  if(page === 'collect') return <DataCollection onComplete={data=>{ setSessionData(data); setPage('quiz') }}/>
  if(page === 'quiz')     return <GraphQuiz sessionData={sessionData} onNext={results=>{ setQuizResults(results); setPage('calendar') }}/>
  if(page === 'calendar') return <CalendarPage sessionData={sessionData} onNext={meta=>{ setSessionMeta(meta); setPage('note') }}/>
  if(page === 'note')     return <SessionNote sessionData={sessionData} quizResults={quizResults} sessionMeta={sessionMeta} onDone={()=>setPage('collect')}/>
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Router/></StrictMode>
)
