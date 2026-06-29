import { useState } from 'react'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = Array.from({length:11},(_,i)=>i+8) // 8am-6pm

function pad(n){ return String(n).padStart(2,'0') }
function fmt12(h){ return h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm` }

export default function CalendarPage({ sessionData, onNext }) {
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [sessionStart, setSessionStart] = useState('09:00')
  const [sessionEnd, setSessionEnd] = useState('11:00')
  const [showConvert, setShowConvert] = useState(false)
  const [showNewNote, setShowNewNote] = useState(false)

  const dateObj = new Date(sessionDate + 'T12:00:00')
  const dayOfWeek = dateObj.getDay()
  const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const startH = parseInt(sessionStart.split(':')[0])
  const startM = parseInt(sessionStart.split(':')[1])
  const endH   = parseInt(sessionEnd.split(':')[0])
  const endM   = parseInt(sessionEnd.split(':')[1])

  const startPx = ((startH - 8) * 60 + startM) * (56/60)
  const heightPx = ((endH - startH)*60 + (endM-startM)) * (56/60)

  // build week dates around session date
  const weekStart = new Date(dateObj)
  weekStart.setDate(dateObj.getDate() - dayOfWeek)
  const weekDates = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d })

  return (
    <div style={{ display:'grid', gridTemplateRows:'48px 1fr', height:'100vh', overflow:'hidden' }}>
      {/* Nav */}
      <div style={{ background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
        <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}><span style={{ color:'#6ea8e8' }}>Magnet</span> ABA</div>
        <div style={{ color:'#cfe0f5', fontSize:12 }}>Step 3 of 4 — Session Calendar</div>
        <div style={{width:80}}/>
      </div>

      <div style={{ overflowY:'auto', display:'flex', flexDirection:'column' }}>
        {/* CR-style top bar */}
        <div style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Week</div>
            <div style={{ fontSize:13, color:'var(--soft)' }}>{dateLabel}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setShowTimeInput(true)}
              style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'7px 14px', fontWeight:600, fontSize:12 }}>
              + Set Session Time
            </button>
          </div>
        </div>

        {/* Time input modal */}
        {showTimeInput && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
            <div style={{ background:'var(--white)', borderRadius:10, padding:24, width:340 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Set Shadow Session Time</div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--soft)', display:'block', marginBottom:4 }}>Date</label>
                <input type="date" value={sessionDate} onChange={e=>setSessionDate(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:6 }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--soft)', display:'block', marginBottom:4 }}>Start time</label>
                  <input type="time" value={sessionStart} onChange={e=>setSessionStart(e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:6 }}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--soft)', display:'block', marginBottom:4 }}>End time</label>
                  <input type="time" value={sessionEnd} onChange={e=>setSessionEnd(e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:6 }}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowTimeInput(false)}
                  style={{ flex:1, background:'var(--white)', border:'1px solid var(--border)', borderRadius:6, padding:10, fontWeight:600, fontSize:13 }}>Cancel</button>
                <button onClick={()=>setShowTimeInput(false)}
                  style={{ flex:2, background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:10, fontWeight:600, fontSize:13 }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div style={{ flex:1, padding:'0 20px 20px', minHeight:600 }}>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'56px repeat(7,1fr)', borderBottom:'1px solid var(--border)', paddingBottom:6, marginBottom:0, marginTop:12 }}>
            <div/>
            {weekDates.map((d,i)=>(
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--faint)', textTransform:'uppercase' }}>{DAYS[i]}</div>
                <div style={{ fontSize:16, fontWeight: d.toDateString()===dateObj.toDateString()?700:400, color: d.toDateString()===dateObj.toDateString()?'var(--blue)':'var(--text)' }}>{d.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div style={{ position:'relative', display:'grid', gridTemplateColumns:'56px repeat(7,1fr)' }}>
            {/* Hour rows */}
            {HOURS.map(h=>(
              <div key={h} style={{ display:'contents' }}>
                <div style={{ borderBottom:'1px solid var(--border)', height:56, display:'flex', alignItems:'flex-start', paddingTop:2 }}>
                  <span style={{ fontSize:10, color:'var(--faint)' }}>{fmt12(h)}</span>
                </div>
                {Array.from({length:7},(_,i)=>(
                  <div key={i} style={{ borderBottom:'1px solid var(--border)', borderLeft:'1px solid var(--border)', height:56 }}/>
                ))}
              </div>
            ))}

            {/* Session block */}
            {sessionDate && (
              <div
                onClick={()=>setShowConvert(true)}
                style={{
                  position:'absolute',
                  top: startPx + 'px',
                  left: `calc(56px + ${dayOfWeek} * (100% - 56px) / 7 + 2px)`,
                  width: `calc((100% - 56px) / 7 - 4px)`,
                  height: Math.max(heightPx, 30) + 'px',
                  background:'#4a90d9',
                  borderRadius:4,
                  padding:'4px 6px',
                  cursor:'pointer',
                  overflow:'hidden',
                }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{sessionStart}-{sessionEnd}</div>
                <div style={{ fontSize:11, color:'#d6eaff' }}>Direct Services</div>
                <div style={{ fontSize:10, color:'#d6eaff' }}>Shadow Session #2</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert modal */}
      {showConvert && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div style={{ background:'var(--white)', borderRadius:10, padding:24, width:400 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>Direct Services</div>
              <button onClick={()=>setShowConvert(false)} style={{ border:'none', background:'transparent', fontSize:18, color:'var(--faint)', cursor:'pointer' }}>×</button>
            </div>
            <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse', marginBottom:20 }}>
              <tbody>
                {[['Provider','Mikayla Ebner, BCBA'],['Client','Alex Johnson'],['Date & time',`${dateLabel}, ${sessionStart} - ${sessionEnd}`],['Last edited','Just now']].map(([k,v])=>(
                  <tr key={k} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'8px 4px', color:'var(--soft)', fontWeight:600, width:100 }}>{k}</td>
                    <td style={{ padding:'8px 4px' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={()=>setShowConvert(false)} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', fontSize:13, fontWeight:600 }}>Cancel</button>
              <button onClick={()=>{setShowConvert(false);setShowNewNote(true)}}
                style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:700 }}>Convert</button>
            </div>
          </div>
        </div>
      )}

      {/* New Note modal */}
      {showNewNote && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div style={{ background:'var(--white)', borderRadius:10, padding:24, width:420 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
              <div style={{ border:'1px solid var(--border)', borderRadius:8, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--faint)', marginBottom:8 }}>FILES</div>
                <button style={{ background:'transparent', border:'1px solid var(--teal)', color:'var(--teal)', borderRadius:6, padding:'8px 12px', fontSize:12, fontWeight:700, width:'100%' }}>ATTACH FILE(S)</button>
              </div>
              <div style={{ border:'1px solid var(--border)', borderRadius:8, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--faint)', marginBottom:4 }}>(97153) DIRECT SERV</div>
                <div style={{ fontSize:10, color:'var(--faint)', marginBottom:8 }}>At least one required</div>
                <button onClick={()=>{ setShowNewNote(false); onNext({ sessionDate, sessionStart, sessionEnd }) }}
                  style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', fontSize:12, fontWeight:700, width:'100%', marginBottom:6 }}>NEW NOTE</button>
                <button style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', fontSize:12, fontWeight:600, width:'100%' }}>SELECT EXISTING NOTE</button>
              </div>
              <div style={{ border:'1px solid var(--border)', borderRadius:8, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'var(--faint)', marginBottom:8 }}>SIGNATURES</div>
                <button style={{ background:'transparent', border:'1px dashed var(--teal)', color:'var(--teal)', borderRadius:6, padding:'8px 12px', fontSize:12, fontWeight:700, width:'100%', marginBottom:6 }}>CLIENT SIGNATURE</button>
                <button style={{ background:'transparent', border:'1px dashed var(--teal)', color:'var(--teal)', borderRadius:6, padding:'8px 12px', fontSize:12, fontWeight:700, width:'100%' }}>PROVIDER SIGNATURE</button>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button onClick={()=>setShowNewNote(false)} style={{ background:'transparent', border:'none', fontSize:13, color:'var(--soft)' }}>CANCEL</button>
              <button style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'8px 20px', fontWeight:700, fontSize:13 }}>SUBMIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
