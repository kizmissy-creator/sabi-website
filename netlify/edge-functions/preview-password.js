import { protectPreview } from '../lib/preview-auth.mjs';
import { previewCredential } from '../lib/preview-credential.mjs';

export default async (request, context) => protectPreview(request, context, previewCredential);
export const config = { path: '/*', onError: 'fail' };
