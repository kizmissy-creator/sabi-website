import clientAuth from './client-auth-30d.js';
export default async function followUpAuth(request, context) {
  const response = await clientAuth(request, context);
  if (response.status === 303 && response.headers.get('location') === '/') {
    const headers = new Headers(response.headers);
    headers.set('location', '/follow-up/' + (new URL(request.url).searchParams.get('test') === '1' ? '?test=1' : ''));
    return new Response(null, { status: 303, headers });
  }
  if (response.status === 401 || response.status === 503) {
    const html = (await response.text()).replaceAll('onboarding', 'follow-up').replace('action="/"', 'action="' + (new URL(request.url).searchParams.get('test') === '1' ? '/follow-up/?test=1' : '/follow-up/') + '"');
    return new Response(html, { status: response.status, headers: response.headers });
  }
  return response;
}
