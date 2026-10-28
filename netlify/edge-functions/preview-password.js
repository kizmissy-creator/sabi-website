import { protectPreview } from '../lib/preview-auth.mjs';
import { previewCredential } from '../lib/preview-credential.mjs';
import { studioOrigin } from '../lib/studio-site.mjs';

export default async (request, context) => {
  const url = new URL(request.url);
  // Older invitations retain their fragment when the browser follows this redirect.
  if (context.site?.id === '1f5c443d-2d62-4e8c-b915-dbdb682ef326' &&
      context.deploy?.context !== 'production' && /^\/studio(?:\/|$)/.test(url.pathname) && request.method === 'GET') {
    return Response.redirect(studioOrigin + (url.pathname.replace(/^\/studio/, '') || '/') + url.search, 302);
  }
  return protectPreview(request, context, previewCredential);
};
export const config = { path: '/*', onError: 'fail' };
