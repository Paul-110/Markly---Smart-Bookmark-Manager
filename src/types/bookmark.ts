export interface Bookmark {
    id: string;
    url: string;
    title: string;
    description: string;
    favicon_url: string;
    og_image_url: string;
    tags: string[];
    category: string;
    order_index: number;
    visit_count: number;
    last_visited_at: string | null;
    created_at: string;
    is_favorite: boolean;
    short_url?: string;
    reminder_at?: string | null;
    user_id?: string;
    ai_summary?: string;
    shared_by?: string | null;
    collection_id?: string;
    shared_with?: CollectionMember[];
}

export type CollectionRole = "owner" | "editor" | "viewer";

export interface CollectionMember {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: CollectionRole;
    joined_at: string;
}

export interface Collection {
    id: string;
    name: string;
    description: string;
    is_public: boolean;
    bookmark_ids: string[];
    members: CollectionMember[];
    share_url?: string;
    created_at: string;
    user_id?: string;
}

export type SortOption = "newest" | "oldest" | "alphabetical" | "most-visited" | "custom";
export type ViewMode = "bookmarks" | "favorites" | "collections" | "analytics" | "shared" | "settings";
