import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

const CASES = [
  {
    industry: { zh: '外贸 / 跨境电商', en: 'Cross-border E-commerce' },
    name:     { zh: 'Jenny — 独立站卖家', en: 'Jenny — Independent Seller' },
    avatar:   'J',
    color:    'bg-violet-100 text-violet-700',
    tool:     'quote' as const,
    problem: {
      zh: '每次给海外买家报价都要用 Excel 手动排版，发过去的文件格式乱，显得不专业，客户回复率低。',
      en: 'Every overseas buyer quote required manual Excel formatting. The files looked messy, appeared unprofessional, and hurt reply rates.',
    },
    solution: {
      zh: '用报价单生成器，输入商品名称和单价后，30 秒生成英文格式化报价单，直接通过邮件发送 PDF 给买家。',
      en: 'Using the Quote Generator, entering product names and unit prices takes 30 seconds to produce a formatted English quote — sent directly as PDF.',
    },
    result: {
      zh: '买家回复率提升约 40%，报价周期从 30 分钟缩短到 2 分钟。',
      en: 'Buyer reply rate improved ~40%. Quote turnaround dropped from 30 minutes to 2 minutes.',
    },
    quote: {
      zh: '以前我觉得做报价单很麻烦，现在连小单我也愿意认真发一份正式报价出去。',
      en: "I used to skip formal quotes for small orders. Now I send a proper quote every time — it only takes seconds.",
    },
  },
  {
    industry: { zh: '设计 / 创意服务', en: 'Design & Creative Services' },
    name:     { zh: 'Marcus — 品牌设计师', en: 'Marcus — Brand Designer' },
    avatar:   'M',
    color:    'bg-blue-100 text-blue-700',
    tool:     'invoice' as const,
    problem: {
      zh: '接私单后催款很头疼，客户总说"等我看看"，发的收款信息格式随意，不像正规发票。',
      en: 'Collecting payment after freelance work was a headache. Clients would delay, and informal payment requests didn\'t convey urgency.',
    },
    solution: {
      zh: '生成正式 Invoice，包含到期日期和付款方式，发 PDF 给客户，并通过"分享链接"让客户随时查看。',
      en: 'Generated a formal Invoice with a due date and payment instructions. Shared the PDF and a public view link so clients could review anytime.',
    },
    result: {
      zh: '平均回款时间从 14 天缩短至 5 天，再也不需要反复催款了。',
      en: 'Average payment time dropped from 14 days to 5. No more chasing clients.',
    },
    quote: {
      zh: '一份正式 Invoice 让客户觉得我是在认真做生意，不是随便接活儿的。',
      en: 'A proper invoice signals I run a real business — not just a side hustle.',
    },
  },
  {
    industry: { zh: '咨询 / 教育培训', en: 'Consulting & Training' },
    name:     { zh: 'Lisa — 职业发展顾问', en: 'Lisa — Career Consultant' },
    avatar:   'L',
    color:    'bg-emerald-100 text-emerald-700',
    tool:     'email' as const,
    problem: {
      zh: '每次给潜在客户发跟进邮件，都要想半天怎么写，既不想太销售感，又要体现专业度。',
      en: 'Writing follow-up emails to prospects took ages. Balancing professionalism with a non-pushy tone was always a struggle.',
    },
    solution: {
      zh: '使用商务邮件生成器，选择"客户跟进"类型，填入客户姓名和跟进目的，AI 生成三个版本（完整/简洁/正式）供选择。',
      en: 'Using the Email Generator with "Follow Up" type, filling in client name and purpose. AI generates three versions (full/short/formal) to choose from.',
    },
    result: {
      zh: '邮件撰写时间从平均 20 分钟降至 3 分钟，客户约谈转化率提升。',
      en: 'Email drafting time cut from 20 minutes to 3. Client meeting conversion rate improved noticeably.',
    },
    quote: {
      zh: '我把 AI 当成了一个随时待命的文案助理，它不会累，也不会忘记要保持礼貌。',
      en: 'I think of the AI as an always-on copywriting assistant — it never gets tired and always stays polite.',
    },
  },
  {
    industry: { zh: '工程 / 施工报价', en: 'Construction & Engineering' },
    name:     { zh: 'David — 装修工程负责人', en: 'David — Renovation Contractor' },
    avatar:   'D',
    color:    'bg-orange-100 text-orange-700',
    tool:     'quote' as const,
    problem: {
      zh: '给业主报价靠手写或微信截图，客户看不懂项目明细，经常有争议，导致工程款纠纷。',
      en: 'Quotes were handwritten or sent as WeChat screenshots. Clients couldn\'t read the itemized breakdown, leading to payment disputes.',
    },
    solution: {
      zh: '将每个工程项目单独列入报价单条目，生成清晰的含税报价 PDF，并通过链接分享给业主确认。',
      en: 'Each project scope item is listed separately in the quote. Generate a clear itemized PDF with tax, then share the link with the client for confirmation.',
    },
    result: {
      zh: '报价纠纷从每个月 2-3 起降到接近零，同时报价速度提升了 5 倍。',
      en: 'Quote disputes dropped from 2–3 per month to near zero. Quote speed improved 5×.',
    },
    quote: {
      zh: '现在业主拿到我的报价单，第一句话是"你们公司挺正规的"。',
      en: 'Now when clients see my quote, the first thing they say is "you run a professional operation."',
    },
  },
]

