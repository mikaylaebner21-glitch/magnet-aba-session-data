import { useState, useRef, useEffect } from 'react'
import { sendToWebhook } from '../webhook'

// ── constants ──
const CLIENT = { name: 'Alex Johnson', dob: '03/14/2018', age: '8', gender: 'Male', diagnosis: 'Autism Spectrum Disorder (F84.0)', insurance: 'Blue Cross Blue Shield', id: 'AJ-2018-001', address: '123 Practice Lane, Kansas City, MO' }
const PROVIDER = { name: 'Mikayla Ebner', credentials: 'BCBA, LBA', npi: '0000000000', org: 'Magnet ABA Therapy', code: '97153', phone: '816.924.3810' }

const SOCIAL_BXS = ['Abnormalities in eye contact and body-language','Failure of back and forth conversation','Difficulties adjusting behavior to suit different social contexts','Absence of interest in people','Difficulties in initiating, responding to, and maintaining social interactions (Abnormal social approach)']
const RESTRICTED_BXS = ['Echolalia / Scripting','Excessive adherence to routines','Perseverative interests','Motor stereotypies','Unusual interest in sensory aspects of environment','Adverse response to specific sounds or textures']
const VARIABLES = ['No variables impacted service delivery','Routine or changes to routine','Cultural Factors','Denial or rejection of services by family','Sleep','Lost, misplaced, or lack of materials','Family factors','Financial factors','Treatment infidelity or inconsistency with implementation','Reinforcement of maladaptive behaviors','Hunger','Medications','Environment','Scheduling, availability, or cancellations','Lack of training or support','Comorbid diagnoses or other diagnoses','Stress','Illness or health']
const ANTECEDENT_INTERVENTIONS = ['Offering choice','FCT','Visual supports','Scheduling transitional activities','Noncontingent reinforcement or attention','Manipulating MO\'s','Priming','Task dispersal','Presence of specific people or stimuli','Modifying instructional delivery','Environmental modifications','Premack Principle (First/Then)','Enriching the environment','Removal of specific people or stimuli','Behavior momentum/ high probability sequences']
const GENERALIZATION = ['Variation of people','Variation of language or wording','Intermittent or variable schedules of reinforcement','Multiple exemplar training','Requiring varied responses from client','Variation of settings','Variation of time of day','Naturally-occurring reinforcement','Using stimuli within the natural environment or client\'s own stimuli/materials','Formal generalization programs such as R.E.A.L.','Variation of materials or stimuli','Reinforcing untrained or novel behaviors','Running trials with natural stimuli or in the natural setting for the behavior','Maintenance probes']
const REINFORCEMENT = ['Edibles','Escape from aversives','Breaks','Token economy','Social praise','Attention','Access to preferred people','Sensory stimulation','Honoring mands','Access to preferred items or activities','Videos, TV, movies']
const MOOD_OPTIONS = ['Calm and Regulated','Alert and Responsive','Fatigued or Low Energy Presentation Observed','Appeared Ill or Physically Uncomfortable','Highly Active or Sensory-Seeking at Session Start','Required Support to Transition Into Session','Demonstrated Variable Regulation Throughout Session Initiation','Demonstrated Variable Engagement During Session Initiation','Demonstrated Appropriate Transition Into Session Activities']
const RESPONSE_TO_PARTICIPANTS = ['mostly positive; client engaged positively with participants and demonstrated prosocial interactions','inconsistent; periods of positive engagement were observed alongside periods of avoidance or maladaptive behavior','mostly negative; client engaged in maladaptive or unwanted behaviors toward participants']
const LEVEL_OF_PARTICIPATION = ['full participation','limited participation (verbal/physical protests present)','task refusal']
const INTERACTION_TYPES = ['appropriate','mixed','inappropriate']
const CHOICES_OPTIONS = ['reinforcers','activities','task order','work environment','work/break durations']
const SKILL_FOCUS = ['communication','social','safety','motor','adaptive','school readiness','joint attention','play','group','pairing']
const INTERVENTIONS = ['Antecedent-Based Interventions (ABI)','Functional Communication Training (FCT)','Discrete Trial Teaching (DTT)','Natural Environment Teaching (NET)','Social Skills Training (SST)','Differential Reinforcement (DR)','Picture Exchange Communication Systems (PECS)','PRT','Self-management','Social narratives','Structured play group','Task analysis','Shaping','Tolerance training','ACT/AIM','Peer-mediated instruction','Technology-aided instruction','Visual supports']
const PROMPTING = ['verbal prompts','visual prompts','model prompts','gesture prompts','full physical prompts','partial physical prompts','positional prompts','least-to-most prompts','most-to-least prompts','errorless prompts','graduated guidance','no prompting (not needed)']
const RESPONSE_OPTIONS = ['responded consistently to interventions','demonstrated variable responding','required increased prompting/support','demonstrated intermittent dysregulation','demonstrated improved responding following intervention','tolerated intervention with moderate support']
const PROGRESS_OPTIONS = ['Demonstrated Consistent Responding to Intervention Procedures','Demonstrated Variable Responding to Intervention Procedure','Demonstrated Increased Independence Across Activities','Required Increased Prompting to Maintain Engagement','Demonstrated Progress Across Targeted Skills','Demonstrated Limited Progress During Session Activities','Demonstrated Generalization of Skills Across Activities or Partners','Demonstrated Increased Maladaptive Behaviors Interfering With Progress','Demonstrated Improved Engagement Following Intervention Implementation','Required Frequent Redirection During Activities']
const SOCIAL_SYMPTOMS = ['difficulty generalizing social skills across settings or communication partners','inconsistent use of pragmatic language skills in social contexts','difficulty interpreting subtle social cues (tone of voice, facial expressions, sarcasm)','challenges with conversational flexibility (e.g., topic shifting, turn-taking)','limited perspective-taking or difficulty interpreting others\' thoughts or feelings','difficulty adjusting behavior to suit social context','deficits in understanding or using nonverbal communication','abnormalities in eye contact or body language','reduced sharing of interests, emotions, or affect','difficulties in sharing or imaginative play','lack of social interaction or initiation','lack of interest in others']
const RESTRICTED_SYMPTOMS = ['motor stereotypy or physical stimming','echolalia, scripting, or verbal stimming','repetitive use of objects','ritual patterns of behavior','rigidity or inflexibility','perseverative interests','difficulty tolerating ambiguity or unexpected changes in routine','difficulty transitioning away from preferred activities or topics','distress related to interruptions in preferred activities or routines','need for predictability that impacts independence or participation','sensory sensitivities impacting participation (e.g., noise, textures, light)','sensory seeking impacting participation (e.g., noise, textures, movement)','repetitive verbalizations or topic perseveration impacting reciprocal interaction','repetitive motor or vocal behaviors that interfere with social engagement','insistence on completing activities in specific or repetitive ways']
const INDICATORS = ['Progress consistent with current treatment targets','Variable Progress observed across targets','Limited progress observed during session','Increased prompt dependency observed','Increased maladaptive behaviors interfered with progress','Skill acquisition observed across multiple targets','Generalization of skills observed','Inconsistent responding observed across activities','Barriers significantly impacted participation','Additional support required to maintain engagement']
const ANTECEDENTS_MAL = ['Transition Demand','Denied Access','Waiting','Attention Diverted','Peer Interaction','Task Demand','Interruption of Preferred Activity','Environmental Change','Non-Preferred Instruction','Unexpected Routine Change','Other']
const CONSEQUENCE_MAL = ['Extinction- planned ignoring','Tangible extinction','Escape extinction','Extinction- wait strategy','Redirection','FCT','DRA/DRI/DRO','Self-management','RIR','Visual support','Social narratives','Punishment procedures','Natural Consequences','N/A - Baseline','Other']
const REPLACEMENT_BX = ['Functional communication','Break, space, or time','Exercise','Mindfulness/ coping skills','Sensory objects or actions','N/A - Baseline','Other']

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', fontSize:13, lineHeight:1.4, marginBottom:4 }}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ marginTop:2, flexShrink:0 }}/>
      {label}
    </label>
  )
}

