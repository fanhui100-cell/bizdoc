'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { OutputCard } from '@/components/tools/output-card'
import type { EmailOutput } from '@/lib/types'

const EMAIL_TYPES_ZH = ['报价邮件', '催款邮件', '客户跟进', '项目交付', '道歉邮件', '合作邀约', '客户确认']
const EMAIL_TYPES_EN = ['Quote Email', 'Payment Reminder', 'Follow Up', 'Project Delivery', 'Apology', 'Partnership Inquiry', 'Client Confirmation']
const EMAIL_TYPE_VALUES = ['quote', 'payment_reminder', 'follow_up', 'delivery', 'apology', 'cooperation', 'confirmation']

export default function EmailPage() {
  const params = useParams()
  const locale = (params.locale as string) ?? 'zh'
  const router = useRouter()
  const zh = locale === 'zh'

  const [outputLang, setOutputLang] = useState<'zh' | 'en'>(zh ? 'zh' : 'en')
  const [emailTypeIdx, setEmailTypeIdx] = useState(0)
  const [recipientName, setRecipientName] = useState('')
  const [senderRole, setSenderRole] = useState('')
  const [purpose, setPurpose] = useState('')
  const [keyMessage, setKeyMessage] = useState('')
  const [tone, setTone] = useState<'formal' | 'friendly' | 'concise'>('formal')

  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<EmailOutput | null>(null)
  const [genId, setGenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOutput(null)

    const input = {
      emailType: EMAIL_TYPE_VALUES[emailTypeIdx],
      recipientName,
      senderRole,
      purpose,
      keyMessage,
      tone,
      outputLanguage: outputLang,
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolType: 'email', input }),
      })

      if (res.status === 401) { router.push(`/${locale}/login`); return }

      const data = await res.json()

      if (!res.ok) {
        setError(data.error === 'quota_exceeded'
          ? (zh ? '本月生成次数已用完，请升级会员继续使用' : 'Monthly quota exceeded. Please upgrade.')
          : (zh ? '生成失败，请重试' : 'Generation failed. Please try again.'))
        return
      }

      setOutput(data.output as EmailOutput)
      setGenId(data.id ?? null)
    } catch {
      setError(zh ? '网络错误，请重试' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{zh ? '商务邮件生成器' : 'Business Email Generator'}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {zh ? '选择邮件类型，输入要点，AI 生成专业邮件' : 'Choose a type, fill in the key points, and let AI draft your email.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Output language */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{zh ? '输出语言' : 'Output language'}</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['zh', 'en'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setOutputLang(l)}
                className={`px-3 py-1.5 transition-colors ${outputLang === l ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {l === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Email type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{zh ? '邮件类型' : 'Email Type'}</label>
          <div className="flex flex-wrap gap-2">
            {(zh ? EMAIL_TYPES_ZH : EMAIL_TYPES_EN).map((label, i) => (
              <button key={i} type="button" onClick={() => setEmailTypeIdx(i)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  emailTypeIdx === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '收件人称呼' : 'Recipient Name'}</label>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required
              placeholder={zh ? '如：张总、李经理' : 'e.g. Mr. Smith, the team'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '你的身份 / 公司' : 'Your Role / Company'}</label>
            <input value={senderRole} onChange={(e) => setSenderRole(e.target.value)} required
              placeholder={zh ? '如：ABC 公司销售经理' : 'e.g. Sales Manager at ABC Co.'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '邮件目的' : 'Purpose'}</label>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required
            placeholder={zh ? '这封邮件要达到什么目标？' : 'What should this email achieve?'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '主要内容要点' : 'Key Points'}</label>
          <textarea value={keyMessage} onChange={(e) => setKeyMessage(e.target.value)} required rows={3}
            placeholder={zh ? '列出邮件需要包含的关键信息' : 'List the key information to include'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{zh ? '语气风格' : 'Tone'}</label>
          <div className="flex gap-2">
            {([['formal', zh ? '正式' : 'Formal'], ['friendly', zh ? '友好' : 'Friendly'], ['concise', zh ? '简洁' : 'Concise']] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => setTone(val)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  tone === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {loading ? (zh ? 'AI 生成中，请稍候...' : 'Generating…') : (zh ? '生成邮件' : 'Generate Email')}
        </button>
      </form>

      {output && (
        <OutputCard toolType="email" output={output}
          copyLabel={zh ? '复制' : 'Copy'} copiedLabel={zh ? '已复制！' : 'Copied!'}
          pdfLabel={zh ? '导出 PDF' : 'Export PDF'} genId={genId} />
      )}
    </div>
  )
}
