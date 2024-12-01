import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db;

  const query = `
SELECT
    a.name AS artist_name,
	  e.event_type AS event_type,
  CASE 
		WHEN e.event_type = 'play_track' THEN 1
		WHEN e.event_type = 'add_track_to_playlist' THEN 2
		WHEN e.event_type = 'share_track' THEN 3
		WHEN e.event_type = 'like_track' THEN 2
		WHEN e.event_type = 'follow_artist' THEN 3
		WHEN e.event_type = 'share_artist' THEN 4
		ELSE 0
	END AS engagement_score,
	e.created_at as created_at,
	u.timezone as timezone
FROM
    user_events e
JOIN
    users u ON e.user_id = u.id
JOIN
    artists a ON e.artist_id = a.id
ORDER BY
    artist_name ASC, engagement_score DESC, created_at DESC
`;

  const data = await db.prepare(query).all();

  return {
    data,
  };
};
