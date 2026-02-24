import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const { url } = await request.json();
        if (!url) return NextResponse.json({ bookmarked: false });

        // Check if bookmark exists for this user
        const { data, error } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("url", url)
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({ bookmarked: !!data });

    } catch (err: any) {
        console.error("URL check error:", err);
        return NextResponse.json({ bookmarked: false });
    }
}
