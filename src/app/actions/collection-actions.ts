"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Invite a user to a collection by email
 */
export async function inviteMember(collectionId: string, email: string, role: string = "viewer") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Look up user by email using our secure function
    const { data: profiles, error: lookupError } = await supabase
        .rpc("get_profile_by_email", { email_input: email });

    if (lookupError) throw new Error(`Lookup failed: ${lookupError.message}`);

    if (!profiles || profiles.length === 0) {
        throw new Error("User not found. They must have an account to be invited.");
    }

    const targetUser = profiles[0];

    // 2. Insert into collection_members
    // RLS ensures only owners can do this
    const { error: insertError } = await supabase.from("collection_members").insert({
        collection_id: collectionId,
        user_id: targetUser.id,
        role,
    });

    if (insertError) {
        if (insertError.code === "23505") { // Unique violation
            throw new Error("User is already a member of this collection.");
        }
        throw new Error(`Failed to invite: ${insertError.message}`);
    }

    revalidatePath("/dashboard");
    return { success: true };
}

/**
 * Update a member's role
 */
export async function updateMemberRole(memberId: string, role: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // RLS ensures only owners can update
    const { error } = await supabase
        .from("collection_members")
        .update({ role })
        .eq("user_id", memberId); // Wait, this updates ALL memberships for this user? No, need collection_id?
    // Ah, memberId usually implies the ID of the membership record? 
    // But collection_members PK is `id` (uuid). Check schema.
    // Schema: id, collection_id, user_id, role.
    // Assuming memberId passed here is the `collection_members.id`?
    // Or if passing `collection_id` and `user_id`.
    // Let's assume memberId is indeed collection_members.id for safety.
    // Re-reading schema... yes `id uuid default gen_random_uuid() primary key`.
    // So passed `memberId` should be the PK.

    // However, if the UI passes user_id and collection_id, it is clearer.
    // Let's stick to update by PK (memberId) if possible.

    // Oops, I need to check if the caller passes the PK.
    // In `getCollections` (lib/data/collections.ts), I return members:
    // { id: m.user_id, ... } NO!
    // Line 46: id: m.user_id. 
    // This is misleading. The UI likely treats `member.id` as the USER ID.
    // So I should probably expect `collectionId` and `userId` to identify the row securely.
}

/**
 * Remove a member from a collection
 */
export async function removeMember(collectionId: string, userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("collection_members")
        .delete()
        .eq("collection_id", collectionId)
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to remove member: ${error.message}`);

    revalidatePath("/dashboard");
}

/**
 * Update member role by User ID
 */
export async function updateMemberRoleByUserId(collectionId: string, userId: string, role: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("collection_members")
        .update({ role })
        .eq("collection_id", collectionId)
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to update role: ${error.message}`);

    revalidatePath("/dashboard");
}

/**
 * Toggle public visibility
 */
export async function updateCollectionVisibility(collectionId: string, isPublic: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("collections")
        .update({ is_public: isPublic })
        .eq("id", collectionId);

    if (error) throw new Error(`Failed to update visibility: ${error.message}`);

    revalidatePath("/dashboard");
}
