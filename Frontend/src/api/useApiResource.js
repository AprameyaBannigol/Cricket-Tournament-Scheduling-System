import { useEffect, useState } from 'react'

export function useApiResource(load) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ load, attempt, data })
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ load, attempt, error })
      },
    )
    return () => controller.abort()
  }, [load, attempt])

  const current = result?.load === load && result.attempt === attempt ? result : null
  return {
    loading: !current,
    data: current?.data,
    error: current?.error,
    retry: () => setAttempt((previous) => previous + 1),
  }
}
