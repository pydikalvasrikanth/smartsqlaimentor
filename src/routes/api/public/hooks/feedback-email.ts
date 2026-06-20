import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/feedback-email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey')
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response('Unauthorized', { status: 401 })
        }

        const RESEND_API_KEY = process.env.RESEND_API_KEY
        if (!RESEND_API_KEY) {
          return new Response('RESEND_API_KEY not configured', { status: 500 })
        }

        let payload: any
        try {
          payload = await request.json()
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        const f = payload?.record ?? payload ?? {}
        const esc = (v: unknown) =>
          String(v ?? '—')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

        const rows: Array<[string, unknown]> = [
          ['Subject area', f.subject_area],
          ['Page', f.page_context],
          ['Overall rating', f.overall_rating],
          ['NPS', f.nps_score],
          ['AI quality', f.ai_quality_rating],
          ['Code correctness', f.code_correctness],
          ['Bug report', f.bug_report],
          ['Improvement', f.improvement_suggestion],
          ['Contact email', f.contact_email],
          ['User ID', f.user_id],
          ['Submitted at', f.created_at],
        ]

        const html = `
          <h2 style="font-family:system-ui,sans-serif">New feedback submitted</h2>
          <table style="font-family:system-ui,sans-serif;border-collapse:collapse">
            ${rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:6px 12px;border:1px solid #eee;font-weight:600">${esc(k)}</td><td style="padding:6px 12px;border:1px solid #eee">${esc(v)}</td></tr>`,
              )
              .join('')}
          </table>
        `

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'SmartSQL Feedback <onboarding@resend.dev>',
            to: ['pydikalvasrikanth@gmail.com'],
            subject: `New feedback: ${f.subject_area ?? 'general'}`,
            html,
            reply_to: f.contact_email || undefined,
          }),
        })

        const text = await resp.text()
        if (!resp.ok) {
          return new Response(`Resend error ${resp.status}: ${text}`, { status: 502 })
        }
        return new Response(text, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})