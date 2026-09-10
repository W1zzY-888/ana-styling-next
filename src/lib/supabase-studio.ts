import { createClient } from "@supabase/supabase-js";
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

  if (!remote || JSON.stringify(remote.data) !== JSON.stringify(data)) {
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

export async function uploadReviewPhoto(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (file.size > 5 * 1024 * 1024 || !allowedTypes.includes(file.type)) return null;
  return uploadImageToBucket(file, "reviews", "ana-styling-reviews");
}

export async function submitReview(review: { name: string; text: string; photoUrl?: string }) {
  if (!supabase) return { ok: false, message: "Review submission is not configured yet." };

  const { error } = await supabase
    .from("studio_reviews")
    .insert({
      studio_id: studioId,
      name: review.name,
      review_text: review.text,
      photo_url: review.photoUrl || null,
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
    .select("id, name, review_text, photo_url, published, created_at")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ana Styling could not load submitted reviews.", error);
    return [];
  }

  return (data ?? []).map((item, index): Review => ({
    id: String(item.id),
    name: String(item.name ?? ""),
    text: { en: String(item.review_text ?? ""), ru: String(item.review_text ?? "") },
    photo: item.photo_url ? String(item.photo_url) : undefined,
    order: index + 1,
    published: Boolean(item.published),
    createdAt: String(item.created_at ?? ""),
  }));
}

export async function updateSubmittedReview(id: string, patch: { name?: string; text?: string; photo?: string; published?: boolean }) {
  if (!supabase) return false;

  const { error } = await supabase
    .from("studio_reviews")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.text !== undefined ? { review_text: patch.text } : {}),
      ...(patch.photo !== undefined ? { photo_url: patch.photo || null } : {}),
      ...(patch.published !== undefined ? { published: patch.published } : {}),
    })
    .eq("studio_id", studioId)
    .eq("id", id);

  if (error) {
    console.error("Ana Styling could not update submitted review.", error);
    return false;
  }

  return true;
}

export async function deleteSubmittedReview(id: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .from("studio_reviews")
    .delete()
    .eq("studio_id", studioId)
    .eq("id", id);

  if (error) {
    console.error("Ana Styling could not delete submitted review.", error);
    return false;
  }

  return true;
}
