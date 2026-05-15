export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">Admin</span>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  )
}