const TOOL_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  quote:   { zh: '报价单', en: 'Quote',   color: 'bg-violet-100 text-violet-700' },
  invoice: { zh: 'Invoice', en: 'Invoice', color: 'bg-blue-100 text-blue-700' },
  email:   { zh: '商务邮件', en: 'Email',  color: 'bg-emerald-100 text-emerald-700' },
}

export default async function CasesPage({ params }: Props) {
  const { locale } = await params
  const zh = locale === 'zh'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">{zh ? '真实客户案例' : 'Customer Stories'}</h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          {zh
            ? '来自不同行业的真实用户，分享他们如何用企文助手节省时间、提升专业形象。'
            : 'Real users from different industries share how BizDoc AI helps them save time and look more professional.'}
        </p>
      </div>

      {/* Case cards */}
      <div className="space-y-8">
        {CASES.map((c, i) => {
          const tool = TOOL_LABELS[c.tool]
          return (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${c.color}`}>
                  {c.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{c.name[zh ? 'zh' : 'en']}</p>
                  <p className="text-xs text-gray-400">{c.industry[zh ? 'zh' : 'en']}</p>
                </div>
                <span className={`ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-medium ${tool.color}`}>
                  {tool[zh ? 'zh' : 'en']}
                </span>
              </div>

              {/* Body */}
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{zh ? '痛点' : 'Challenge'}</p>
                  <p className="text-gray-700 leading-relaxed">{c.problem[zh ? 'zh' : 'en']}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{zh ? '解决方式' : 'Solution'}</p>
                  <p className="text-gray-700 leading-relaxed">{c.solution[zh ? 'zh' : 'en']}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{zh ? '效果' : 'Result'}</p>
                  <p className="text-gray-700 leading-relaxed">{c.result[zh ? 'zh' : 'en']}</p>
                </div>
              </div>

              {/* Quote */}
              <div className="mx-6 mb-5 rounded-xl bg-gray-50 px-5 py-4 border-l-4 border-indigo-300">
                <p className="text-sm text-gray-600 italic">&ldquo;{c.quote[zh ? 'zh' : 'en']}&rdquo;</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-indigo-600 px-8 py-10 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">
          {zh ? '你的下一份文书，30 秒生成' : 'Your next document, ready in 30 seconds'}
        </h2>
        <p className="text-indigo-100 text-sm">
          {zh ? '免费注册，每月 5 次生成，无需信用卡。' : 'Sign up free — 5 generations per month, no credit card required.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${locale}/login`}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            {zh ? '免费开始' : 'Get started free'}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="rounded-lg border border-indigo-400 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {zh ? '查看价格' : 'View pricing'}
          </Link>
        </div>
      </div>
    </div>
  )
}
