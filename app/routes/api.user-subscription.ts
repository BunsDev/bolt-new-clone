import { json } from '@remix-run/cloudflare';
import { db } from '~/utils/db.server';
import { requireAuth } from '~/middleware/auth.server';

export async function loader({ request }: { request: Request }) {
    let userId;
    try {
      userId = await requireAuth(request);
    } catch (error) {
      return error as Response;
    }
    
    try {
    const userSubscription = await db.select(
      'subscription_plans.*',
      'user_transactions.tokens as tokensLeft',
      db.raw('DATE_ADD(user_transactions._create, INTERVAL 1 MONTH) as nextReloadDate')
    )
    .from('user_transactions')
    .join('subscription_plans', 'user_transactions.plan_id', 'subscription_plans._id')
    .where('user_transactions.user_id', userId)
    .orderBy('user_transactions._create', 'desc')
    .first();

    return json(userSubscription);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return json({ error: 'Failed to fetch user subscription' }, { status: 500 });
  }
}
