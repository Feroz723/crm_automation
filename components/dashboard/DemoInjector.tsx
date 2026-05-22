'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function useDemoInjector() {
    const [isInjecting, setIsInjecting] = useState(false)
    const router = useRouter()

    const injectDemoLead = async () => {
        setIsInjecting(true)
        try {
            const res = await fetch('/api/demo/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!res.ok) throw new Error('Failed to inject demo lead')

            // Refresh to show the new lead
            router.refresh()

            return true
        } catch (error) {
            console.error('Demo injection failed:', error)
            return false
        } finally {
            setIsInjecting(false)
        }
    }

    return {
        injectDemoLead,
        isInjecting
    }
}
