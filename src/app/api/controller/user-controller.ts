/* import { db } from "@/lib/supabase/db"
import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm"
import { Context } from "hono"



const getMyProfile = async (c: Context) => {
    try {
        const userId = c.req.param("userId");

        return c.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return c.json({ error: "Failed to fetch user profile" }, 500);
    }
}


export {
    getMyProfile
} */