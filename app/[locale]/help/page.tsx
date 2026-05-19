import Link from 'next/link'

interface Props {
  params: Promise<{ locale: string }>
}

const FAQS = [
  {
    q: { zh: '企文助手是做什么的？', en: 'What does BizDoc AI do?' },
    a: {
      zh: '企文助手是一款 AI 驱动的商务文书工具，帮助小企业和自由职业者快速生成报价单、Invoice 和商务邮件，支持中英双语输出。',
      en: 'BizDoc AI is an AI-powered business document tool that helps small businesses and freelancers quickly generate quotes, invoices, and business emails in both Chinese and English.',
    },
  },
  {
    q: { zh: '免费版有什么限制？', en: 'What are the limits of the free plan?' },
    a: {
      zh: '免费版每月可生成 5 次文书，支持复制文本，历史记录显示最近 3 条，PDF 导出带水印。',
      en: 'The free plan allows 5 generations per month, supports text copying, shows the last 3 history records, and exports PDFs with a watermark.',
    },
  },
  {
    q: { zh: '如何升级到 Pro 版？', en: 'How do I upgrade to Pro?' },
    a: {
      zh: '国内用户：微信或支付宝转账后，联系客服并告知注册邮箱，客服将在 24 小时内为你开通。海外用户：PayPal 付款后联系客服。',
      en: 'International users: Pay via PayPal, then contact support with your registered email. We will activate your account within 24 hours.',
    },
  },
  {
    q: { zh: '次数是什么时候重置？', en: 'When does the quota reset?' },
    a: {
      zh: '生成次数每月固定日期自动重置（按注册日期起算满一个月）。你可以在「账户」页面查看下次重置时间。',
      en: 'Your quota resets monthly on the same date you registered. You can check the next reset date on your Account page.',
    },
  },
  {
    q: { zh: '生成的文书内容我可以商用吗？', en: 'Can I use the generated documents commercially?' },
    a: {
      zh: '可以。你提交的输入数据和 AI 生成的输出内容完全归你所有，可自由用于商业场景。',
      en: 'Yes. You own all the input data you submit and the AI-generated output. You are free to use them for commercial purposes.',
    },
  },
  {
    q: { zh: '我的数据安全吗？', en: 'Is my data secure?' },
    a: {
      zh: '所有数据通过 HTTPS 加密传输，存储在 Supabase PostgreSQL 数据库中并启用行级安全策略（RLS），只有你本人才能访问自己的记录。我们不会出售或分享你的数据。',
      en: 'All data is transmitted over HTTPS and stored in a Supabase PostgreSQL database with Row Level Security (RLS) enabled — only you can access your own records. We never sell or share your data.',
    },
  },
  {
    q: { zh: '支持哪些币种？', en: 'Which currencies are supported?' },
    a: {
      zh: '目前支持人民币（CNY）、美元（USD）、欧元（EUR）、英镑（GBP）和港元（HKD）。如有其他需求可联系客服。',
      en: 'Currently supported: CNY, USD, EUR, GBP, and HKD. Contact support if you need additional currencies.',
    },
  },
  {
    q: { zh: '可以申请退款吗？', en: 'Can I get a refund?' },
    a: {
      zh: '可以。如果对服务不满意，可在购买后 7 天内联系客服申请退款，无需说明理由。',
      en: 'Yes. If you are not satisfied, you may request a full refund within 7 days of purchase — no questions asked.',
    },
  },
  {
    q: { zh: '如何保存常用客户信息？', en: 'How do I save client information?' },
    a: {
      zh: '登录后前往「账户」→「管理客户」，添加客户姓名、公司、邮箱等信息。在生成报价单、Invoice 或邮件时，客户名称字段会自动显示建议列表。',
      en: 'Go to Account → Manage Clients after logging in. Add client names, companies, and emails. When filling out quote, invoice, or email forms, the client name field will show autocomplete suggestions.',
    },
  },
  {
    q: { zh: '如何重复使用之前的文书？', en: 'How do I reuse a previous document?' },
    a: {
      zh: '在「历史记录」页面，点击记录右侧的「重新编辑」按钮，上次的所有输入内容将自动填充到对应工具表单，可直接修改后重新生成。',
      en: 'On the Dashboard (History) page, click "Re-use" next to any record. All previous inputs will be pre-filled into the tool form so you can edit and regenerate.',
    },
  },
]

export default async function HelpPage({ params }: Props) {
  const { locale } = await params
  const zh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{zh ? '帮助中心' : 'Help Center'}</h1>
        <p className="text-gray-500 text-sm">
          {zh ? '常见问题解答，快速找到你需要的答案' : 'Frequently asked questions — find the answers you need quickly.'}
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
          {zh ? '常见问题' : 'Frequently Asked Questions'}
        </h2>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {FAQS.map((faq, i) => (
            <details key={i} className="group px-5 py-4 cursor-pointer">
              <summary className="flex items-center justify-between gap-4 text-sm font-medium text-gray-900 list-none select-none">
                <span>{faq.q[zh ? 'zh' : 'en']}</span>
                <span className="text-gray-400 text-lg transition-transform group-open:rotate-45 shrink-0">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {faq.a[zh ? 'zh' : 'en']}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
          {zh ? '快速导航' : 'Quick Links'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: `/${locale}/tools/quote`,   icon: '📄', label: zh ? '报价单生成器' : 'Quote Generator' },
            { href: `/${locale}/tools/invoice`, icon: '🧾', label: zh ? 'Invoice 生成器' : 'Invoice Generator' },
            { href: `/${locale}/tools/email`,   icon: '✉️', label: zh ? '商务邮件生成器' : 'Email Generator' },
            { href: `/${locale}/pricing`,        icon: '💳', label: zh ? '价格方案' : 'Pricing' },
            { href: `/${locale}/account`,        icon: '⚙️', label: zh ? '账户设置' : 'Account Settings' },
            { href: `/${locale}/clients`,        icon: '👥', label: zh ? '客户列表' : 'Client Book' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-5 space-y-2">
        <h2 className="text-base font-semibold text-indigo-900">{zh ? '还有问题？联系我们' : 'Still have questions?'}</h2>
        <p className="text-sm text-indigo-700">
          {zh
            ? '如果以上内容没有解答你的问题，欢迎通过邮件联系我们，我们将在 1 个工作日内回复。'
            : 'If you cannot find the answer above, feel free to reach out by email. We typically respond within one business day.'}
        </p>
        <a
          href="mailto:fanhui100@gmail.com"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {zh ? '发送邮件' : 'Email Support'}
        </a>
      </div>

      {/* Legal links */}
      <p className="text-center text-xs text-gray-400">
        <Link href={`/${locale}/privacy`} className="hover:underline">{zh ? '隐私政策' : 'Privacy Policy'}</Link>
        {' · '}
        <Link href={`/${locale}/terms`} className="hover:underline">{zh ? '服务条款' : 'Terms of Service'}</Link>
      </p>
    </div>
  )
}
