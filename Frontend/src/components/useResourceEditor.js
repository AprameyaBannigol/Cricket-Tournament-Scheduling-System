import { useRef, useState } from 'react'

export function useResourceEditor(blank, save, label) {
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)

  function open(record = blank) {
    setForm(record)
    setEditingId(record.id ?? null)
    setError('')
    setSuccess('')
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    setSuccess('')
    if (!form.name.trim()) {
      setError(`${label} name is required.`)
      return
    }
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      await save(form, editingId)
      setForm(null)
      setSuccess(`${label} ${editingId ? 'updated' : 'registered'}.`)
    } catch (requestError) {
      setError(requestError.message || `Unable to save the ${label.toLowerCase()}.`)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return { form, setForm, editingId, saving, error, success, open, submit, close: () => setForm(null) }
}
