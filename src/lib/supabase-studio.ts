import { createClient } from "@supabase/supabase-js";
import { type StudioData } from "@/data/site";

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

  return {
    ok: true,
    data: row.content as StudioData,
    updatedAt: String(row.updated_at ?? updatedAt),
  };
}

export async function uploadStudioImage(file: File, folder: string) {
  if (!supabase) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("Ana Styling could not upload image to Supabase Storage.", error);
    return null;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}
