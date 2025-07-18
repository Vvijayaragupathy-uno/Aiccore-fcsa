console.log('Starting JSON extraction test...')

const testText = `To provide analysis...

\`\`\`json
{"test": "value", "number": 123}
\`\`\`

End of response.`

const jsonMatch = testText.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/)
console.log('Match found:', !!jsonMatch)
if (jsonMatch) {
  console.log('Extracted:', jsonMatch[1])
  try {
    const parsed = JSON.parse(jsonMatch[1])
    console.log('Parsed successfully:', parsed)
  } catch (e) {
    console.log('Parse error:', e.message)
  }
}