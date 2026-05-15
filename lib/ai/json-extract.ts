export class AIParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string
  ) {
    super(message)
    this.name = 'AIParseError'
  }
}

// Finds the closing } for the { at str[start], correctly skipping over
// JSON string literals (including escaped characters like \") so a value
// such as "Use } to close" does not prematurely terminate the search.
// Business AI outputs are always objects, so only {} is tracked.
function findBalancedBrace(str: string, start: number): number {
  let depth = 0
  let inString = false
  let i = start

  while (i < str.length) {
    const ch = str[i]

    if (inString) {
      if (ch === '\\') {
        i += 2 // skip the escaped character
        continue
      }
      if (ch === '"') inString = false
    } else {
      if (ch === '"') {
        inString = true
      } else if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
        if (depth === 0) return i
      }
    }

    i++
  }

  return -1
}

export function extractJSON<T = unknown>(raw: string): T {
  const trimmed = raw.trim()

  // 1. Try direct parse first (ideal case)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as T
    } catch {
      // fall through
    }
  }

  // 2. Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T
    } catch {
      // fall through
    }
  }

  // 3. Find the first balanced {...} block using bracket counting
  const braceStart = trimmed.indexOf('{')
  if (braceStart !== -1) {
    const braceEnd = findBalancedBrace(trimmed, braceStart)
    if (braceEnd !== -1) {
      try {
        return JSON.parse(trimmed.slice(braceStart, braceEnd + 1)) as T
      } catch {
        // fall through
      }
    }
  }

  throw new AIParseError('Could not extract valid JSON from AI response', raw)
}
