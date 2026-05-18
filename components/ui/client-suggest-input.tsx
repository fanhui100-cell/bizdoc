'use client'

import { useState, useEffect, useId } from 'react'

interface ClientOption {
  id: string
  name: string
  company: string | null
  email: string | null
}

interface Props {
  value: string
  onChange: (value: string) => void
  onClientSelected?: (client: ClientOption | null) => void
  placeholder?: string
  className?: string
  label?: string
}

export function ClientSuggestInput({ value, onChange, onClientSelected, placeholder, className = '', label }: Props) {
  const listId = useId()
  const [clients, setClients] = useState<ClientOption[]>([])

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then(({ clients }) => setClients(clients ?? []))
      .catch(() => {})
  }, [])

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      )}
      <input
        list={listId}
        value={value}
        onChange={(e) => {
          const nextValue = e.target.value
          onChange(nextValue)
          const matched = clients.find((client) => client.name === nextValue) ?? null
          onClientSelected?.(matched)
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
      />
      {clients.length > 0 && (
        <datalist id={listId}>
          {clients.map((c) => (
            <option key={c.id} value={c.name}>
              {c.company ? `${c.name} · ${c.company}` : c.name}
            </option>
          ))}
        </datalist>
      )}
    </div>
  )
}
