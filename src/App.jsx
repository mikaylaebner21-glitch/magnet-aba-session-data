import { useState, useEffect, useRef } from 'react'
import './App.css'
import { DataChart } from './DataChart'
import { sendToWebhook } from './webhook'

/* ── constants ── */
const ANTECEDENTS = ['Attention presented','Attention removed','Stimulus added','Stimulus removed/altered','Demand presented','Demand removed','Transition','Denied access/told no','Routine change','Alone/unoccupied']
const CONSEQUENCES = ['Positive attention','Negative attention','Redirection','Stimulus added','Demand/activity removed','Item/activity given','Item/activity removed','Ignored','Escape granted']
const WHO_PRESENT  = ['Mom','Dad','Sibling','Teacher','Other caregiver','RBT only','Peer']
const LOCATIONS    = ['Home','Community','Bathroom','Kitchen','Clinic','School','Vehicle']
const NUM_GOALS    = 3

/* ── helpers ── */
function uid() { return Math.random().toString(36).slice(2,9) }

function formatHMS(ms) {
  const s = Math.floor(ms/1000)
  return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(n=>String(n).padStart(2,'0')).join(':')
}
function formatMS(ms) {
  const s = Math.floor(ms/1000)
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}
function pctCorrect(data) {
  if (!data.length) return 0
  return Math.round((data.filter(d=>d.result==='correct').length / data.length)*10)/10*10
}
function cumulativePct(data) {
  let c=0; return data.map((d,i)=>{ if(d.result==='correct') c++; return Math.round(c/(i+1)*1000)/10 })
}

/* ── initial goal state ── */
function initGoals() {
  return Array.from({length:NUM_GOALS},()=>({id:uid(),name:'',phase:'Baseline',trials:[]}))
}