function MultiCheck({ options, values, onChange }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 16px' }}>
      {options.map(o=>(
        <Checkbox key={o} label={o} checked={values.includes(o)} onChange={c=>{ onChange(c ? [...values,o] : values.filter(v=>v!==o)) }}/>
      ))}
    </div>
  )
}

function RedDropdown({ label, options, value, onChange, multi }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const [dropPos, setDropPos] = useState({top:0,left:0})
  const hasValue = multi ? (value?.length > 0) : !!value
  const display = multi ? (value?.length ? value.join(', ') : label) : (value || label)

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    }
    setOpen(o => !o)
  }

  return (
    <span style={{ position:'relative', display:'inline-block' }}>
      <button ref={btnRef} onClick={handleOpen}
        style={{ background: hasValue ? '#e8e8e8' : '#c0392b', color: hasValue ? '#333' : '#fff', border: hasValue ? '1px solid #ccc' : 'none', borderRadius:4, padding:'2px 8px', fontSize:12, fontWeight: hasValue ? 400 : 600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, maxWidth:320 }}>
        {!hasValue && '⚠ '}{display} ▾
      </button>
      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:9998 }} onClick={()=>setOpen(false)}/>
          <div style={{ position:'absolute', top:'100%', left:0, background:'var(--white)', border:'1px solid var(--border)', borderRadius:6, zIndex:9999, minWidth:220, maxWidth:340, boxShadow:'0 4px 12px rgba(0,0,0,0.2)', maxHeight:200, overflowY:'auto' }}>
            {options.map(o=>(
              <div key={o} onClick={()=>{ if(multi){ onChange(value?.includes(o)?value.filter(v=>v!==o):[...(value||[]),o]) } else { onChange(o); setOpen(false) } }}
                style={{ padding:'8px 12px', fontSize:13, cursor:'pointer', background:(!multi&&value===o)||(multi&&value?.includes(o))?'var(--blue-dim)':'transparent', borderBottom:'1px solid var(--border)' }}>
                {o}
              </div>
            ))}
          </div>
        </>
      )}
    </span>
  )
}

function GoalSelector({ goals, value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position:'relative', display:'inline-block' }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ background: value?.length>0 ? '#e8e8e8' : '#c0392b', color: value?.length>0 ? '#333' : '#fff', border: value?.length>0 ? '1px solid #ccc' : 'none', borderRadius:4, padding:'2px 8px', fontSize:12, fontWeight: value?.length>0 ? 400 : 600, cursor:'pointer' }}>
        {!value?.length && '⚠ '}Select Goals for Progress Report ▾
      </button>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, background:'var(--white)', border:'1px solid var(--border)', borderRadius:6, zIndex:100, minWidth:260, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
          {goals.map(g=>(
            <div key={g} onClick={()=>onChange(value?.includes(g)?value.filter(v=>v!==g):[...(value||[]),g])}
              style={{ padding:'8px 12px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--border)', background:value?.includes(g)?'var(--blue-dim)':'transparent' }}>
              <input type="checkbox" readOnly checked={value?.includes(g)||false}/> {g}
            </div>
          ))}
          <div style={{ padding:8 }}><button onClick={()=>setOpen(false)} style={{ width:'100%', background:'var(--blue)', color:'#fff', border:'none', borderRadius:4, padding:'6px', fontWeight:600 }}>Done</button></div>
        </div>
      )}
    </span>
  )
}

// Signature pad
function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [mode, setMode] = useState('draw') // draw | type
  const [typed, setTyped] = useState('')

  useEffect(()=>{ if(mode==='type'&&typed) onChange(typed) },[typed,mode])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    if(e.touches) return { x: e.touches[0].clientX-rect.left, y: e.touches[0].clientY-rect.top }
    return { x: e.clientX-rect.left, y: e.clientY-rect.top }
  }
  function start(e){ drawing.current=true; const c=canvasRef.current; const ctx=c.getContext('2d'); const p=getPos(e,c); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault() }
  function move(e){ if(!drawing.current) return; const c=canvasRef.current; const ctx=c.getContext('2d'); const p=getPos(e,c); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#1a1d1f'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke(); onChange(c.toDataURL()); e.preventDefault() }
  function end(){ drawing.current=false }
  function clear(){ const c=canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); onChange('') }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <button onClick={()=>setMode('draw')} style={{ fontSize:12, padding:'4px 10px', background:mode==='draw'?'var(--blue)':'var(--white)', color:mode==='draw'?'#fff':'var(--text)', border:'1px solid var(--border)', borderRadius:4 }}>Draw</button>
        <button onClick={()=>setMode('type')} style={{ fontSize:12, padding:'4px 10px', background:mode==='type'?'var(--blue)':'var(--white)', color:mode==='type'?'#fff':'var(--text)', border:'1px solid var(--border)', borderRadius:4 }}>Type</button>
        {mode==='draw'&&<button onClick={clear} style={{ fontSize:12, padding:'4px 10px', background:'var(--white)', border:'1px solid var(--border)', borderRadius:4 }}>Clear</button>}
      </div>
      {mode==='draw'
        ? <canvas ref={canvasRef} width={400} height={100} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            style={{ border:'1px solid var(--border)', borderRadius:6, width:'100%', maxWidth:400, height:100, cursor:'crosshair', touchAction:'none' }}/>
        : <input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type full name as signature"
            style={{ width:'100%', padding:'10px 12px', fontSize:18, fontFamily:'cursive', border:'1px solid var(--border)', borderRadius:6 }}/>
      }
    </div>
  )
}

