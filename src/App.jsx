import { useState, useEffect, useRef } from 'react'
import './App.css'
import { DataChart } from './DataChart'
import { sendToWebhook } from './webhook'

const ANTECEDENTS = ['Attention presented','Attention removed','Stimulus added','Stimulus removed/altered','Demand presented','Demand removed','Transition','Denied access/told no','Routine change','Alone/unoccupied']
const CONSEQUENCES = ['Positive attention','Negative attention','Redirection','Stimulus added','Demand/activity removed','Item/activity given','Item/activity removed','Ignored','Escape granted']
const WHO_PRESENT  = ['Mom','Dad','Sibling','Teacher','Other caregiver','RBT only','Peer']
const LOCATIONS    = ['Home','Community','Bathroom','Kitchen','Clinic','School','Vehicle']
const NUM_GOALS    = 3

function uid() { return Math.random().toString(36).slice(2,9) }
function pad(n){ return String(n).padStart(2,'0') }
function fmtHMS(ms){ const s=Math.floor(ms/1000); return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}` }
function fmtMS(ms){ const s=Math.floor(ms/1000); return `${pad(Math.floor(s/60))}:${pad(s%60)}` }
function cumulativePct(trials){ let c=0; return trials.map((t,i)=>{ if(t.result==='correct') c++; return Math.round(c/(i+1)*1000)/10 }) }
function initGoals(){ return Array.from({length:NUM_GOALS},()=>({id:uid(),name:'',phase:'Baseline',trials:[]})) }

function StackedTimer({ ms, running }) {
  const s=Math.floor(ms/1000)
  const segs=[{val:pad(Math.floor(s/3600)),lbl:'Hours'},{val:pad(Math.floor((s%3600)/60)),lbl:'Minutes'},{val:pad(s%60),lbl:'Seconds'}]
  return (
    <div className="timer-stacked">
      {segs.map((seg,i)=>(
        <span key={i} style={{display:'flex',alignItems:'flex-start'}}>
          <span className="timer-seg">
            <span className="timer-seg-digit" style={{color:running?'var(--green)':'var(--text)'}}>{seg.val}</span>
            <span className="timer-seg-label">{seg.lbl}</span>
          </span>
          {i<segs.length-1&&<span className="timer-colon">:</span>}
        </span>
      ))}
    </div>
  )
}

export default function App({ onComplete }) {
  // session timer
  const [sessionPhase, setSessionPhase] = useState('idle') // idle|running|paused|ended
  const [sessionMs, setSessionMs] = useState(0)
  const sessRef = useRef({})
  useEffect(()=>{
    if(sessionPhase==='running'){
      sessRef.current._start = Date.now()-sessionMs
      sessRef.current._iv = setInterval(()=>setSessionMs(Date.now()-sessRef.current._start),1000)
    } else clearInterval(sessRef.current._iv)
    return ()=>clearInterval(sessRef.current._iv)
  },[sessionPhase])

  function handleStartPause(){
    if(sessionPhase==='idle') setSessionPhase('running')
    else if(sessionPhase==='running') setSessionPhase('paused')
    else if(sessionPhase==='paused') setSessionPhase('running')
  }
  function handleRestart(){
    setSessionPhase('idle'); setSessionMs(0)
    setGoals(initGoals()); setActiveId(null)
    setFreqName(''); setFreqCount(0)
    setDurName(''); setDurEntries([]); setDurMs(0); setDurRunning(false)
    setIntBxName(''); setIntSessions([]); setIntMarks(Array(10).fill(false))
    setAbcEntries([])
    setSessionNote(''); setTrainerEmail('')
    setErrors({}); setSendStatus(null)
    setView('session')
  }

  // goals
  const [goals, setGoals] = useState(initGoals)
  const [activeId, setActiveId] = useState(()=>initGoals()[0]?.id)
  const [flash, setFlash] = useState(null)
  const ag = goals.find(g=>g.id===activeId)

  function updateGoalName(id,name){ setGoals(p=>p.map(g=>g.id===id?{...g,name}:g)); setErrors(p=>({...p,[`g_${id}`]:''})) }
  function logTrial(goalId,result){
    setGoals(p=>p.map(g=>g.id===goalId?{...g,trials:[...g.trials,{trial:g.trials.length+1,result}]}:g))
    setFlash({id:goalId,result}); setTimeout(()=>setFlash(null),250)
  }

  // dock freq
  const [freqName, setFreqName] = useState('')
  const [freqCount, setFreqCount] = useState(0)

  // dock duration
  const [durName, setDurName] = useState('')
  const [durRunning, setDurRunning] = useState(false)
  const [durMs, setDurMs] = useState(0)
  const [durEntries, setDurEntries] = useState([])
  const durRef = useRef({})
  useEffect(()=>{
    if(durRunning){ durRef.current._start=Date.now(); durRef.current._iv=setInterval(()=>setDurMs(Date.now()-durRef.current._start),1000) }
    else { clearInterval(durRef.current._iv); setDurMs(0) }
    return ()=>clearInterval(durRef.current._iv)
  },[durRunning])
  function toggleDur(){ if(durRunning){ setDurEntries(p=>[...p,Math.round((Date.now()-durRef.current._start)/100)/10]); setDurRunning(false) } else setDurRunning(true) }

  // interval
  const [intMethod, setIntMethod] = useState('whole')
  const [intBxName, setIntBxName] = useState('')
  const [numInt, setNumInt] = useState(10)
  const [intMarks, setIntMarks] = useState(Array(10).fill(false))
  const [intSessions, setIntSessions] = useState([])
  function rebuildGrid(n){ setNumInt(n); setIntMarks(Array(n).fill(false)) }
  function toggleMark(i){ setIntMarks(p=>p.map((v,idx)=>idx===i?!v:v)) }
  function logIntSession(){ const o=intMarks.filter(Boolean).length; setIntSessions(p=>[...p,{behavior:intBxName||'Untitled',method:intMethod,occurred:o,total:intMarks.length}]); setIntMarks(Array(numInt).fill(false)) }

  // ABC
  const [abcOpen, setAbcOpen] = useState(false)
  const [abcEntries, setAbcEntries] = useState([])
  const [abcDraft, setAbcDraft] = useState({antecedent:'',behavior:'',consequence:'',who:'',location:''})
  function toggleAbcField(f,v){ setAbcDraft(p=>({...p,[f]:p[f]===v?'':v})) }
  function submitAbc(){ if(!abcDraft.behavior.trim()) return; setAbcEntries(p=>[...p,{...abcDraft,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]); setAbcDraft({antecedent:'',behavior:'',consequence:'',who:'',location:''}); setAbcOpen(false) }

  // graph all modal
  const [graphModalOpen, setGraphModalOpen] = useState(false)

  const [errors, setErrors] = useState({})
  const centerRef = useRef(null)

  // validate fields required during session
  function validateSession(){
    const e={}
    if(!freqName.trim()) e.freqName='Required'
    if(!durName.trim())  e.durName='Required'
    if(!intBxName.trim()) e.intBxName='Required'
    goals.forEach(g=>{ if(!g.name.trim()) e[`g_${g.id}`]='Required' })
    setErrors(e)
    if(Object.keys(e).length>0){
      setTimeout(()=>{ if(centerRef.current) centerRef.current.scrollTop=0 },50)
    }
    return Object.keys(e).length===0
  }

  function handleGraphAllEndSession(){
    setGraphModalOpen(false)
    if(!validateSession()) return
    setSessionPhase('ended')
    const data = {
      sessionDurationSeconds: Math.round(sessionMs/1000),
      submittedAt: new Date().toISOString(),
      goals: goals.map(g=>({name:g.name,phase:g.phase,trials:g.trials})),
      // flat fields for Make.com mapping
      goal1Name: goals[0]?.name || '',
      goal1Phase: goals[0]?.phase || '',
      goal1Trials: goals[0]?.trials?.length || 0,
      goal1Correct: goals[0]?.trials?.filter(t=>t.result==='correct').length || 0,
      goal1Pct: goals[0]?.trials?.length ? Math.round(goals[0].trials.filter(t=>t.result==='correct').length/goals[0].trials.length*100) + '%' : '0%',
      goal2Name: goals[1]?.name || '',
      goal2Phase: goals[1]?.phase || '',
      goal2Trials: goals[1]?.trials?.length || 0,
      goal2Correct: goals[1]?.trials?.filter(t=>t.result==='correct').length || 0,
      goal2Pct: goals[1]?.trials?.length ? Math.round(goals[1].trials.filter(t=>t.result==='correct').length/goals[1].trials.length*100) + '%' : '0%',
      goal3Name: goals[2]?.name || '',
      goal3Phase: goals[2]?.phase || '',
      goal3Trials: goals[2]?.trials?.length || 0,
      goal3Correct: goals[2]?.trials?.filter(t=>t.result==='correct').length || 0,
      goal3Pct: goals[2]?.trials?.length ? Math.round(goals[2].trials.filter(t=>t.result==='correct').length/goals[2].trials.length*100) + '%' : '0%',
      frequencyBehavior: {name:freqName,count:freqCount},
      durationBehavior: {name:durName,entries:durEntries},
      intervalSessions: intSessions, abcEntries,
    }
    if(onComplete) onComplete(data)
  }

  const agTrials  = ag?.trials||[]
  const agCorrect = agTrials.filter(t=>t.result==='correct').length
  const agPct     = agTrials.length ? Math.round(agCorrect/agTrials.length*100) : '—'

  const startBtnLabel = sessionPhase==='idle'?'Start session':sessionPhase==='running'?'Pause session':sessionPhase==='paused'?'Resume session':'Session ended'

  return (
    <div className="app">
      {/* TOP NAV */}
      <div className="topnav">
        <div className="topnav-brand"><span>Magnet</span> ABA</div>
        <div className="topnav-right"><strong>Trainer</strong>Magnet ABA</div>
      </div>

      {/* 3-COL COLUMNS */}
      <div className="columns">

        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-top">
            <button className="restart-btn" onClick={handleRestart}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Restart Session
            </button>
            <StackedTimer ms={sessionMs} running={sessionPhase==='running'}/>
            <button className="sidebar-btn primary" onClick={handleStartPause} disabled={sessionPhase==='ended'}>{startBtnLabel}</button>
            <button className="sidebar-btn secondary" onClick={()=>setGraphModalOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Graph All
            </button>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-sec-label">Goals</div>
            {goals.map(g=>(
              <div key={g.id} className={`sidebar-item${g.id===activeId?' active':''}`} onClick={()=>setActiveId(g.id)}>
                <span className="si-name">{g.name||'(unnamed goal)'}</span>
                <span className="si-dot">⊕</span>
              </div>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-sec-label">Behaviors</div>
            {freqName ? <div className="sidebar-item"><span className="si-name">{freqName}</span><span className="si-dot" style={{fontSize:7}}>frq</span></div>
              : <div style={{padding:'4px 12px',fontSize:11,color:'var(--faint)'}}>Freq: enter in dock</div>}
            {durName ? <div className="sidebar-item"><span className="si-name">{durName}</span><span className="si-dot" style={{fontSize:7}}>dur</span></div>
              : <div style={{padding:'4px 12px',fontSize:11,color:'var(--faint)'}}>Dur: enter in dock</div>}
          </div>
        </div>

        {/* CENTER */}
        <div className="center" ref={centerRef}>
          <>
              <div className="view-label">NET View</div>
              {goals.map(g=>(
                <div key={g.id} className={`trial-card${g.id===activeId?' selected':''}${errors[`g_${g.id}`]?' err-card':''}`} onClick={()=>setActiveId(g.id)}>
                  <div className="trial-card-hdr">
                    <input className={`goal-input${errors[`g_${g.id}`]?' err':''}`} placeholder="Goal name *"
                      value={g.name} onChange={e=>updateGoalName(g.id,e.target.value)} onClick={e=>e.stopPropagation()}/>
                    <span className="phase-tag">{g.phase}</span>
                  </div>
                  {errors[`g_${g.id}`]&&<div style={{padding:'4px 14px',fontSize:11,color:'var(--red)',fontWeight:600}}>Goal name required</div>}
                  <div className="trial-body">
                    <div className="trial-counter">Trial {g.trials.length+1} / (No Max)</div>
                    <div className="trial-btns">
                      <button className={`tbtn correct${flash?.id===g.id&&flash.result==='correct'?' flash-correct':''}`}
                        onClick={e=>{e.stopPropagation();logTrial(g.id,'correct')}}>✓</button>
                      <button className={`tbtn incorrect${flash?.id===g.id&&flash.result==='incorrect'?' flash-incorrect':''}`}
                        onClick={e=>{e.stopPropagation();logTrial(g.id,'incorrect')}}>✕</button>
                    </div>
                    {g.trials.length>0&&<div className="trial-pips">{g.trials.map((t,i)=><div key={i} className={`pip ${t.result}`}>{t.result==='correct'?'✓':'✕'}</div>)}</div>}
                  </div>
                </div>
              ))}

              <div className="sec-card">
                <div className="sec-card-hdr">Interval recording (discontinuous)</div>
                <div className="sec-card-body">
                  <div className="field">
                    <label>Behavior *</label>
                    <input value={intBxName} onChange={e=>{setIntBxName(e.target.value);setErrors(p=>({...p,intBxName:''}))}}
                      placeholder="e.g. off-task" className={errors.intBxName?'err':''}/>
                    {errors.intBxName&&<div className="field-err">Required</div>}
                  </div>
                  <div className="method-row">
                    <button className={`method-btn${intMethod==='whole'?' active':''}`} onClick={()=>setIntMethod('whole')}>Whole interval</button>
                    <button className={`method-btn${intMethod==='partial'?' active':''}`} onClick={()=>setIntMethod('partial')}>Partial interval</button>
                  </div>
                  <div className="field" style={{marginBottom:12}}>
                    <label>Number of intervals</label>
                    <input type="number" min={2} max={30} value={numInt}
                      onChange={e=>rebuildGrid(Math.max(2,Math.min(30,parseInt(e.target.value)||10)))} style={{width:80}}/>
                  </div>
                  <div className="int-grid">
                    {intMarks.map((v,i)=><button key={i} className={`int-cell${v?' marked':''}`} onClick={()=>toggleMark(i)}>{i+1}</button>)}
                  </div>
                  <button className="btn-primary" onClick={logIntSession}>Log interval session</button>
                  {intSessions.length>0&&(
                    <div className="entry-list" style={{marginTop:12}}>
                      {intSessions.map((s,i)=>(
                        <div className="entry-row" key={i}>
                          <div><div className="entry-main">{s.behavior}</div><div className="entry-sub">{s.method} interval</div></div>
                          <div>{Math.round(s.occurred/s.total*100)}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {abcEntries.length>0&&(
                <div className="sec-card">
                  <div className="sec-card-hdr">ABC entries</div>
                  <div className="sec-card-body">
                    {abcEntries.map((e,i)=>(
                      <div key={i} className="abc-entry" style={{marginBottom:i<abcEntries.length-1?10:0}}>
                        <div className="abc-row"><div className="abc-lbl" style={{color:'var(--faint)'}}>Time</div><div className="abc-val">{e.time}</div></div>
                        <div className="abc-row abc-a"><div className="abc-lbl">A</div><div className="abc-val">{e.antecedent||'—'}</div></div>
                        <div className="abc-row abc-b"><div className="abc-lbl">B</div><div className="abc-val">{e.behavior}</div></div>
                        <div className="abc-row abc-c"><div className="abc-lbl">C</div><div className="abc-val">{e.consequence||'—'}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="rp-header">{ag?.name||'(select a goal)'}</div>
          <div className="rp-section">
            <div className="rp-sec-title">% Correct — Last {agTrials.length} trials</div>
            {agTrials.length===0
              ? <div style={{fontSize:12,color:'var(--faint)',textAlign:'center',padding:'20px 0'}}>No data to display</div>
              : <div className="chart-wrap"><DataChart type="line" labels={agTrials.map((_,i)=>'T'+(i+1))} values={cumulativePct(agTrials)} color="#1d6fc4" yMax={100} yLabel="% correct"/></div>
            }
          </div>
          <div className="rp-section">
            <div className="rp-sec-title">Stats</div>
            <div className="stat-row"><span>Current phase</span><strong>{ag?.phase||'—'}</strong></div>
            <div className="stat-row"><span>Trials this session</span><strong>{agTrials.length}</strong></div>
            <div className="stat-row"><span>Correct</span><strong>{agCorrect}</strong></div>
            <div className="stat-row"><span>% correct</span><strong>{agPct}{agTrials.length?'%':''}</strong></div>
          </div>
          {intSessions.length>0&&(
            <div className="rp-section">
              <div className="rp-sec-title">Interval % per session</div>
              <div className="chart-wrap"><DataChart type="line" labels={intSessions.map((_,i)=>'S'+(i+1))} values={intSessions.map(s=>Math.round(s.occurred/s.total*1000)/10)} color="#b3402f" yMax={100}/></div>
            </div>
          )}
          {durEntries.length>0&&(
            <div className="rp-section">
              <div className="rp-sec-title">Duration per occurrence (sec)</div>
              <div className="chart-wrap"><DataChart type="line" labels={durEntries.map((_,i)=>'Occ '+(i+1))} values={durEntries} color="#2f7d4f"/></div>
            </div>
          )}
        </div>
      </div>

      {/* DOCK */}
      <div className="dock">
        <div className={`dock-col${errors.freqName?' err-col':''}`}>
          <input className={`dock-name-input${errors.freqName?' err':''}`} placeholder="Target behavior *"
            value={freqName} onChange={e=>{setFreqName(e.target.value);setErrors(p=>({...p,freqName:''}))}}/>
          <div className="dock-phase">Baseline</div>
          <div className="dock-controls">
            <button className="dock-stepper" onClick={()=>setFreqCount(c=>Math.max(0,c-1))}>−</button>
            <div className="dock-count">{freqCount}</div>
            <button className="dock-stepper" onClick={()=>setFreqCount(c=>c+1)}>+</button>
          </div>
        </div>
        <div className={`dock-col${errors.durName?' err-col':''}`}>
          <input className={`dock-name-input${errors.durName?' err':''}`} placeholder="Target behavior *"
            value={durName} onChange={e=>{setDurName(e.target.value);setErrors(p=>({...p,durName:''}))}}/>
          <div className="dock-phase">Baseline</div>
          <div className="dock-controls">
            <button className={`dock-play${durRunning?' running':''}`} onClick={toggleDur}>{durRunning?'■':'▶'}</button>
            <div className={`dock-timer${durRunning?' running':''}`}>{fmtMS(durMs)}</div>
          </div>
        </div>
        <div className="dock-abc-col">
          <button className="dock-abc-btn" onClick={()=>setAbcOpen(true)}>ABC</button>
        </div>
      </div>

      {/* ABC MODAL */}
      {abcOpen&&(
        <div className="abc-overlay" onClick={()=>setAbcOpen(false)}>
          <div className="abc-modal" onClick={e=>e.stopPropagation()}>
            <div className="abc-modal-title">ABC Collection</div>
            <div className="field">
              <label>Behavior (write in) *</label>
              <input value={abcDraft.behavior} onChange={e=>setAbcDraft(p=>({...p,behavior:e.target.value}))} placeholder="e.g. Elopement"/>
            </div>
            <PickList title="Antecedent" options={ANTECEDENTS} value={abcDraft.antecedent} onPick={v=>toggleAbcField('antecedent',v)}/>
            <PickList title="Consequence" options={CONSEQUENCES} value={abcDraft.consequence} onPick={v=>toggleAbcField('consequence',v)}/>
            <PickList title="Who was present" options={WHO_PRESENT} value={abcDraft.who} onPick={v=>toggleAbcField('who',v)}/>
            <PickList title="Location" options={LOCATIONS} value={abcDraft.location} onPick={v=>toggleAbcField('location',v)}/>
            <div className="abc-modal-btns">
              <button className="btn-secondary" style={{flex:1}} onClick={()=>setAbcOpen(false)}>Close</button>
              <button className="btn-primary" style={{flex:2}} onClick={submitAbc}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* GRAPH ALL MODAL */}
      {graphModalOpen&&(
        <div className="modal-overlay" onClick={()=>setGraphModalOpen(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Graph All</div>
            <div className="modal-note">Targets with no data collected will be graphed as a zero (0).</div>
            <div className="modal-btns">
              <button className="modal-btn blue" onClick={()=>setGraphModalOpen(false)}>Graph All</button>
              <button className="modal-btn blue" onClick={handleGraphAllEndSession}>Graph All and End Session</button>
              <button className="modal-btn close" onClick={()=>setGraphModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PickList({title,options,value,onPick}){
  return(
    <div className="field">
      <label>{title}</label>
      <div className="picklist">
        {options.map(o=><div key={o} className={`pick-item${value===o?' sel':''}`} onClick={()=>onPick(o)}>{o}</div>)}
      </div>
    </div>
  )
}
