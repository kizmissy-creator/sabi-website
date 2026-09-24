export function readableReview(root: HTMLElement): string {
  const copy = root.cloneNode(true) as HTMLElement
  copy.querySelectorAll('button,input,textarea,select').forEach(node => node.remove())
  return Array.from(copy.querySelectorAll('h1,h2,h3,p,summary,dt,dd'))
    .map(node => node.textContent?.trim()).filter(Boolean).join('\n\n')
}

export async function sendFollowUp(payload: string): Promise<string> {
  const expected = JSON.parse(payload).submissionId
  const response = await fetch('/api/follow-up-submit', {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: payload, signal: AbortSignal.timeout(35000),
  })
  const result = await response.json()
  if (!response.ok || result.ok !== true || result.submissionId !== expected) {
    throw new Error(result.error || 'Receipt was not confirmed. Please try again; your draft is still saved.')
  }
  return expected
}
