import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider } from './index'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.model = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001'
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      throw new Error('AI response was truncated (max_tokens reached)')
    }

    const textBlocks = message.content.filter((b) => b.type === 'text')
    if (textBlocks.length === 0) {
      throw new Error('AI returned no text content')
    }

    return textBlocks.map((b) => (b as Anthropic.TextBlock).text).join('')
  }
}
