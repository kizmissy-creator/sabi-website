import { getStore } from '@netlify/blobs';
import { authenticate, isTest, readState, reserve, response, body, RequestError } from '../lib/samples.mjs';
export default async request => {
  try {
    const input = await body(request);
    const invite = authenticate(input.token);
    if (!invite) throw new RequestError(403, 'You’ll need the personal invitation link Sam sent you.');
    const store = getStore({ name: 'sabi-studio-samples-v1', consistency: 'strong' });
    const key = isTest(invite) ? 'test-round' : 'friends-round';
    if (input.action === 'availability') {
      const { data } = await readState(store, key);
      const mine = data.claims.find(c => c.invite === invite);
      return response({ claimed: data.claims.filter(c => c.status !== 'cancelled').map(c => c.product), used: !!mine, reference: mine?.reference, status: mine?.status, test: isTest(invite) });
    }
    if (input.action !== 'reserve') throw new RequestError(400, 'Unknown request.');
    return response(await reserve(store, key, invite, input));
  } catch (error) {
    return response({ error: error instanceof RequestError ? error.message : 'We couldn’t confirm your request. Your details are still on this page; please try again.' }, error.status || 503);
  }
};
