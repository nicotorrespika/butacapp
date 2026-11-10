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
          category: string | null
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
          category?: string | null
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
          category?: string | null
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
      betty_feedback: {
        Row: {
          created_at: string
          external_id: string
          history_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_id: string
          history_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_id?: string
          history_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "betty_feedback_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "betty_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betty_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      betty_history: {
        Row: {
          created_at: string
          id: string
          movies: Json
          prompt: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movies?: Json
          prompt: string
          thread_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movies?: Json
          prompt?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "betty_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cinema_venues: {
        Row: {
          data_source: string
          enabled: boolean
          id: string
          kind: string
          name: string
          neighborhood: string | null
          official_url: string
          updated_at: string
        }
        Insert: {
          data_source?: string
          enabled?: boolean
          id?: string
          kind?: string
          name: string
          neighborhood?: string | null
          official_url: string
          updated_at?: string
        }
        Update: {
          data_source?: string
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          neighborhood?: string | null
          official_url?: string
          updated_at?: string
        }
        Relationships: []
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
      content_shares: {
        Row: {
          channel: string
          content_id: string
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          channel: string
          content_id: string
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          channel?: string
          content_id?: string
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      cultural_comments: {
        Row: {
          body: string
          created_at: string
          external_id: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          external_id: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          external_id?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultural_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_entries: {
        Row: {
          consumed: boolean
          creator: string | null
          dismissed: boolean
          external_id: string
          favorite: boolean
          id: string
          image_url: string | null
          media_type: string
          queued: boolean
          review: string
          score_10: number | null
          source: string
          title: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          consumed?: boolean
          creator?: string | null
          dismissed?: boolean
          external_id: string
          favorite?: boolean
          id?: string
          image_url?: string | null
          media_type: string
          queued?: boolean
          review?: string
          score_10?: number | null
          source: string
          title: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          consumed?: boolean
          creator?: string | null
          dismissed?: boolean
          external_id?: string
          favorite?: boolean
          id?: string
          image_url?: string | null
          media_type?: string
          queued?: boolean
          review?: string
          score_10?: number | null
          source?: string
          title?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cultural_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cultural_events: {
        Row: {
          address: string | null
          cinema_section: string | null
          city: string
          community: boolean
          created_by: string | null
          currency: string
          description: string
          ends_at: string | null
          id: string
          image_credit: string | null
          image_url: string | null
          interest: string
          neighborhood: string | null
          price: number | null
          source_name: string
          source_url: string
          starts_at: string
          title: string
          updated_at: string
          venue: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          cinema_section?: string | null
          city: string
          community?: boolean
          created_by?: string | null
          currency?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_credit?: string | null
          image_url?: string | null
          interest: string
          neighborhood?: string | null
          price?: number | null
          source_name: string
          source_url: string
          starts_at: string
          title: string
          updated_at?: string
          venue: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          cinema_section?: string | null
          city?: string
          community?: boolean
          created_by?: string | null
          currency?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_credit?: string | null
          image_url?: string | null
          interest?: string
          neighborhood?: string | null
          price?: number | null
          source_name?: string
          source_url?: string
          starts_at?: string
          title?: string
          updated_at?: string
          venue?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cultural_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_cache: {
        Row: {
          expires_at: string
          key: string
          payload: Json
        }
        Insert: {
          expires_at: string
          key: string
          payload: Json
        }
        Update: {
          expires_at?: string
          key?: string
          payload?: Json
        }
        Relationships: []
      }
      culture_feed: {
        Row: {
          category: string
          event_id: string | null
          id: string
          image_url: string | null
          kind: string
          published_at: string
          result: Json | null
          source_name: string
          source_url: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          kind: string
          published_at?: string
          result?: Json | null
          source_name: string
          source_url: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          published_at?: string
          result?: Json | null
          source_name?: string
          source_url?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_feed_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cultural_events"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_feed_comments: {
        Row: {
          body: string
          created_at: string
          feed_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          feed_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          feed_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_feed_comments_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "culture_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culture_feed_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_feed_likes: {
        Row: {
          feed_id: string
          user_id: string
        }
        Insert: {
          feed_id: string
          user_id: string
        }
        Update: {
          feed_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "culture_feed_likes_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "culture_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culture_feed_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_jobs: {
        Row: {
          key: string
          last_completed_at: string | null
          lease_until: string
          paused_reason: string | null
          run_id: string | null
        }
        Insert: {
          key: string
          last_completed_at?: string | null
          lease_until?: string
          paused_reason?: string | null
          run_id?: string | null
        }
        Update: {
          key?: string
          last_completed_at?: string | null
          lease_until?: string
          paused_reason?: string | null
          run_id?: string | null
        }
        Relationships: []
      }
      culture_updates: {
        Row: {
          key: string
          message: string | null
          updated_at: string
        }
        Insert: {
          key: string
          message?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          shared_card: Json | null
          shared_title: string | null
          shared_url: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          shared_card?: Json | null
          shared_title?: string | null
          shared_url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          shared_card?: Json | null
          shared_title?: string | null
          shared_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          event_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cultural_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reports: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cultural_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      movie_comments: {
        Row: {
          body: string
          created_at: string
          external_id: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          external_id: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          external_id?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_entries: {
        Row: {
          dismissed: boolean
          external_id: string
          favorite: boolean
          genres: string[]
          id: string
          image_url: string | null
          queued: boolean
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
          dismissed?: boolean
          external_id: string
          favorite?: boolean
          genres?: string[]
          id?: string
          image_url?: string | null
          queued?: boolean
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
          dismissed?: boolean
          external_id?: string
          favorite?: boolean
          genres?: string[]
          id?: string
          image_url?: string | null
          queued?: boolean
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
      movie_soundtracks: {
        Row: {
          artist: string | null
          confidence: string
          created_at: string
          external_id: string
          hidden: boolean
          id: string
          image_url: string | null
          kind: string
          movie_id: string
          movie_poster: string | null
          movie_title: string
          source: string
          source_url: string | null
          submitted_by: string | null
          title: string
          year: number | null
        }
        Insert: {
          artist?: string | null
          confidence?: string
          created_at?: string
          external_id: string
          hidden?: boolean
          id?: string
          image_url?: string | null
          kind: string
          movie_id: string
          movie_poster?: string | null
          movie_title: string
          source: string
          source_url?: string | null
          submitted_by?: string | null
          title: string
          year?: number | null
        }
        Update: {
          artist?: string | null
          confidence?: string
          created_at?: string
          external_id?: string
          hidden?: boolean
          id?: string
          image_url?: string | null
          kind?: string
          movie_id?: string
          movie_poster?: string | null
          movie_title?: string
          source?: string
          source_url?: string | null
          submitted_by?: string | null
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          city: string
          city_configured: boolean
          created_at: string
          cultural_top_five: Json
          display_name: string
          event_interests: string[]
          id: string
          rating_style: string
          share_visibility: string
          top_five: Json
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          city?: string
          city_configured?: boolean
          created_at?: string
          cultural_top_five?: Json
          display_name?: string
          event_interests?: string[]
          id: string
          rating_style?: string
          share_visibility?: string
          top_five?: Json
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          city?: string
          city_configured?: boolean
          created_at?: string
          cultural_top_five?: Json
          display_name?: string
          event_interests?: string[]
          id?: string
          rating_style?: string
          share_visibility?: string
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
      share_referrals: {
        Row: {
          created_at: string
          invited_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string
          user_id?: string
        }
        Relationships: []
      }
      similar_recommendations: {
        Row: {
          cache_key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          cache_key: string
          payload: Json
          updated_at?: string
        }
        Update: {
          cache_key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
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
      soundtrack_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          soundtrack_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          soundtrack_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          soundtrack_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soundtrack_reports_soundtrack_id_fkey"
            columns: ["soundtrack_id"]
            isOneToOne: false
            referencedRelation: "movie_soundtracks"
            referencedColumns: ["id"]
          },
        ]
      }
      soundtrack_updates: {
        Row: {
          movie_id: string
          updated_at: string
        }
        Insert: {
          movie_id: string
          updated_at?: string
        }
        Update: {
          movie_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          read_at: string | null
          target_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          target_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          target_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
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
      acquire_culture_job: { Args: { job_key: string }; Returns: boolean }
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
      public_share_summary: { Args: { cid: string; k: string }; Returns: Json }
      share_access: {
        Args: { cid: string; k: string; viewer: string }
        Returns: boolean
      }
      shared_betty_results: { Args: { hid: string }; Returns: Json }
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
