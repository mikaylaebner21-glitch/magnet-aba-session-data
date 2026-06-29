// Determines correct graph type for each data type
// Returns {type: 'line'|'bar', label: string, rationale: string}

export function getCorrectGraph(dataType) {
  switch(dataType) {
    case 'goal':
      return { type: 'line', label: 'Line graph', rationale: '% correct across trials — shows trend over time' }
    case 'frequency':
      return { type: 'bar', label: 'Bar graph', rationale: 'Frequency count — discrete events per session' }
    case 'duration':
      return { type: 'line', label: 'Line graph', rationale: 'Duration per occurrence — shows trend across occurrences' }
    case 'interval':
      return { type: 'line', label: 'Line graph', rationale: '% intervals — shows trend across sessions' }
    default:
      return { type: 'line', label: 'Line graph', rationale: '' }
  }
}

export function generateWrongGraph(correctType) {
  return correctType === 'line' ? 'bar' : 'line'
}
