export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          body: string | null
          created_at: string
          external_id: string | null
          id: string
          image_url: string | null
          item_id: string | null
          kind: string
          list_id: string | null
          score_10: number | null
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          item_id?: string | null
          kind: string
          list_id?: string | null
          score_10?: number | null
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          item_id?: string | null
          kind?: string
          list_id?: string | null
          score_10?: number | null
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          user_id?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          item_id: string
          list_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          item_id: string
          list_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_invites: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          id: string
          list_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          list_id: string
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          list_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_invites_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          added_by: string
          created_at: string
          creator: string | null
          done: boolean
          done_at: string | null
          done_by: string | null
          external_id: string
          external_url: string | null
          genres: string[]
          id: string
          image_url: string | null
          kind_label: string | null
          list_id: string
          media_type: string
          source: string
          title: string
          year: number | null
        }
        Insert: {
          added_by?: string
          created_at?: string
          creator?: string | null
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          external_id: string
          external_url?: string | null
          genres?: string[]
          id?: string
          image_url?: string | null
          kind_label?: string | null
          list_id: string
          media_type: string
          source: string
          title: string
          year?: number | null
        }
        Update: {
          added_by?: string
          created_at?: string
          creator?: string | null
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          external_id?: string
          external_url?: string | null
          genres?: string[]
          id?: string
          image_url?: string | null
          kind_label?: string | null
          list_id?: string
          media_type?: string
          source?: string
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_members: {
        Row: {
          joined_at: string
          list_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          list_id: string
          role?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          list_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string
          id: string
          kind: string
          name: string
          owner_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          kind?: string
          name: string
          owner_id?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      movie_entries: {
        Row: {
          external_id: string
          favorite: boolean
          genres: string[]
          id: string
          image_url: string | null
          review: string
          score_10: number | null
          source: string
          title: string
          updated_at: string
          user_id: string
          watched: boolean
          year: number | null
        }
        Insert: {
          external_id: string
          favorite?: boolean
          genres?: string[]
          id?: string
          image_url?: string | null
          review?: string
          score_10?: number | null
          source: string
          title: string
          updated_at?: string
          user_id: string
          watched?: boolean
          year?: number | null
        }
        Update: {
          external_id?: string
          favorite?: boolean
          genres?: string[]
          id?: string
          image_url?: string | null
          review?: string
          score_10?: number | null
          source?: string
          title?: string
          updated_at?: string
          user_id?: string
          watched?: boolean
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          id: string
          top_five: Json
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id: string
          top_five?: Json
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          top_five?: Json
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          item_id: string
          list_id: string
          review: string
          score: number
          score_10: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          item_id: string
          list_id: string
          review?: string
          score: number
          score_10?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          item_id?: string
          list_id?: string
          review?: string
          score?: number
          score_10?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      social_comments: {
        Row: {
          activity_id: string | null
          body: string
          created_at: string
          id: string
          list_id: string | null
          profile_id: string | null
          review_item_id: string | null
          review_user_id: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          body: string
          created_at?: string
          id?: string
          list_id?: string | null
          profile_id?: string | null
          review_item_id?: string | null
          review_user_id?: string | null
          user_id?: string
        }
        Update: {
          activity_id?: string | null
          body?: string
          created_at?: string
          id?: string
          list_id?: string | null
          profile_id?: string | null
          review_item_id?: string | null
          review_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_review_item_id_fkey"
            columns: ["review_item_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_review_user_id_fkey"
            columns: ["review_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_movies: {
        Row: {
          external_id: string
          genres: string[]
          id: string
          image_url: string | null
          review: string
          score_10: number | null
          source: string
          title: string
          user_id: string
          watched_at: string
          year: number | null
        }
        Insert: {
          external_id: string
          genres?: string[]
          id?: string
          image_url?: string | null
          review?: string
          score_10?: number | null
          source: string
          title: string
          user_id?: string
          watched_at?: string
          year?: number | null
        }
        Update: {
          external_id?: string
          genres?: string[]
          id?: string
          image_url?: string | null
          review?: string
          score_10?: number | null
          source?: string
          title?: string
          user_id?: string
          watched_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "watched_movies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend: { Args: { request_id: string }; Returns: undefined }
      accept_invite: { Args: { _token: string }; Returns: string }
      are_friends: { Args: { a: string; b: string }; Returns: boolean }
      can_read_list: { Args: { lid: string; uid: string }; Returns: boolean }
      claim_email_invites: { Args: never; Returns: number }
      get_invite: {
        Args: { _token: string }
        Returns: {
          description: string
          kind: string
          list_id: string
          member_count: number
          name: string
          owner_name: string
        }[]
      }
      invite_friend: {
        Args: { friend_id: string; lid: string }
        Returns: undefined
      }
      is_list_member: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      is_list_owner: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
