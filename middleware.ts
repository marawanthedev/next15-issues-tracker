import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {

    // if (request.nextUrl.pathname.startsWith('/api')) {
    //     const authHeader = (await headers()).get("Authorization")

    //     if (!authHeader) {
    //         return NextResponse.json({
    //             success: false,
    //             message: "Authorization header is required"
    //         }, {
    //             status: 401
    //         })
    //     }
    // }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/:path*']
}