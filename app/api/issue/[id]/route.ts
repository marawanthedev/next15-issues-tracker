import { db } from "@/db";
import { issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: any } }) {


    try {
        const { id } = params;

        const issue = await db.query.issues.findFirst({ where: eq(issues.id, id) })

        if (!issue) {
            return NextResponse.json({ message: "Could not retrieve the issue" }, { status: 404 })
        }

        return NextResponse.json({ data: issue }, { status: 200 })
    }
    catch (e) {
        const errorMessage = (e as Error).message || 'Unknown error occured with retrieving an issue';

        return NextResponse.json({ message: errorMessage }, { status: 500 })
    }

}