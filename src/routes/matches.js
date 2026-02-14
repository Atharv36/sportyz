import { Router } from "express";
import { createMatchSchema , listMatchesQuerySchema } from "../validation/matches.js";
import { parse } from "dotenv";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { db } from "../db/db.js";
import { desc } from "drizzle-orm";
export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get('/',async(req,res)=>{
    const parsed = listMatchesQuerySchema.safeParse(req.query)
    if(!parsed.success) {
        return res.status(400).json({
            error: "INVALID QUERY",
            details: parsed.error.format()
        });
    }


        const limit = Math.min(parsed.data.limit ?? 50 , MAX_LIMIT);


        try{

            const data = await db
            .select()
            .from(matches)
            .orderBy((desc(matches.createdAt)))
            .limit(limit);

            res.json({data})

        }catch(e){
            res.status(500).json({
                error:"Failed to list matches"
            });

        }
})


matchRouter.post('/', async (req, res) => {

    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "INVALID PAYLOAD",
            details: parsed.error.format()
        });
    }

    const { startTime, endTime, homeScore, awayScore } = parsed.data;

    try {

        const start = new Date(startTime);
        const end = new Date(endTime);

        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: start,
            endTime: end,
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(start, end),
        }).returning();

        return res.status(201).json({ data: event });

    } catch (e) {
        console.error("CREATE MATCH ERROR:", e);
        return res.status(500).json({
            error: "Failed to create a match",
            details: e.message
        });
    }
});
