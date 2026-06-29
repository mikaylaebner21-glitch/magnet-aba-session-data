import { useState } from 'react'

const ANTECEDENTS = [
  'Attention presented',
  'Attention removed',
  'Stimulus added',
  'Stimulus removed/altered',
  'Demand presented',
  'Demand/activity removed',
  'Transition',
  'Denied access to item/activity',
  'Alone/unoccupied',
  'Other',
]

const CONSEQUENCES = [
  'Positive attention',
  'Negative attention',
  'Redirection',
  'Stimulus added',
  'Demand/activity removed',
  'Access to item/activity',
  'Ignored/no response',
  'Other',
]

const WHO_PRESENT = ['Mom', 'Dad', 'Sibling', 'Teacher', 'Other caregiver', 'RBT only', 'Peers']

const LOCATIONS = ['Home', 'Community', 'Bathroom', 'Kitchen', 'Clinic', 'School', 'Vehicle']

function MultiList({ label, options, selected, onToggle }) {
  return (
    <div className="abc-col">
      <label>{label}</label>
      <div className="abc-list">
        {options.map((opt) => (
          <div
            key={opt}
            className={'abc-list-item' + (selected.includes(opt) ? ' selected' : '')}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AbcModal({ onClose, onSubmit }) {
  const [antecedent, setAntecedent] = useState([])
  const [consequence, setConsequence] = useState([])
  const [whoPresent, setWhoPresent] = useState([])
  const [location, setLocation] = useState([])
  const [behavior, setBehavior] = useState('')

  function toggle(list, setList, val) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val])
  }

  function handleSubmit() {
    onSubmit({
      antecedent,
      behavior: behavior.trim(),
      consequence,
      whoPresent,
      location,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">ABC data</div>
        <div className="modal-body">
          <div className="abc-columns">
            <MultiList
              label="Antecedent"
              options={ANTECEDENTS}
              selected={antecedent}
              onToggle={(v) => toggle(antecedent, setAntecedent, v)}
            />
            <div className="abc-col">
              <label>
                Behavior <span className="opt-tag">(optional, write in)</span>
              </label>
              <div className="abc-behavior-field">
                <textarea
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                  placeholder="Describe what happened..."
                />
              </div>
            </div>
            <MultiList
              label="Consequence"
              options={CONSEQUENCES}
              selected={consequence}
              onToggle={(v) => toggle(consequence, setConsequence, v)}
            />
            <MultiList
              label="Who was present"
              options={WHO_PRESENT}
              selected={whoPresent}
              onToggle={(v) => toggle(whoPresent, setWhoPresent, v)}
            />
          </div>
          <MultiList
            label="Location"
            options={LOCATIONS}
            selected={location}
            onToggle={(v) => toggle(location, setLocation, v)}
          />
          <div className="modal-footer" style={{ marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
