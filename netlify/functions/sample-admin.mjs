import { getStore } from '@netlify/blobs';
import { authenticate, readState, changeState, response, body, RequestError } from '../lib/samples.mjs';
export default async request => {
  try {
    const input = await body(request);
    if (!authenticate(input.token, true)) throw new RequestError(403, 'Open your private sample organiser link.');
    const store = getStore({ name: 'sabi-studio-samples-v1', consistency: 'strong' });
    const key = input.test === true ? 'test-round' : 'friends-round';
    if (input.action === 'list') {
      const { data } = await readState(store, key);
      return response({ claims: data.claims.map(({ invite, emailKey, ...claim }) => claim) });
    }
    if (input.action === 'status' && ['requested', 'ordered', 'sent', 'cancelled'].includes(input.status)) {
      return response(await changeState(store, key, data => {
        const claim = data.claims.find(c => c.reference === input.reference);
        if (!claim) throw new RequestError(404, 'Request not found.');
        if (claim.status === 'cancelled') throw new RequestError(409, 'A cancelled reservation cannot be reopened.');
        claim.status = input.status;
        claim.updatedAt = new Date().toISOString();
        return { value: { saved: true } };
      }));
    }
    throw new RequestError(400, 'Unknown request.');
  } catch (error) {
    return response({ error: error instanceof RequestError ? error.message : 'The organiser is temporarily unavailable. Please try again.' }, error.status || 503);
  }
};
