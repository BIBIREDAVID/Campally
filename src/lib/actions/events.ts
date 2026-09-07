"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import type { EventCategory, EventStatus } from "@/types/domain";

export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  organiser?: string | null;
  contactPerson?: string | null;
  capacity?: number | null;
  rsvpEnabled: boolean;
  coverImageUrl?: string | null;
  facultyId?: string | null;
}

function requireEventsManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "events.manage")) return "You don't have permission to manage events.";
  return null;
}

function toRow(input: EventInput, status: EventStatus) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    start_at: input.startAt,
    end_at: input.endAt || null,
    location: input.location || null,
    organiser: input.organiser || null,
    contact_person: input.contactPerson || null,
    capacity: input.capacity ?? null,
    rsvp_enabled: input.rsvpEnabled,
    cover_image_url: input.coverImageUrl || null,
    faculty_id: input.facultyId || null,
    status,
  };
}

export async function createEventAction(input: EventInput, status: EventStatus) {
  const user = await getCurrentUser();
  const permError = requireEventsManage(user);
  if (permError) return { error: permError };

  if (!input.title.trim() || !input.description.trim()) {
    return { error: "Title and description are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ tenant_id: user!.profile.tenant_id, author_id: user!.profile.id, ...toRow(input, status) })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { success: true, id: data.id };
}

export async function updateEventAction(id: string, input: EventInput, status: EventStatus) {
  const user = await getCurrentUser();
  const permError = requireEventsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ last_edited_by: user!.profile.id, updated_at: new Date().toISOString(), ...toRow(input, status) })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function cancelEventAction(id: string) {
  const user = await getCurrentUser();
  const permError = requireEventsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled", last_edited_by: user!.profile.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { success: true };
}

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadEventCoverAction(formData: FormData) {
  const user = await getCurrentUser();
  const permError = requireEventsManage(user);
  if (permError) return { error: permError };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_COVER_BYTES) return { error: "Image is too large (max 5MB)." };
  if (!ALLOWED_COVER_TYPES.includes(file.type)) return { error: "Only JPG, PNG, or WebP images are supported." };

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("event-covers").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function rsvpToEventAction(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("capacity, rsvp_enabled, status")
    .eq("id", eventId)
    .single();

  if (!event || event.status !== "published") return { error: "This event isn't accepting RSVPs." };
  if (!event.rsvp_enabled) return { error: "RSVP isn't required for this event." };

  if (event.capacity != null) {
    const { count } = await supabase
      .from("event_rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);
    if ((count ?? 0) >= event.capacity) {
      return { error: "This event is full." };
    }
  }

  const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.profile.id });
  if (error) {
    if (error.code === "23505") return { error: "You've already RSVP'd to this event." };
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/");
  return { success: true };
}

export async function cancelRsvpAction(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.profile.id);

  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/");
  return { success: true };
}
