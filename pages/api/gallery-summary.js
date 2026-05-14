import { connectDB } from '../../lib/db';
import { Media } from '../../lib/models';

const CATS = ['birthday','babyshower','inhouse','kids','haldi','mandap','reception','corporate'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  await connectDB();

  const counts = await Media.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const summary = Object.fromEntries(CATS.map(c => [c, 0]));
  counts.forEach(({ _id, count }) => { if (_id in summary) summary[_id] = count; });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.status(200).json(summary);
}
