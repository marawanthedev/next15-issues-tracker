import { db } from '@/db'
import { getSession } from './auth'
import { eq } from 'drizzle-orm'
import { issues, users } from '@/db/schema'
import { mockDelay } from './utils'
import { unstable_cacheTag as cacheTag, unstable_cacheLife } from 'next/cache'
import { cache } from 'react'

// no need to memoize server actions bcs they get called on an interaction
// only server functions might be called upon render so thats why we cache it

export const getCurrentUser = cache(async () => {
    console.log("get current user")
    try {
        await mockDelay(1000)
        const session = await getSession();

        if (!session) return null;

        const currentUser = await db.select().from(users).where(eq(users.id, session.userId));

        return currentUser[0] || null;
    }
    catch (e) {
        console.error('failed to get current user')
        return null
    }
}
)

export const getUserByEmail = async (email: string): Promise<null | { email: string, password: string, id: string }> => {

    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!existingUser) {
            return null
        }

        return {
            id: existingUser[0].id,
            email: existingUser[0].email,
            password: existingUser[0].password
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

export const getIssues = async () => {
    'use cache'
    cacheTag('issues')

    try {
        await mockDelay(1000)
        const results = await db.query.issues.findMany({
            with: {
                user: true
            },
            orderBy: (issues, { desc }) => [desc(issues.createdAt)]
        })
        return results
    } catch (e) {
        console.error('Error fetching issues:', e)
        throw new Error('Failed to fetch issues')
    }

}


export const getIssue = async (id: string) => {
    try {
        await mockDelay(1500)

        const issue = await db.query.issues.findFirst({ with: { user: true }, where: eq(issues.id, Number(id)) })

        return issue;
    }
    catch (e) {
        const errorMessage = (e as Error).message || 'Error retreiving issue'
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
}