export default function App() {
  /* session timer */
  const [sessionRunning, setSessionRunning] = useState(false)
  const [sessionMs, setSessionMs]           = useState(0)
  const sessRef = useRef(null)
  useEffect(()=>{
    if(sessionRunning){
      sessRef.current = setInterval(()=>setSessionMs(Date.now()-sessRef._start),1000)
      sessRef._start  = Date.now()-sessionMs
    } else clearInterval(sessRef.current)
    return ()=>clearInterval(sessRef.current)
  },[sessionRunning])

  /* goals / trials */
  const [goals,    setGoals]    = useState(initGoals)
  const [activeId, setActiveId] = useState(goals[0].id)
  const [flash,    setFlash]    = useState(null) // {id, result}

  const activeGoal = goals.find(g=>g.id===activeId)

  function updateGoalName(id,name) {
    setGoals(prev=>prev.map(g=>g.id===id?{...g,name}:g))
  }
  function logTrial(goalId, result) {
    setGoals(prev=>prev.map(g=>g.id===goalId?{...g,trials:[...g.trials,{trial:g.trials.length+1,result}]}:g))
    setFlash({id:goalId,result})
    setTimeout(()=>setFlash(null),300)
  }

  /* dock: frequency Bx */
  const [freqName,  setFreqName]  = useState('')
  const [freqCount, setFreqCount] = useState(0)

  /* dock: duration Bx */
  const [durName,    setDurName]    = useState('')
  const [durRunning, setDurRunning] = useState(false)
  const [durMs,      setDurMs]      = useState(0)
  const [durEntries, setDurEntries] = useState([])
  const durRef = useRef(null)
  useEffect(()=>{
    if(durRunning){
      durRef._start = Date.now()
      durRef.current = setInterval(()=>setDurMs(Date.now()-durRef._start),1000)
    } else { clearInterval(durRef.current); setDurMs(0) }
    return ()=>clearInterval(durRef.current)
  },[durRunning])
  function toggleDur(){
    if(durRunning){
      setDurEntries(prev=>[...prev, Math.round((Date.now()-durRef._start)/100)/10])
      setDurRunning(false)
    } else setDurRunning(true)
  }

  /* interval recording */
  const [intMethod,  setIntMethod]  = useState('whole')
  const [intBxName,  setIntBxName]  = useState('')
  const [numInt,     setNumInt]      = useState(10)
  const [intMarks,   setIntMarks]   = useState(Array(10).fill(false))
  const [intSessions,setIntSessions]= useState([])

  function rebuildGrid(n){ setNumInt(n); setIntMarks(Array(n).fill(false)) }
  function toggleMark(i){ setIntMarks(p=>p.map((v,idx)=>idx===i?!v:v)) }
  function logIntSession(){
    const occurred=intMarks.filter(Boolean).length
    setIntSessions(p=>[...p,{behavior:intBxName||'Untitled',method:intMethod,occurred,total:intMarks.length}])
    setIntMarks(Array(numInt).fill(false))
  }

  /* ABC */
  const [abcOpen,    setAbcOpen]    = useState(false)
  const [abcEntries, setAbcEntries] = useState([])
  const [abcDraft,   setAbcDraft]   = useState({antecedent:'',behavior:'',consequence:'',who:'',location:''})
  function toggleAbcField(f,v){ setAbcDraft(p=>({...p,[f]:p[f]===v?'':v})) }
  function submitAbc(){
    if(!abcDraft.behavior.trim()) return
    setAbcEntries(p=>[...p,{...abcDraft,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}])
    setAbcDraft({antecedent:'',behavior:'',consequence:'',who:'',location:''})
    setAbcOpen(false)
  }

  /* session note */
  const [sessionNote, setSessionNote] = useState('')

  /* trainer email */
  const [trainerEmail, setTrainerEmail] = useState('')

  /* validation */
  const [errors,    setErrors]    = useState({})
  const [sending,   setSending]   = useState(false)
  const [sendStatus,setSendStatus]= useState(null)

  function validate() {
    const e={}
    if(!trainerEmail.trim())  e.trainerEmail = 'Trainer\'s email is required'
    if(!freqName.trim())      e.freqName     = 'Frequency behavior name is required'
    if(!durName.trim())       e.durName      = 'Duration behavior name is required'
    if(!intBxName.trim())     e.intBxName    = 'Interval behavior name is required'
    if(!sessionNote.trim())   e.sessionNote  = 'Session note is required'
    goals.forEach(g=>{ if(!g.name.trim()) e[`goal_${g.id}`]='Goal name is required' })
    setErrors(e)
    return Object.keys(e).length===0
  }

  async function handleSubmit(){
    if(!validate()) return
    setSending(true); setSendStatus(null)
    try {
      await sendToWebhook({
        trainerEmail,
        sessionDurationSeconds: Math.round(sessionMs/1000),
        submittedAt: new Date().toISOString(),
        goals: goals.map(g=>({name:g.name,phase:g.phase,trials:g.trials})),
        frequencyBehavior: {name:freqName, count:freqCount},
        durationBehavior:  {name:durName,  entries:durEntries},
        intervalSessions,
        abcEntries,
        sessionNote,
      })
      setSendStatus({ok:true, msg:'Session submitted successfully.'})
    } catch(err) {
      setSendStatus({ok:false, msg:err.message+' — check webhook is configured.'})
    } finally { setSending(false) }
  }

  /* right panel stats for active goal */
  const ag = activeGoal
  const agTrials = ag?.trials || []
  const agCorrect = agTrials.filter(t=>t.result==='correct').length
  const agPct = agTrials.length ? Math.round(agCorrect/agTrials.length*100) : '—'

  return (
    <div className="cr-app">

      {/* nav */}
      <div className="cr-nav">
        <div className="cr-nav-brand">Central<span>Reach</span></div>
        <div className="cr-nav-right">
          <strong>{trainerEmail||'Trainer'}</strong>Magnet ABA
        </div>
      </div>

      {/* session bar */}
      <div className="cr-session-bar">
        {/* CR-style stacked timer */}
        <div className="cr-timer-block">
          {formatHMS(sessionMs).split(':').map((seg,i,arr)=>(
            <span key={i} style={{display:'flex',alignItems:'flex-start',gap:0}}>
              <span className="cr-timer-col">
                <span className={`cr-timer-digit${sessionRunning?' running':''}`}>{seg}</span>
                <span className="cr-timer-label">{['Hours','Minutes','Seconds'][i]}</span>
              </span>
              {i<arr.length-1 && <span className="cr-timer-colon">:</span>}
            </span>
          ))}
        </div>

        <div style={{flex:1,padding:'0 16px'}}>
          <div style={{fontSize:15,fontWeight:700}}>Session</div>
          <div style={{fontSize:11,color:'var(--cr-text-faint)'}}>
            {sessionRunning?'In progress':sessionMs>0?'Paused':'Not started'}
          </div>
        </div>

        <button className={`cr-session-btn ${sessionRunning?'pause':sessionMs>0?'resume':'start'}`}
          onClick={()=>setSessionRunning(r=>!r)}>
          {sessionRunning?'Pause session':sessionMs>0?'Resume session':'Start session'}
        </button>
        <button className="cr-session-btn save" onClick={handleSubmit} disabled={sending}>
          {sending?'Sending…':'Save progress'}
        </button>
      </div>

      {/* 3-col body */}
      <div className="cr-body">

        {/* LEFT sidebar */}
        <div className="cr-sidebar">
          <div className="cr-sidebar-section">
            <div className="cr-sidebar-label">Goals</div>
            {goals.map(g=>(
              <div key={g.id} className={`cr-sidebar-item${g.id===activeId?' active':''}`}
                onClick={()=>setActiveId(g.id)}>
                <span className="item-name">{g.name||'(unnamed goal)'}</span>
                <span className="item-icon">⊕</span>
              </div>
            ))}
          </div>
          <div className="cr-sidebar-section">
            <div className="cr-sidebar-label">Behaviors</div>
            {freqName&&(
              <div className="cr-sidebar-item">
                <span className="item-name">{freqName}</span>
                <span className="item-icon" style={{fontSize:8}}>freq</span>
              </div>
            )}
            {durName&&(
              <div className="cr-sidebar-item">
                <span className="item-name">{durName}</span>
                <span className="item-icon" style={{fontSize:8}}>dur</span>
              </div>
            )}
            {!freqName&&!durName&&(
              <div style={{padding:'6px 14px',fontSize:12,color:'var(--cr-text-faint)'}}>Enter behavior names in dock below</div>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="cr-center">
          <div className="cr-view-label">NET View</div>

          {/* trainer email */}
          <div className="cr-section-card">
            <div className="cr-section-card-header">Session info</div>
            <div className="cr-section-card-body">
              <div className="field" style={{marginBottom:0}}>
                <label>Trainer's email *</label>
                <input type="email" value={trainerEmail}
                  onChange={e=>{setTrainerEmail(e.target.value);setErrors(p=>({...p,trainerEmail:''}))}}
                  placeholder="trainer@magnetaba.com"
                  className={errors.trainerEmail?'invalid':''}/>
                {errors.trainerEmail&&<div className="field-error">{errors.trainerEmail}</div>}
              </div>
            </div>
          </div>

          {/* goal trial cards */}
          {goals.map(g=>(
            <div key={g.id} className={`trial-card${g.id===activeId?' active-card':''}`}
              onClick={()=>setActiveId(g.id)}>
              <div className="trial-card-header">
                <input className="goal-name-input" placeholder="Goal name"
                  value={g.name}
                  onChange={e=>{updateGoalName(g.id,e.target.value);setErrors(p=>({...p,[`goal_${g.id}`]:''}))}}
                  onClick={e=>e.stopPropagation()}/>
                <span className="trial-phase">{g.phase}</span>
              </div>
              {errors[`goal_${g.id}`]&&<div style={{padding:'4px 14px',fontSize:11,color:'var(--cr-red)'}}>{errors[`goal_${g.id}`]}</div>}
              <div className="trial-card-body">
                <div className="trial-counter">
                  Trial {g.trials.length+1} / (No Max)
                </div>
                <div className="trial-btns">
                  <button className={`trial-btn correct${flash?.id===g.id&&flash.result==='correct'?' flash':''}`}
                    onClick={e=>{e.stopPropagation();logTrial(g.id,'correct')}}>✓</button>
                  <button className={`trial-btn incorrect${flash?.id===g.id&&flash.result==='incorrect'?' flash':''}`}
                    onClick={e=>{e.stopPropagation();logTrial(g.id,'incorrect')}}>✕</button>
                </div>
                {g.trials.length>0&&(
                  <div className="trial-history">
                    {g.trials.map((t,i)=>(
                      <div key={i} className={`trial-pip ${t.result}`}>{t.result==='correct'?'✓':'✕'}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* interval recording */}
          <div className="cr-section-card">
            <div className="cr-section-card-header">Interval recording (discontinuous)</div>
            <div className="cr-section-card-body">
              <div className="field">
                <label>Behavior *</label>
                <input value={intBxName}
                  onChange={e=>{setIntBxName(e.target.value);setErrors(p=>({...p,intBxName:''}))}}
                  placeholder="e.g. off-task"
                  className={errors.intBxName?'invalid':''}/>
                {errors.intBxName&&<div className="field-error">{errors.intBxName}</div>}
              </div>
              <div className="method-row">
                <button className={`method-btn${intMethod==='whole'?' active':''}`} onClick={()=>setIntMethod('whole')}>Whole interval</button>
                <button className={`method-btn${intMethod==='partial'?' active':''}`} onClick={()=>setIntMethod('partial')}>Partial interval</button>
              </div>
              <div className="field" style={{marginBottom:10}}>
                <label>Number of intervals</label>
                <input type="number" min={2} max={30} value={numInt}
                  onChange={e=>rebuildGrid(Math.max(2,Math.min(30,parseInt(e.target.value)||10)))}
                  style={{width:80}}/>
              </div>
              <div className="interval-grid">
                {intMarks.map((v,i)=>(
                  <button key={i} className={`interval-cell${v?' marked':''}`} onClick={()=>toggleMark(i)}>{i+1}</button>
                ))}
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

          {/* session note */}
          <div className="cr-section-card">
            <div className="cr-section-card-header">Session note</div>
            <div className="cr-section-card-body">
              <div className="field" style={{marginBottom:0}}>
                <label>Narrative summary *</label>
                <textarea rows={5} value={sessionNote}
                  onChange={e=>{setSessionNote(e.target.value);setErrors(p=>({...p,sessionNote:''}))}}
                  placeholder="Summarize session activities, client presentation, caregiver communication, and any notable events..."
                  className={errors.sessionNote?'invalid':''}/>
                {errors.sessionNote&&<div className="field-error">{errors.sessionNote}</div>}
              </div>
            </div>
          </div>

          {/* ABC entries display */}
          {abcEntries.length>0&&(
            <div className="cr-section-card">
              <div className="cr-section-card-header">ABC entries</div>
              <div className="cr-section-card-body">
                {abcEntries.map((e,i)=>(
                  <div key={i} className="abc-entry-card">
                    <div className="abc-row"><div className="abc-lbl" style={{color:'var(--cr-text-faint)'}}>Time</div><div className="abc-val">{e.time}</div></div>
                    <div className="abc-row abc-a"><div className="abc-lbl">A</div><div className="abc-val">{e.antecedent||'—'}</div></div>
                    <div className="abc-row abc-b"><div className="abc-lbl">B</div><div className="abc-val">{e.behavior}</div></div>
                    <div className="abc-row abc-c"><div className="abc-lbl">C</div><div className="abc-val">{e.consequence||'—'}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* submit status */}
          {sendStatus&&<div className={`status-msg${sendStatus.ok?' ok':' err'}`}>{sendStatus.msg}</div>}
        </div>

        {/* RIGHT panel */}
        <div className="cr-right">
          <div className="cr-right-header">{ag?.name||'(select a goal)'}</div>

          <div className="cr-right-section">
            <div className="cr-right-section-title">% Correct — Last {agTrials.length} trials</div>
            {agTrials.length===0
              ? <div style={{fontSize:12,color:'var(--cr-text-faint)',textAlign:'center',padding:'20px 0'}}>No data to display</div>
              : <div className="cr-chart-wrap">
                  <DataChart type="line"
                    labels={agTrials.map((_,i)=>'T'+(i+1))}
                    values={cumulativePct(agTrials)}
                    color="#1d6fc4" yMax={100} yLabel="% correct"/>
                </div>
            }
          </div>

          <div className="cr-right-section">
            <div className="cr-right-section-title">Stats</div>
            <div className="cr-stat-row"><span>Current phase</span><strong>{ag?.phase||'—'}</strong></div>
            <div className="cr-stat-row"><span>Trials this session</span><strong>{agTrials.length}</strong></div>
            <div className="cr-stat-row"><span>Correct</span><strong>{agCorrect}</strong></div>
            <div className="cr-stat-row"><span>% correct</span><strong>{agPct}{agTrials.length?'%':''}</strong></div>
          </div>

          {intSessions.length>0&&(
            <div className="cr-right-section">
              <div className="cr-right-section-title">Interval % graph</div>
              <div className="cr-chart-wrap">
                <DataChart type="line"
                  labels={intSessions.map((_,i)=>'S'+(i+1))}
                  values={intSessions.map(s=>Math.round(s.occurred/s.total*1000)/10)}
                  color="#b3402f" yMax={100}/>
              </div>
            </div>
          )}

          {durEntries.length>0&&(
            <div className="cr-right-section">
              <div className="cr-right-section-title">Duration per occurrence (sec)</div>
              <div className="cr-chart-wrap">
                <DataChart type="line"
                  labels={durEntries.map((_,i)=>'Occ '+(i+1))}
                  values={durEntries}
                  color="#2f7d4f"/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM DOCK */}
      <div className="cr-dock">
        {/* frequency Bx */}
        <div className="dock-item">
          <div className="dock-item-name">{freqName||<span style={{color:'var(--cr-text-faint)',fontWeight:400,fontSize:11}}>Enter name below</span>}</div>
          <div className="dock-item-phase">Baseline</div>
          <div className="dock-controls">
            <button className="dock-btn" onClick={()=>setFreqCount(c=>Math.max(0,c-1))}>−</button>
            <div className="dock-count">{freqCount}</div>
            <button className="dock-btn" onClick={()=>setFreqCount(c=>c+1)}>+</button>
          </div>
        </div>

        {/* duration Bx */}
        <div className="dock-item">
          <div className="dock-item-name">{durName||<span style={{color:'var(--cr-text-faint)',fontWeight:400,fontSize:11}}>Enter name below</span>}</div>
          <div className="dock-item-phase">Baseline</div>
          <div className="dock-controls">
            <button className={`dock-play-btn${durRunning?' running':''}`} onClick={toggleDur}>{durRunning?'■':'▶'}</button>
            <div className={`dock-timer${durRunning?' running':''}`}>{formatMS(durMs)}</div>
          </div>
        </div>

        {/* write-in names row — shown as small inputs underneath in a sub-row */}
        <div style={{display:'flex',flexDirection:'column',justifyContent:'center',gap:4,padding:'0 12px',borderRight:'1px solid var(--cr-border)',minWidth:220}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:10,color:'var(--cr-text-faint)',minWidth:30}}>Freq:</span>
            <input value={freqName} onChange={e=>{setFreqName(e.target.value);setErrors(p=>({...p,freqName:''}))}}
              placeholder="Target behavior"
              style={{fontSize:12,border:'1px solid var(--cr-border)',borderRadius:4,padding:'3px 6px',flex:1,
                      borderColor:errors.freqName?'var(--cr-red)':'var(--cr-border)'}}/>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:10,color:'var(--cr-text-faint)',minWidth:30}}>Dur:</span>
            <input value={durName} onChange={e=>{setDurName(e.target.value);setErrors(p=>({...p,durName:''}))}}
              placeholder="Target behavior"
              style={{fontSize:12,border:'1px solid var(--cr-border)',borderRadius:4,padding:'3px 6px',flex:1,
                      borderColor:errors.durName?'var(--cr-red)':'var(--cr-border)'}}/>
          </div>
        </div>

        {/* ABC corner */}
        <div className="dock-abc-corner">
          <button className="dock-abc-btn" onClick={()=>setAbcOpen(true)}>ABC</button>
        </div>
      </div>

      {/* ABC modal */}
      {abcOpen&&(
        <div className="abc-modal-overlay" onClick={()=>setAbcOpen(false)}>
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
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <button className="btn-ghost" onClick={()=>setAbcOpen(false)}>Close</button>
              <button className="btn-primary" onClick={submitAbc}>Submit</button>
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
      <div className="pick-list">
        {options.map(opt=>(
          <div key={opt} className={`pick-list-item${value===opt?' selected':''}`} onClick={()=>onPick(opt)}>{opt}</div>
        ))}
      </div>
    </div>
  )
}
