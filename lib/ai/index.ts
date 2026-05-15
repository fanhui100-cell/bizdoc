export interface AIProvider {
  generate(systemPrompt: string, userPrompt: string): Promise<string>
}

export { AnthropicProvider } from './anthropic'
export { extractJSON } from './json-extract'
export { buildPrompt } from './prompts'
