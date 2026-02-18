import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { eq, desc } from "drizzle-orm";


export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
    try {
        // Validate matchId param
        const paramResult = matchIdParamSchema.safeParse(req.params);
        if (!paramResult.success) {
            return res.status(400).json({ error: 'Invalid match id', details: paramResult.error.errors });
        }
        const { id: matchId } = paramResult.data;

        // Validate query
        const queryResult = listCommentaryQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({ error: 'Invalid query', details: queryResult.error.errors });
        }
        const MAX_LIMIT = 100;
        const limit = queryResult.data.limit ?? MAX_LIMIT;

        // Fetch commentary for matchId, ordered by createdAt desc, limited
        const results = await db.select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch commentary', details: err.message });
    }
});

commentaryRouter.post('/', async (req, res) => {
    try {
        // Validate matchId param
        const paramResult = matchIdParamSchema.safeParse(req.params);
        if (!paramResult.success) {
            return res.status(400).json({ error: 'Invalid match id', details: paramResult.error.errors });
        }
        const { id: matchId } = paramResult.data;

        // Validate body
        const bodyResult = createCommentarySchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({ error: 'Invalid commentary data', details: bodyResult.error.errors });
        }
        const commentaryData = bodyResult.data;

        // Insert into commentary table
        const [inserted] = await db.insert(commentary).values({ ...commentaryData, matchId }).returning();


        if(res.app.locals.broadcastCommentary){
            res.app.locals.broadcastCommentary(inserted.matchId , inserted)
        }


        res.status(201).json(inserted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add commentary', details: err.message });
    }
});

// commentaryRouter.post('/', async (req, res) => {
//     try {
//         console.log("PARAMS:", req.params);
//         console.log("BODY:", req.body);

//         const paramResult = matchIdParamSchema.safeParse(req.params);
//         console.log("Param parse result:", paramResult);

//         const bodyResult = createCommentarySchema.safeParse(req.body);
//         console.log("Body parse result:", bodyResult);

//         const matchId = Number(req.params.id);
//         const commentaryData = bodyResult.data;

//         const [inserted] = await db.insert(commentary)
//             .values({ ...commentaryData, matchId })
//             .returning();

//         res.status(201).json(inserted);

//     } catch (err) {
//         console.error("FULL ERROR:", err);
//         res.status(500).json({
//             error: 'Failed to add commentary',
//             details: err.message,
//             stack: err.stack
//         });
//     }
// });
