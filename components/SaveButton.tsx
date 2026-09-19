'use client'

import { useFormStatus } from 'react-dom'

export default function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full rounded-lg py-2 font-medium sm:w-auto sm:px-8"
    >
      {pending ? 'Saving\u2026' : 'Save entry'}
    </button>
  )
}
