import { notFound } from 'next/navigation'
import { isValidLocale } from '@/lib/i18n'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'zh' ? '隐私政策 | 企文助手' : 'Privacy Policy | BizDoc AI',
  }
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  const zh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {zh ? '隐私政策' : 'Privacy Policy'}
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        {zh ? '最后更新：2025 年 5 月' : 'Last updated: May 2025'}
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '1. 概述' : '1. Overview'}
          </h2>
          <p>
            {zh
              ? '企文助手（以下简称"本产品"）非常重视您的隐私。本隐私政策说明我们如何收集、使用和保护您在使用本产品过程中产生的信息。使用本产品即表示您同意本政策。'
              : 'BizDoc AI ("the Service") respects your privacy. This Privacy Policy explains how we collect, use, and protect information you provide when using the Service. By using the Service, you agree to this policy.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '2. 我们收集的信息' : '2. Information We Collect'}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {zh
                ? '账户信息：注册时提供的邮箱地址和姓名（通过 Supabase Auth 存储）'
                : 'Account information: email address and name provided at registration (stored via Supabase Auth)'}
            </li>
            <li>
              {zh
                ? '使用数据：每月生成次数、生成类型（报价单/Invoice/邮件）'
                : 'Usage data: monthly generation count, generation type (quote / invoice / email)'}
            </li>
            <li>
              {zh
                ? '表单输入内容：您在生成工具中填写的客户名称、金额等信息，用于发送给 AI 生成文书'
                : 'Form inputs: client name, amounts, and other details you enter into the tools, which are sent to the AI to generate documents'}
            </li>
            <li>
              {zh
                ? '公司资料：您主动保存的公司信息（可随时删除）'
                : 'Company profile: company information you explicitly save (can be deleted at any time)'}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '3. 信息的使用方式' : '3. How We Use Your Information'}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>{zh ? '提供和改进服务功能' : 'Provide and improve the Service'}</li>
            <li>{zh ? '管理您的账户和使用配额' : 'Manage your account and usage quota'}</li>
            <li>{zh ? '生成您请求的文书内容' : 'Generate the document content you request'}</li>
            <li>{zh ? '通过邮件发送重要通知（如服务变更）' : 'Send important notifications (e.g., service changes) by email'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '4. 第三方服务' : '4. Third-Party Services'}
          </h2>
          <p className="mb-3">
            {zh
              ? '本产品使用以下第三方服务，您的部分数据会被传输至这些服务商：'
              : 'The Service uses the following third-party providers. Some of your data is transmitted to them:'}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Supabase</strong>
              {zh
                ? ' — 用于账户认证和数据库存储。数据存储于安全的云服务器，受 Supabase 隐私政策约束。'
                : ' — for authentication and database storage. Data is stored on secure cloud servers governed by Supabase’s privacy policy.'}
            </li>
            <li>
              <strong>Anthropic (Claude API)</strong>
              {zh
                ? ' — 用于 AI 文书生成。您在表单中填写的内容将发送至 Anthropic API 以生成结果。Anthropic 承诺不将 API 输入用于模型训练。'
                : ' — for AI document generation. Your form inputs are sent to the Anthropic API to produce results. Anthropic commits not to use API inputs to train models.'}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '5. 数据安全' : '5. Data Security'}
          </h2>
          <p>
            {zh
              ? '所有数据通过 HTTPS 加密传输。数据库层面启用行级安全策略（RLS），确保每位用户只能访问自己的数据。我们不会出售、出租或共享您的个人信息给任何第三方用于商业目的。'
              : 'All data is transmitted over HTTPS. Row-Level Security (RLS) is enforced at the database layer so each user can only access their own data. We never sell, rent, or share your personal information with third parties for commercial purposes.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '6. 数据保留与删除' : '6. Data Retention & Deletion'}
          </h2>
          <p>
            {zh
              ? '您可以随时联系我们删除账户及所有相关数据。账户删除后，数据将在 30 天内从我们的系统中清除。'
              : 'You may contact us at any time to delete your account and all associated data. Upon account deletion, data will be purged from our systems within 30 days.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '7. Cookie' : '7. Cookies'}
          </h2>
          <p>
            {zh
              ? '我们使用必要的 Cookie 来维持登录状态和保存您的语言偏好。不使用广告追踪 Cookie。'
              : 'We use essential cookies to maintain your login session and save your language preference. No advertising or tracking cookies are used.'}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {zh ? '8. 联系我们' : '8. Contact Us'}
          </h2>
          <p>
            {zh
              ? '如有任何隐私相关问题，请发邮件至：'
              : 'For any privacy-related questions, please email:'}
            {' '}
            <a href="mailto:fanhui100@gmail.com" className="text-primary hover:underline">
              fanhui100@gmail.com
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
