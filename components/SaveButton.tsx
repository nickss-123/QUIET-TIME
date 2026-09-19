'use client'

import { useFormStatus } from 'react-dom'

export default function SaveButton({
  disabled = false,
  label = 'Save entry',
}: {
  disabled?: boolean
  label?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary w-full rounded-lg py-2 font-medium sm:w-auto sm:px-8"
    >
      {pending ? 'Saving\u2026' : label}
    </button>
  )
}