// ── Page 1: Client info + session details ──
function Page1({ form, setForm, sessionMeta, goals }) {
  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'20px 0' }}>
      <div style={{ textAlign:'center', marginBottom:16 }}>
        <div style={{ fontWeight:800, fontSize:22, color:'var(--navy)' }}>MAGNET ABA THERAPY</div>
        <div style={{ fontSize:12, color:'var(--soft)' }}>Direct Service Session Note</div>
      </div>

      {/* Client info table */}
      <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #000', marginBottom:12, fontSize:12 }}>
        <tbody>
          <tr>
            <td style={tdS}><b>Client Full Legal Name:</b> {CLIENT.name}</td>
            <td style={tdS}><b>Client Birth Date:</b> {CLIENT.dob}</td>
          </tr>
          <tr>
            <td style={tdS}><b>Client Gender:</b> {CLIENT.gender}</td>
            <td style={tdS}><b>Client Age:</b> {CLIENT.age}</td>
          </tr>
          <tr>
            <td style={tdS} colSpan={2}><b>Client Diagnosis:</b> {CLIENT.diagnosis}</td>
          </tr>
          <tr>
            <td style={tdS} colSpan={2}><b>Client Insurance:</b> {CLIENT.insurance}</td>
          </tr>
          <tr>
            <td style={tdS}><b>Provider Name:</b> {PROVIDER.name}</td>
            <td style={tdS}><b>NPI:</b> {PROVIDER.npi}</td>
          </tr>
          <tr>
            <td style={tdS}><b>Provider Credentials:</b> {PROVIDER.credentials}</td>
            <td style={tdS}><b>ID:</b> {PROVIDER.code}</td>
          </tr>
          <tr>
            <td style={tdS}><b>Service:</b> {PROVIDER.code} – Direct Services</td>
            <td style={tdS}><b>Rendering Organization:</b> {PROVIDER.org}</td>
          </tr>
          <tr>
            <td style={tdS}><b>Session Date:</b> {sessionMeta.sessionDate}</td>
            <td style={tdS}><b>Time:</b> {sessionMeta.sessionStart} – {sessionMeta.sessionEnd}</td>
          </tr>
        </tbody>
      </table>

      {/* Individuals present */}
      <div style={{ border:'1px solid #000', padding:0, marginBottom:12 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <tbody>
            <tr>
              <td style={{ border:'1px solid #000', padding:'8px 10px', width:'60%' }}>
                <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>Individuals Present for Session:</div>
                <div style={{ display:'flex', gap:16, marginBottom:10, flexWrap:'wrap' }}>
                  {['BT/ RBT','Client','Parent/ Responsible Party'].map(o=>(
                    <label key={o} style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer', fontSize:13 }}>
                      <span style={{ background:form.present?.includes(o)?'#c0392b':'transparent', border:'2px solid #c0392b', width:16, height:16, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:2, flexShrink:0 }}
                        onClick={()=>setForm(p=>({ ...p, present:(p.present||[]).includes(o)?(p.present||[]).filter(v=>v!==o):[...(p.present||[]),o] }))}>
                        {form.present?.includes(o) && <span style={{color:'#fff',fontSize:10,fontWeight:700}}>▲</span>}
                      </span>
                      {o}
                    </label>
                  ))}
                </div>
                <div style={{ display:'flex', gap:16, marginBottom:8, flexWrap:'wrap' }}>
                  <Checkbox label="Supervising Provider (BCBA/BCaBA)" checked={form.supBCBA||false} onChange={c=>setForm(p=>({...p,supBCBA:c}))}/>
                  <Checkbox label="Supervising Provider (Non-BCBA/BCaBA)" checked={form.supNonBCBA||false} onChange={c=>setForm(p=>({...p,supNonBCBA:c}))}/>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Checkbox label="Other:" checked={form.otherPresent||false} onChange={c=>setForm(p=>({...p,otherPresent:c}))}/>
                  {form.otherPresent && <input value={form.otherPresentText||''} onChange={e=>setForm(p=>({...p,otherPresentText:e.target.value}))} placeholder="Text box" style={{ padding:'3px 8px', fontSize:12, border:'1px solid var(--border)', borderRadius:4, flex:1 }}/>}
                </div>
                <div style={{ fontWeight:700, fontSize:12, marginBottom:6 }}>Was the Responsible Party an Active Participant?:</div>
                <select value={form.parentActive||''} onChange={e=>setForm(p=>({...p,parentActive:e.target.value}))}
                  style={{ background:form.parentActive?'#e8e8e8':'#c0392b', color:form.parentActive?'#333':'#fff', border:'none', borderRadius:4, padding:'4px 10px', fontSize:12, fontWeight:600 }}>
                  <option value="">⚠ Participate with Client during Session? ▾</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </td>
              <td style={{ border:'1px solid #000', padding:'8px 10px', verticalAlign:'top', width:'40%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:12 }}>Location Of Service:</span>
                  <select value={form.location||''} onChange={e=>setForm(p=>({...p,location:e.target.value}))}
                    style={{ background:form.location?'#e8e8e8':'#c0392b', color:form.location?'#333':'#fff', border:'none', borderRadius:4, padding:'3px 8px', fontSize:12, fontWeight:600 }}>
                    <option value="">⚠ Select One ▾</option>
                    {['Home','Clinic','School','Community','Telehealth','Other'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ fontSize:12, color:'var(--soft)', marginBottom:4 }}>If other:</div>
                <textarea rows={2} value={form.locationOther||''} onChange={e=>setForm(p=>({...p,locationOther:e.target.value}))} placeholder="Text area" style={{ width:'100%', padding:'4px 8px', fontSize:12, border:'1px solid var(--border)', borderRadius:4, resize:'none', background:'var(--bg)' }}/>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Supervising Provider on Case */}
      <div style={{ border:'1px solid #000', padding:0, marginBottom:12 }}>
        <div style={{ fontWeight:700, fontSize:12, padding:'6px 10px', borderBottom:'1px solid #000' }}>RBT Shadowed:</div>
        <div style={{ padding:'8px 10px' }}>
          <div style={{ background: form.respondingProvider ? '#e8e8e8' : '#c0392b', color: form.respondingProvider ? '#333' : '#fff', borderRadius:4, padding:'6px 12px', fontSize:13, fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            ⚠ <input value={form.respondingProvider||''} onChange={e=>setForm(p=>({...p,respondingProvider:e.target.value}))} placeholder="Name of RBT you shadowed" style={{ background:'transparent', border:'none', color: form.respondingProvider ? '#333' : '#fff', fontSize:13, fontWeight:600, flex:1, outline:'none', '--placeholder-color': form.respondingProvider ? '#999' : 'rgba(255,255,255,0.7)' }} className="rbt-name-input"/>
            ✏
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <Checkbox label="This is the first session with the client:" checked={form.firstSession||false} onChange={c=>setForm(p=>({...p,firstSession:c}))}/>
            <select value={form.firstSessionDD||''} onChange={e=>setForm(p=>({...p,firstSessionDD:e.target.value}))} style={{ border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', fontSize:12 }}>
              <option value="">Drop Down</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Were you supervised at any point during this session?</span>
            <select value={form.supervised||''} onChange={e=>setForm(p=>({...p,supervised:e.target.value}))}
              style={{ border:'1px solid var(--border)', borderRadius:4, padding:'3px 10px', fontSize:12, background:'var(--white)' }}>
              <option value="">Select One</option>
              <option>Yes</option>
              <option>No, I need additional training on:</option>
              <option>N/A, session was not supervised</option>
            </select>
            {form.supervised && <span style={{ fontSize:12, color:'var(--soft)' }}>{form.supervised.startsWith('Yes') ? 'If yes, add the information below.' : 'If no, skip this section.'}</span>}
          </div>
        </div>
      </div>

      {/* Goals notes feedback */}
      <div style={{ border:'2px solid var(--red)', borderRadius:4, padding:10, marginBottom:12 }}>
        <div style={{ fontWeight:700, fontSize:12, color:'var(--red)', marginBottom:6 }}>RBTs or Note feedback, goals, interventions listed on, etc: *</div>
        <textarea rows={3} value={form.goalsFeedback||''} onChange={e=>setForm(p=>({...p,goalsFeedback:e.target.value}))}
          placeholder="Required" style={{...inp, border:'1px solid var(--red)', resize:'vertical'}}/>
      </div>

      {/* Skills training */}
      <div style={{ border:'1px solid var(--border)', borderRadius:4, padding:10, marginBottom:12 }}>
        <label style={lbl}>When training needs, elaborate: (optional)</label>
        <textarea rows={2} value={form.trainingNotes||''} onChange={e=>setForm(p=>({...p,trainingNotes:e.target.value}))} style={{...inp, resize:'vertical'}}/>
      </div>

      {/* Session preparation */}
      <div style={{ border:'1px solid #000', padding:10, marginBottom:12 }}>
        <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>Session Preparation</div>
        <MultiCheck options={['Review of patient programming, goals, and intervention information','Review of session materials or environment','Gathering materials: reinforcement, visuals, etc.','Review of session minutes or progress information (BIPs, session plans, protocols, etc.)','Pairing inter-session/social control procedures','Creating list for treatment modifications, new goals, or updates','Documented back over and passage of materials','Adjusting the environment']} values={form.sessionPrep||[]} onChange={v=>setForm(p=>({...p,sessionPrep:v}))}/>
      </div>

      {/* Behaviors observed */}
      <div style={{ border:'1px solid #000', padding:10, marginBottom:12 }}>
        <div style={{ fontWeight:700, fontSize:12, marginBottom:8 }}>Behaviors Observed / Targeted for Today's Session</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>
              <th style={{ border:'1px solid #000', padding:'6px 10px', textAlign:'center', fontSize:12, width:'50%' }}>
                <div style={{fontWeight:700}}>Social Communication Deficits Observed / Targeted</div>
                <div style={{fontWeight:400,fontStyle:'italic',fontSize:11}}>(choose at least one)</div>
              </th>
              <th style={{ border:'1px solid #000', padding:'6px 10px', textAlign:'center', fontSize:12, width:'50%' }}>
                <div style={{fontWeight:700}}>Restricted and Repetitive Behaviors Observed / Targeted</div>
                <div style={{fontWeight:400,fontStyle:'italic',fontSize:11}}>(choose at least one)</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length:Math.max(SOCIAL_BXS.length,RESTRICTED_BXS.length)},(_,i)=>(
              <tr key={i}>
                <td style={{ border:'1px solid #000', padding:'7px 10px' }}>
                  {SOCIAL_BXS[i] && <Checkbox label={SOCIAL_BXS[i]} checked={(form.socialBxs||[]).includes(SOCIAL_BXS[i])} onChange={c=>setForm(p=>({...p,socialBxs:c?[...(p.socialBxs||[]),SOCIAL_BXS[i]]:(p.socialBxs||[]).filter(v=>v!==SOCIAL_BXS[i])}))}/>}
                </td>
                <td style={{ border:'1px solid #000', padding:'7px 10px' }}>
                  {RESTRICTED_BXS[i] && <Checkbox label={RESTRICTED_BXS[i]} checked={(form.restrictedBxs||[]).includes(RESTRICTED_BXS[i])} onChange={c=>setForm(p=>({...p,restrictedBxs:c?[...(p.restrictedBxs||[]),RESTRICTED_BXS[i]]:(p.restrictedBxs||[]).filter(v=>v!==RESTRICTED_BXS[i])}))}/>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page 2: Variables/Antecedents/Generalization/Reinforcement ──
function Page2({ form, setForm }) {
  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'20px 0' }}>
      <SectionBlock title="Variables Affecting Service Delivery" subtitle="Check the box for each variable that impacted ability to deliver ABA treatment. At least one box should be checked.">
        <MultiCheck options={VARIABLES} values={form.variables||[]} onChange={v=>setForm(p=>({...p,variables:v}))}/>
      </SectionBlock>
      <SectionBlock title="Antecedent Interventions" subtitle="Check the box for each antecedent intervention employed in session. At least one box must be checked.">
        <MultiCheck options={ANTECEDENT_INTERVENTIONS} values={form.antecedentInterventions||[]} onChange={v=>setForm(p=>({...p,antecedentInterventions:v}))}/>
      </SectionBlock>
      <SectionBlock title="Generalization and Maintenance Strategies" subtitle="Check the box for each strategy employed in session to encourage generalization or maintenance. At least one box must be checked.">
        <MultiCheck options={GENERALIZATION} values={form.generalization||[]} onChange={v=>setForm(p=>({...p,generalization:v}))}/>
      </SectionBlock>
      <SectionBlock title="Reinforcement" subtitle="Check the box for each reinforcement strategy employed in session. At least one box must be checked.">
        <MultiCheck options={REINFORCEMENT} values={form.reinforcement||[]} onChange={v=>setForm(p=>({...p,reinforcement:v}))}/>
      </SectionBlock>
    </div>
  )
}

function SectionBlock({ title, subtitle, children }) {
  return (
    <div style={{ border:'1px solid #000', padding:12, marginBottom:14, borderRadius:2 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{title}</div>
      {subtitle && <div style={{ fontSize:11, color:'var(--soft)', marginBottom:10 }}>{subtitle}</div>}
      {children}
    </div>
  )
}

// ── Page 3: Session content, narrative, signature ──
function Page3({ form, setForm, sessionData, sessionMeta }) {
  const [showDataPopup, setShowDataPopup] = useState(false)
  const [dataSelected, setDataSelected] = useState(false)
  const goals = sessionData.goals?.filter(g=>g.name&&g.trials?.length>0).map(g=>g.name) || []

  const dataRows = [
    ...( sessionData.goals?.filter(g=>g.name&&g.trials?.length>0).map(g=>({
      name: g.name, value: (g.trials.filter(t=>t.result==='correct').length/g.trials.length*100).toFixed(2)+'%', type:'Percent Correct', phase:g.phase
    })) || [] ),
    ...( sessionData.frequencyBehavior?.name ? [{ name:sessionData.frequencyBehavior.name, value:sessionData.frequencyBehavior.count+'.00', type:'Frequency', phase:'Baseline' }] : [] ),
    ...( sessionData.durationBehavior?.name&&sessionData.durationBehavior.entries?.length ? [{ name:sessionData.durationBehavior.name, value:sessionData.durationBehavior.entries.reduce((a,b)=>a+b,0).toFixed(2)+'s', type:'Duration', phase:'Baseline' }] : [] ),
    ...( sessionData.intervalSessions?.map(s=>({ name:s.behavior, value:(s.occurred/s.total*100).toFixed(2)+'%', type:'Interval ('+s.method+')', phase:'Baseline' })) || [] ),
  ]

  const malPresent = form.malPresent === 'Maladaptive behaviors occurred during session. See details below.'

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'20px 0' }}>
      {/* Session content & data */}
      <div style={{ border:'2px solid var(--red)', borderRadius:4, padding:12, marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, color:'var(--red)', marginBottom:8 }}>Session Content and Data <span style={{ fontSize:11, fontWeight:400 }}>Add the session summary information below. This must be inputted.</span></div>
        <button onClick={()=>setShowDataPopup(true)}
          style={{ background:dataSelected?'var(--blue-dim)':'var(--white)', border:'1px solid var(--border)', borderRadius:4, padding:'6px 12px', fontSize:12, fontWeight:600, marginBottom:12 }}>
          {dataSelected ? '✓ Shadow Session #2 selected' : 'Select Session Summary ▾'}
        </button>

        {dataSelected && dataRows.length > 0 && (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:12 }}>
            <thead>
              <tr style={{ background:'var(--bg)' }}>
                {['Branch Name','Current Data Point','Data Type','Current Phase'].map(h=>(
                  <th key={h} style={{ border:'1px solid var(--border)', padding:'6px 8px', textAlign:'left', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>{row.name}</td>
                  <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>{row.value}</td>
                  <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>{row.type}</td>
                  <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>{row.phase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>Is data displayed above? </span>
          <span style={{ display:'inline-block', position:'relative' }}>
            <select value={form.dataDisplayed||''} onChange={e=>setForm(p=>({...p,dataDisplayed:e.target.value}))}
              style={{ background:'var(--red)', color:'#fff', border:'none', borderRadius:4, padding:'2px 8px', fontSize:12, fontWeight:600 }}>
              <option value="">Select...</option>
              <option>Yes</option>
              <option>Technical Issue, BCBA has been notified.</option>
            </select>
          </span>
        </div>
      </div>

      {/* Maladaptive behaviors */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:'var(--red)' }}>Maladaptive Behavior Information</div>
        <div style={{ marginBottom:10 }}>
          <span style={{ fontSize:13 }}>Did maladaptive behaviors occur during session? </span>
          <select value={form.malPresent||''} onChange={e=>setForm(p=>({...p,malPresent:e.target.value}))}
            style={{ background:'var(--red)', color:'#fff', border:'none', borderRadius:4, padding:'2px 8px', fontSize:12, fontWeight:600 }}>
            <option value="">Select...</option>
            <option>Maladaptive behaviors occurred during session. See details below.</option>
            <option>No maladaptive behaviors occurred during session.</option>
          </select>
        </div>

        {malPresent && (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, marginBottom:8 }}>
            <thead>
              <tr style={{ background:'var(--bg)' }}>
                {['Antecedent','Primary Mal Bx','Consequence Intervention','Replacement Bx Taught'].map(h=>(
                  <th key={h} style={{ border:'1px solid var(--border)', padding:'6px 8px', textAlign:'left', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0,1,2].map(i=>(
                <tr key={i}>
                  <td style={{ border:'1px solid var(--border)', padding:6 }}>
                    <select value={form[`mal_ant_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_ant_${i}`]:e.target.value}))} style={{ width:'100%', fontSize:11, border:'1px solid var(--border)', borderRadius:3 }}>
                      <option value="">antecedent</option>
                      {ANTECEDENTS_MAL.map(o=><option key={o}>{o}</option>)}
                    </select>
                    <input placeholder="if other, explain" value={form[`mal_ant_other_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_ant_other_${i}`]:e.target.value}))} style={{ width:'100%', marginTop:4, fontSize:11, border:'1px solid var(--border)', borderRadius:3, padding:'2px 4px' }}/>
                  </td>
                  <td style={{ border:'1px solid var(--border)', padding:6 }}>
                    <input placeholder="Which Mal Bx occurred? (write in)" value={form[`mal_bx_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_bx_${i}`]:e.target.value}))} style={{ width:'100%', fontSize:11, border:'1px solid var(--border)', borderRadius:3, padding:'2px 4px' }}/>
                  </td>
                  <td style={{ border:'1px solid var(--border)', padding:6 }}>
                    <select value={form[`mal_con_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_con_${i}`]:e.target.value}))} style={{ width:'100%', fontSize:11, border:'1px solid var(--border)', borderRadius:3 }}>
                      <option value="">consequence intervention</option>
                      {CONSEQUENCE_MAL.map(o=><option key={o}>{o}</option>)}
                    </select>
                    <input placeholder="if other, explain" value={form[`mal_con_other_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_con_other_${i}`]:e.target.value}))} style={{ width:'100%', marginTop:4, fontSize:11, border:'1px solid var(--border)', borderRadius:3, padding:'2px 4px' }}/>
                  </td>
                  <td style={{ border:'1px solid var(--border)', padding:6 }}>
                    <select value={form[`mal_rep_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_rep_${i}`]:e.target.value}))} style={{ width:'100%', fontSize:11, border:'1px solid var(--border)', borderRadius:3 }}>
                      <option value="">replacement bx</option>
                      {REPLACEMENT_BX.map(o=><option key={o}>{o}</option>)}
                    </select>
                    <input placeholder="if other, explain" value={form[`mal_rep_other_${i}`]||''} onChange={e=>setForm(p=>({...p,[`mal_rep_other_${i}`]:e.target.value}))} style={{ width:'100%', marginTop:4, fontSize:11, border:'1px solid var(--border)', borderRadius:3, padding:'2px 4px' }}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {malPresent && (
          <div><label style={lbl}>Additional Notes Concerning Maladaptive Behaviors (optional):</label><input value={form.malNotes||''} onChange={e=>setForm(p=>({...p,malNotes:e.target.value}))} style={inp}/></div>
        )}
      </div>

      {/* Session Narrative */}
      <div style={{ border:'1px solid #000', padding:12, marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Session Narrative</div>
        <div style={{ fontSize:13, lineHeight:2.2 }}>
          At the start of session, {CLIENT.name} was <RedDropdown label="Mood/Affect" options={MOOD_OPTIONS} value={form.mood} onChange={v=>setForm(p=>({...p,mood:v}))}/>. Response to participants was <RedDropdown label="Response to Participants" options={RESPONSE_TO_PARTICIPANTS} value={form.responseParticipants} onChange={v=>setForm(p=>({...p,responseParticipants:v}))}/>. {CLIENT.name} demonstrated <RedDropdown label="Level of participation" options={LEVEL_OF_PARTICIPATION} value={form.levelParticipation} onChange={v=>setForm(p=>({...p,levelParticipation:v}))}/> and engaged in <RedDropdown label="What type of interactions occurred?" options={INTERACTION_TYPES} value={form.interactionType} onChange={v=>setForm(p=>({...p,interactionType:v}))}/> interactions for most of session. {CLIENT.name} was given choices and autonomy regarding <RedDropdown label="Choices regarding ___ were given" options={CHOICES_OPTIONS} value={form.choices} onChange={v=>setForm(p=>({...p,choices:v}))}/>.
          {' '}Focus of session was on increasing <RedDropdown label="We focused on ___ skills" options={SKILL_FOCUS} value={form.skillFocus} onChange={v=>setForm(p=>({...p,skillFocus:v}))}/>  skills. Target behaviors used to build this skill domain included <GoalSelector goals={goals.length?goals:['Goal 1','Goal 2','Goal 3']} value={form.selectedGoals} onChange={v=>setForm(p=>({...p,selectedGoals:v}))}/>. {form.selectedGoals?.length>0 && <span style={{fontStyle:"italic"}}>{form.selectedGoals.join(", ")}</span>}. This skill was taught using a primary intervention of <RedDropdown label="intervention" options={INTERVENTIONS} value={form.intervention} onChange={v=>setForm(p=>({...p,intervention:v}))}/>  and utilizing <RedDropdown label="prompting" options={PROMPTING} value={form.prompting} onChange={v=>setForm(p=>({...p,prompting:v}))}/>.  In response to the interventions, {CLIENT.name} <RedDropdown label="response" options={RESPONSE_OPTIONS} value={form.response} onChange={v=>setForm(p=>({...p,response:v}))}/>.
          {' '}Overall, BT noted <RedDropdown label="Progress in response to specific intervention" options={PROGRESS_OPTIONS} value={form.progress} onChange={v=>setForm(p=>({...p,progress:v}))}/>, as demonstrated by the data and {CLIENT.name}'s response to participants and interventions. Observations of {CLIENT.name}'s symptoms and behaviors confirmed that impairments significantly impact the client's daily functioning and quality of life. These findings underscore the ongoing necessity of ABA therapy to manage these symptoms and enhance the client's overall functioning. Interventions were tailored to {CLIENT.name}'s needs and responses observed indicate a dynamic therapeutic process. Responses to therapy and interventions further substantiate the need for specialized ABA treatment, aiming to alleviate social communication and interaction symptoms such as <RedDropdown label="symptom in patient" options={SOCIAL_SYMPTOMS} value={form.symptom1} onChange={v=>setForm(p=>({...p,symptom1:v}))}/> and restricted and repetitive behavior symptoms such as <RedDropdown label="symptom in patient" options={RESTRICTED_SYMPTOMS} value={form.symptom2} onChange={v=>setForm(p=>({...p,symptom2:v}))}/>. {CLIENT.name}'s progress on specific goals indicates <RedDropdown label="Indicators" options={INDICATORS} value={form.indicators} onChange={v=>setForm(p=>({...p,indicators:v}))}/>. If progress is not observed as anticipated, it implies {CLIENT.name} may require more intensive or sustained treatment to achieve the desired outcomes.
        </div>
      </div>

      {/* Additional notes */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Additional Relevant Details/Notes for Supervisor:</div>
        <textarea rows={3} value={form.additionalNotes||''} onChange={e=>setForm(p=>({...p,additionalNotes:e.target.value}))}
          placeholder="Note any information to convey to supervisor (e.g., new symptoms or behaviors, response to interventions, etc.) or any parent concerns or communication; also note any safety or medical concerns"
          style={{...inp, resize:'vertical', width:'100%'}}/>
      </div>

      {/* Signature */}
      <div style={{ border:'1px solid var(--border)', borderRadius:6, padding:12, marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Provider Signature:</div>
        <SignaturePad value={form.signature||''} onChange={v=>setForm(p=>({...p,signature:v}))}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
          <input value={form.providerName||''} onChange={e=>setForm(p=>({...p,providerName:e.target.value}))} placeholder="Provider Full Name" style={inp}/>
          <input value={form.providerCreds||''} onChange={e=>setForm(p=>({...p,providerCreds:e.target.value}))} placeholder="Provider Credentials" style={inp}/>
        </div>
      </div>
      <div style={{ border:'1px solid var(--border)', borderRadius:6, padding:12, marginBottom:80 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Tech shadowed email:</div>
        <div style={{ fontSize:12, color:'var(--soft)', marginBottom:8 }}>Enter the email of the technician you shadowed — the completed note will be sent to them.</div>
        <input type="email" value={form.techShadowedEmail||''} onChange={e=>setForm(p=>({...p,techShadowedEmail:e.target.value}))}
          placeholder="tech@magnetaba.com"
          style={{ width:'100%', padding:'10px 12px', fontSize:14, border:'1px solid var(--border)', borderRadius:6 }}/>
      </div>

      {/* Session data popup */}
      {showDataPopup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'var(--white)', borderRadius:10, padding:24, width:440 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>Select Sessions To Include Their Summaries In The Note</div>
              <button onClick={()=>setShowDataPopup(false)} style={{ border:'none', background:'transparent', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom:12 }}>
              <input type="date" value={sessionMeta.sessionDate} readOnly style={{ border:'1px solid var(--border)', borderRadius:4, padding:'6px 8px', fontSize:13 }}/>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:16 }}>
              <thead><tr style={{ borderBottom:'2px solid var(--border)' }}>
                <th style={{ padding:'6px 8px', textAlign:'left' }}/>
                <th style={{ padding:'6px 8px', textAlign:'left' }}>Session name</th>
                <th style={{ padding:'6px 8px', textAlign:'left' }}>Started</th>
                <th style={{ padding:'6px 8px', textAlign:'left' }}>Ended</th>
                <th style={{ padding:'6px 8px', textAlign:'left' }}>Duration</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={{ padding:'8px' }}><input type="checkbox" checked={dataSelected} onChange={e=>setDataSelected(e.target.checked)}/></td>
                  <td style={{ padding:'8px' }}>Shadow Session #2</td>
                  <td style={{ padding:'8px' }}>{sessionMeta.sessionDate}</td>
                  <td style={{ padding:'8px' }}>{sessionMeta.sessionDate}</td>
                  <td style={{ padding:'8px' }}>{sessionMeta.sessionStart} - {sessionMeta.sessionEnd}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <button onClick={()=>setShowDataPopup(false)} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'8px 16px', fontSize:13 }}>Cancel</button>
              <button onClick={()=>{ setShowDataPopup(false); setDataSelected(true) }} style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'8px 20px', fontWeight:700, fontSize:13 }}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const tdS = { border:'1px solid #000', padding:'5px 8px', fontSize:12 }
const lbl = { fontSize:12, fontWeight:600, color:'var(--soft)', display:'block', marginBottom:3 }
const inp = { width:'100%', padding:'6px 8px', fontSize:13, border:'1px solid var(--border)', borderRadius:4 }

// ── Billing Page ──
function BillingPage({ onDone, onEditNote, sessionMeta }) {
  const [submitted, setSubmitted] = useState(false)

  if(submitted) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16 }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:700 }}>Submitted!</div>
      <div style={{ fontSize:14, color:'var(--soft)', textAlign:'center', maxWidth:320 }}>Your shadow session note and billing timesheet have been submitted.</div>
    </div>
  )

  return (
    <div style={{ display:'grid', gridTemplateRows:'48px 1fr', height:'100vh', overflow:'hidden' }}>
      <div style={{ background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
        <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}><span style={{ color:'#6ea8e8' }}>Magnet</span> ABA</div>
        <div style={{ color:'#cfe0f5', fontSize:12 }}>Billing — Edit Timesheet</div>
        <div/>
      </div>
      <div style={{ overflowY:'auto', background:'var(--bg)', padding:'0 0 40px' }}>
        {/* CR billing header */}
        <div style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'8px 20px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)' }}>Edit Timesheet</div>
          <div style={{ fontSize:12, color:'var(--soft)' }}>#{Math.floor(Math.random()*90000+10000)}-{Math.floor(Math.random()*90000+10000)}-{Math.floor(Math.random()*90000+10000)}</div>
        </div>
        <div style={{ padding:'20px', maxWidth:900, margin:'0 auto' }}>
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:8, padding:20, marginBottom:16 }}>
            {[
              ['Provider', 'Mikayla Ebner'],
              ['Place of Service', '12 - Home'],
              ['Authorization', 'BC Blue Cross Blue Shield ✏'],
              ['Modifier', ''],
              ['From Date', sessionMeta?.sessionDate || ''],
              ['To Date', sessionMeta?.sessionDate || ''],
              ['Procedure', '97153 ▾', ''],
              ['Time from', sessionMeta?.sessionStart || '', 'Time to', sessionMeta?.sessionEnd || ''],
              ['Diagnosis', 'F84.0 - Autism'],
              ['Service Units', ''],
              ['Provider Pay', ''],
              ['Admin Notes', ''],
            ].map(([label, val, label2, val2], i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns: label2 ? '120px 1fr 120px 1fr' : '120px 1fr', gap:8, marginBottom:10, alignItems:'center' }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--soft)', textAlign:'right', paddingRight:8 }}>{label}</label>
                <input value={val||''} readOnly style={{ padding:'6px 10px', fontSize:13, border:'1px solid var(--border)', borderRadius:4, background:val?'var(--white)':'var(--bg)' }}/>
                {label2 && <label style={{ fontSize:12, fontWeight:600, color:'var(--soft)', textAlign:'right', paddingRight:8 }}>{label2}</label>}
                {val2 !== undefined && <input value={val2||''} readOnly style={{ padding:'6px 10px', fontSize:13, border:'1px solid var(--border)', borderRadius:4, background:val2?'var(--white)':'var(--bg)' }}/>}
              </div>
            ))}
          </div>

          {/* Files / Notes / Signatures row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:8, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', marginBottom:10 }}>Files</div>
              <button style={{ width:'100%', background:'transparent', border:'1px solid var(--teal)', color:'var(--teal)', borderRadius:4, padding:'8px', fontSize:12, fontWeight:700 }}>ATTACH FILE(S)</button>
            </div>
            <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:8, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', marginBottom:4 }}>(97153) DIRECT SERV (2/3)</div>
              <div style={{ fontSize:10, color:'var(--faint)', marginBottom:8 }}>At least one required</div>
              <button onClick={onEditNote} style={{ width:'100%', background:'var(--blue)', color:'#fff', border:'none', borderRadius:4, padding:'8px', fontSize:12, fontWeight:700, marginBottom:6, cursor:'pointer' }}>NEW NOTE ✓</button>
              <button style={{ width:'100%', background:'transparent', border:'1px solid var(--border)', borderRadius:4, padding:'6px', fontSize:12 }}>SELECT EXISTING NOTE</button>
            </div>
            <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:8, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', marginBottom:10 }}>Signatures</div>
              <button style={{ width:'100%', background:'transparent', border:'1px dashed var(--teal)', color:'var(--teal)', borderRadius:4, padding:'8px', fontSize:12, fontWeight:700, marginBottom:6 }}>CLIENT SIGNATURE</button>
              <button style={{ width:'100%', background:'transparent', border:'1px dashed var(--teal)', color:'var(--teal)', borderRadius:4, padding:'8px', fontSize:12, fontWeight:700 }}>PROVIDER SIGNATURE</button>
            </div>
          </div>

          {/* Cancel / Submit */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button style={{ background:'transparent', border:'none', fontSize:13, color:'var(--soft)', cursor:'pointer' }}>CANCEL</button>
            <button onClick={()=>setSubmitted(true)}
              style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'10px 32px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              SUBMIT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main SessionNote wrapper ──
export default function SessionNote({ sessionData, quizResults, sessionMeta, onDone }) {
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({})
  const [sending, setSending] = useState(false)
  const [view, setView] = useState('note') // note | billing | done
  const goals = sessionData.goals?.map(g=>g.name).filter(Boolean) || []

  async function handleSubmit() {
    setSending(true)
    try {
      // flatten quizResults array into individual fields
      const quizFlat = {}
      ;(quizResults||[]).forEach((q,i) => {
        quizFlat[`quiz${i+1}Name`] = q.name || ''
        quizFlat[`quiz${i+1}DataType`] = q.dataType || ''
        quizFlat[`quiz${i+1}Correct`] = q.selectedCorrectGraph === true ? 'Yes' : q.selectedCorrectGraph === false ? 'No' : 'Not answered'
      })

      // flatten multi-select arrays into comma-separated lists
      function toList(arr) {
        if(!arr||!arr.length) return ''
        return arr.join(', ')
      }

      const noteFlat = {
        ...form,
        // multi-selects as numbered lists
        present: toList(form.present),
        sessionPrep: toList(form.sessionPrep),
        socialBxs: toList(form.socialBxs),
        restrictedBxs: toList(form.restrictedBxs),
        variables: toList(form.variables),
        antecedentInterventions: toList(form.antecedentInterventions),
        generalization: toList(form.generalization),
        reinforcement: toList(form.reinforcement),
        selectedGoals: toList(form.selectedGoals),
      }

      await sendToWebhook({
        type: 'shadow_session_complete',
        techShadowedEmail: form.techShadowedEmail || '',
        submittedAt: new Date().toISOString(),
        sessionMeta,
        sessionData,
        quizResults,
        ...quizFlat,
        noteForm: noteFlat,
      })
      setView('billing')
    } catch(err) {
      alert('Submit error: ' + err.message)
    } finally { setSending(false) }
  }

  if(view === 'billing') return <BillingPage onDone={()=>setView('done')} onEditNote={()=>setView('note')} sessionMeta={sessionMeta}/>
  if(view === 'done') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16 }}>
      <div style={{ fontSize:48 }}>✅</div>
      <div style={{ fontSize:22, fontWeight:700 }}>Session complete!</div>
      <div style={{ fontSize:14, color:'var(--soft)' }}>The note and session data have been emailed to the tech you shadowed.</div>
    </div>
  )

  const titles = { 1:'Client Information & Session Details', 2:'Variables, Interventions & Reinforcement', 3:'Session Content, Narrative & Signature' }

  return (
    <div style={{ display:'grid', gridTemplateRows:'48px 1fr 52px', height:'100vh', overflow:'hidden' }}>
      {/* Nav */}
      <div style={{ background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
        <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}><span style={{ color:'#6ea8e8' }}>Magnet</span> ABA</div>
        <div style={{ color:'#cfe0f5', fontSize:12 }}>Step 4 of 4 — Session Note (Section {page}/3)</div>
        <div style={{ display:'flex', gap:8 }}>
          {page > 1 && <button onClick={()=>setPage(p=>p-1)} style={{ background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, padding:'6px 14px', fontSize:13, fontWeight:600 }}>← Previous</button>}
          {page < 3 && <button onClick={()=>setPage(p=>p+1)} style={{ background:'var(--blue)', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:13, fontWeight:700 }}>Next →</button>}
        </div>
      </div>

      {/* Section label + content */}
      <div style={{ overflowY:'auto' }}>
        <div style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', padding:'10px 20px', textAlign:'center' }}>
          <div style={{ fontSize:11, color:'var(--faint)' }}>Currently Editing Section:</div>
          <div style={{ fontSize:16, fontWeight:700 }}>{titles[page]}</div>
        </div>
        <div style={{ padding:'0 20px 40px' }}>
          {page===1 && <Page1 form={form} setForm={setForm} sessionMeta={sessionMeta} goals={goals}/>}
          {page===2 && <Page2 form={form} setForm={setForm}/>}
          {page===3 && <Page3 form={form} setForm={setForm} sessionData={sessionData} sessionMeta={sessionMeta}/>}
        </div>
      </div>

      {/* Bottom bar — CR style Save & Close */}
      <div style={{ background:'var(--white)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} style={{ background:'transparent', border:'none', color:'var(--teal)', fontSize:13, fontWeight:700, cursor:'pointer' }}>CLOSE</button>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ background:'transparent', border:'none', color:'var(--soft)', fontSize:13, fontWeight:600, cursor:'pointer' }}>SAVE</button>
          <button onClick={handleSubmit} disabled={sending || page < 3}
            style={{ background: page < 3 ? '#aac4e8' : 'var(--blue)', color:'#fff', border:'none', borderRadius:4, padding:'8px 20px', fontSize:13, fontWeight:700, cursor: page < 3 ? 'not-allowed' : 'pointer' }}
            title={page < 3 ? 'Complete all sections before saving' : ''}>
            {sending ? 'Saving…' : 'SAVE & CLOSE'}
          </button>
        </div>
      </div>
    </div>
  )
}
