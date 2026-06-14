export default (router, { database }) => {
	router.options('/:giveawayId', (req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		res.status(200).end();
	});

	router.get('/:giveawayId', async (req, res, next) => {
		try {
			const { giveawayId } = req.params;

			// 1. Fetch giveaway config
			const giveaway = await database('giveaways')
				.select('enable_leaderboard', 'leaderboard_start_date', 'leaderboard_prizes')
				.where('id', giveawayId)
				.first();

			if (!giveaway) {
				return res.status(404).json({ success: false, error: 'Giveaway not found' });
			}

			if (!giveaway.enable_leaderboard) {
				// Daca leaderboard e dezactivat, returnam un array gol
				return res.json({ success: true, data: [] });
			}

			// 2. Query tickets
			let query = database('tickets')
				.select(database.raw('LOWER(TRIM(client_name)) as normalized_name'), database.raw('MAX(client_name) as client_name'))
				.count('id as count')
				.where('giveaway_id', giveawayId)
				.groupByRaw('LOWER(TRIM(client_name))')
				.orderBy('count', 'desc')
				.limit(10);

			if (giveaway.leaderboard_start_date) {
				query = query.where('date_created', '>=', giveaway.leaderboard_start_date);
			}

			const results = await query;

            // Mapează array-ul de rezultate (Knex count e returnat ca string sau number depinzand de dialect)
            const formattedResults = results.map(row => ({
                name: row.client_name || 'Unknown',
                count: Number(row.count)
            })).filter(row => row.name !== 'Unknown'); // Opțional excludem Unknown-urile dacă sunt invalide

			// 3. Return results along with prizes config so frontend knows how to render
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

			return res.json({
				success: true,
				data: formattedResults,
                prizes: giveaway.leaderboard_prizes || null
			});

		} catch (error) {
            console.error('Leaderboard error:', error);
			return next(error);
		}
	});
};
