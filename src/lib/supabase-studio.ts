import { createClient } from "@supabase/supabase-js";
import { validateReviewPhoto } from "@/lib/review-photo";
import { jsonEqual } from "@/lib/json-equal";
import { type Review, type StudioData } from "@/data/site";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const studioId = process.env.NEXT_PUBLIC_STUDIO_ID || "ana-styling";
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "ana-styling-media";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

export type RemoteStudioData = {
  data: StudioData;
  updatedAt: string;
};

export type StudioSaveResult =
  | { ok: true; data: StudioData; updatedAt: string }
  | { ok: false; message: string };

export async function getAdminSession() {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function isCurrentUserStudioAdmin() {
  if (!supabase) return false;

  const session = await getAdminSession();
  if (!session) return false;

  const { data, error } = await supabase
    .from("studio_admins")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Ana Styling could not verify studio admin access.", error);
    return false;
  }

  return Boolean(data);
}

export async function signInAdmin(email: string, password: string) {
  if (!supabase) return { ok: false, message: "Supabase is not configured yet." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: "Wrong email or password. Please try again." };
  }

  const isAdmin = await isCurrentUserStudioAdmin();

  if (!isAdmin) {
    await signOutAdmin();
    return { ok: false, message: "This account does not have studio access." };
  }

  return { ok: true, message: "" };
}

export async function signOutAdmin() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function loadStudioDataFromSupabase() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("studio_sites")
    .select("id, content, updated_at")
    .eq("id", studioId)
    .maybeSingle();

  if (error) {
    console.error("Ana Styling could not load Supabase studio data.", error);
    return null;
  }

  if (!data || data.id !== studioId || !data.content) return null;

  return {
    data: data.content as StudioData,
    updatedAt: String(data.updated_at ?? ""),
  } satisfies RemoteStudioData;
}

export async function saveStudioDataToSupabase(data: StudioData): Promise<StudioSaveResult> {
  const updatedAt = new Date().toISOString();

  if (!supabase) return { ok: true, data, updatedAt };

  const { data: row, error } = await supabase
    .from("studio_sites")
    .upsert({
      id: studioId,
      content: data,
      updated_at: updatedAt,
    }, { onConflict: "id" })
    .select("id, content, updated_at")
    .eq("id", studioId)
    .single();

  if (error) {
    console.error("Ana Styling could not save Supabase studio data.", error);
    return { ok: false, message: "Couldn’t save — Retry" };
  }

  if (!row || row.id !== studioId || !row.content) {
    console.error("Ana Styling save verification failed.", row);
    return { ok: false, message: "Couldn’t save — Retry" };
  }

  const remote = await loadStudioDataFromSupabase();

  if (!remote || !jsonEqual(remote.data, data)) {
    console.error("Ana Styling remote content did not match the saved draft.", remote);
    return { ok: false, message: "Couldn’t save — Retry" };
  }

  return {
    ok: true,
    data: remote.data,
    updatedAt: remote.updatedAt || String(row.updated_at ?? updatedAt),
  };
}

export async function uploadStudioImage(file: File, folder: string) {
  return uploadImageToBucket(file, folder, bucketName);
}

async function uploadImageToBucket(file: File, folder: string, targetBucket: string) {
  if (!supabase) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(targetBucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("Ana Styling could not upload image to Supabase Storage.", error);
    return null;
  }

  const { data } = supabase.storage.from(targetBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function submitReview(review: { name: string; text: string; rating: number; photo?: File }): Promise<{ ok: boolean; message: string; photoError?: "format" | "size" | "upload" }> {
  if (!supabase) return { ok: false, message: "Review submission is not configured yet." };
  if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
    return { ok: false, message: "Please select a rating from 1 to 5." };
  }

  const id = crypto.randomUUID();
  let photoUrl: string | null = null;
  if (review.photo) {
    const invalid = validateReviewPhoto(review.photo);
    if (invalid) return { ok: false, message: "Invalid photo.", photoError: invalid };
    try {
      photoUrl = await uploadStudioImage(review.photo, `reviews/${id}`);
    } catch {
      return { ok: false, message: "Photo upload failed.", photoError: "upload" };
    }
    if (!photoUrl) return { ok: false, message: "Photo upload failed.", photoError: "upload" };
  }

  const { error } = await supabase
    .from("studio_reviews")
    .insert({
      id,
      photo_url: photoUrl,
      studio_id: studioId,
      name: review.name,
      review_text: review.text,
      rating: review.rating,
      published: false,
    });

  if (error) {
    console.error("Ana Styling could not submit review.", error);
    return { ok: false, message: "Couldn’t send review. Please try again." };
  }

  return { ok: true, message: "Thank you. Your review was sent for approval." };
}

export async function loadSubmittedReviews() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("studio_reviews")
    .select("id, name, review_text, rating, photo_url, published, created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ana Styling could not load submitted reviews.", error);
    return [];
  }

  return (data ?? []).map((item, index): Review => ({
    id: String(item.id),
    name: String(item.name ?? ""),
    photoUrl: typeof item.photo_url === "string" ? item.photo_url : "",
    text: { en: String(item.review_text ?? ""), ru: String(item.review_text ?? "") },
    rating: Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5 ? item.rating : null,
    order: index + 1,
    published: Boolean(item.published),
    createdAt: String(item.created_at ?? ""),
  }));
}

export async function updateSubmittedReview(id: string, patch: { name?: string; text?: string; published?: boolean; photoUrl?: string }) {
  if (!supabase) return false;

  const { data: updated, error } = await supabase
    .from("studio_reviews")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.text !== undefined ? { review_text: patch.text } : {}),
      ...(patch.photoUrl !== undefined ? { photo_url: patch.photoUrl || null } : {}),
      ...(patch.published !== undefined ? { published: patch.published } : {}),
    })
    .eq("studio_id", studioId)
    .eq("id", id)
    .select("id, photo_url")
    .single();

  if (error) {
    console.error("Ana Styling could not update submitted review.", error);
    return false;
  }

  return updated?.id === id && (patch.photoUrl === undefined || (updated.photo_url ?? "") === patch.photoUrl);
}

export async function deleteSubmittedReview(id: string) {
  if (!supabase) return false;

  const { data: deleted, error } = await supabase
    .from("studio_reviews")
    .delete()
    .eq("studio_id", studioId)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    console.error("Ana Styling could not delete submitted review.", error);
    return false;
  }

  return deleted?.id === id;
}
