import { useEffect, useRef, useState } from 'react'

export default function useSchedulingConfigurationSave() {
  const [state, setState] = useState({})
  const pending = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  async function submit(save, onSuccess) {
    if (pending.current) return
    pending.current = true
    setState({ saving: true })
    try {
      const result = await save()
      if (mounted.current) {
        setState({ saved: true })
        onSuccess?.(result)
      }
    } catch (error) {
      if (mounted.current) setState({ error })
    } finally {
      pending.current = false
    }
  }

  return { ...state, submit, reset: () => setState({}) }
}
