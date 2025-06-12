import { db } from "@/db";
import { issues } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const issues = await db.query.issues.findMany()

        if (!issues) {
            return NextResponse.json({ message: 'Issues are not found' }, { status: 404 })
        }

        return NextResponse.json({ data: issues }, {
            status: 200, headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        })
    }
    catch (e) {
        const errorMessage = (e as Error).message || 'Unkown error occured while retriving issues';

        return NextResponse.json({ message: errorMessage }, { status: 500 })
    }

}

export async function POST(request: Request) {

    try {
        const data = await request.json();

        if (!data.title || !data.userId) {
            return NextResponse.json({ message: "Issues title and user id are required" }, { status: 400 })
        }


        const newIssueValues = {
            title: data.title,
            description: data.description || null,
            userId: data.userId,
            priority: data.priority || 'low',
            status: data.status || 'backlog',
        }

        const insertedIssue = await db.insert(issues).values(newIssueValues).returning();

        return NextResponse.json({ message: "Issue Added successfully", issue: insertedIssue[0] }, { status: 201 })
    }
    catch (e) {
        const errorMessage = (e as Error).message || 'unkown error occured with adding a new issue';
        return NextResponse.json({ message: errorMessage }, { status: 500 })
    }

}