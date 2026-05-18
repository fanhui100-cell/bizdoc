import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          页面不存在 · Page Not Found
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          你访问的页面不存在或已被移除。<br />
          The page you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/zh"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            返回首页
          </Link>
          <Link
            href="/en"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
