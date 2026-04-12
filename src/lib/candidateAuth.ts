import { supabase } from "@/lib/supabase";

export type UserRole = "candidate" | "admin";

export interface CandidateProfile {
  fullName: string;
  gender: string;
  dob: string;
  maritalStatus: string;
  languages: string;
  mobile: string;
  fatherMobile: string;
  presentAddress: string;
  permanentAddress: string;
  highestEducation: string;
  lastCompany: string;
  currentDesignation: string;
  totalExperience: string;
  lastSalary: string;
  expectedSalary: string;
  jobInterests: string[];
  familyRefName: string;
  familyRefContact: string;
  friendRefName: string;
  friendRefContact: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  profile: CandidateProfile;
  resumeFile?: File | null;
  signatureFile?: File | null;
  termsAcceptedAt: string;
}

export interface AuthResult {
  token: string;
  role: UserRole;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  requiresEmailConfirmation?: boolean;
}

type AppUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

type StoredRegisterPayload = Omit<RegisterPayload, "resumeFile" | "signatureFile">;

const SESSION_KEY = "lcc_admin_session_v1";
const PENDING_REGISTRATION_KEY = "lcc_pending_candidate_registration_v1";
const ADMIN_EMAIL = "admin@kutchhbusiness.com";
const ADMIN_PASSWORD = "admin123";

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    if (!value) {
      return fallback;
    }
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getFileExtension = (fileName: string) => {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.pop()?.toLowerCase() || "bin" : "bin";
};

const getPendingRegistrations = () =>
  safeRead<Record<string, StoredRegisterPayload>>(PENDING_REGISTRATION_KEY, {});

const setPendingRegistrations = (value: Record<string, StoredRegisterPayload>) => {
  safeWrite(PENDING_REGISTRATION_KEY, value);
};

const savePendingRegistration = (payload: RegisterPayload) => {
  const registrations = getPendingRegistrations();
  registrations[normalizeEmail(payload.email)] = {
    email: payload.email,
    password: payload.password,
    profile: payload.profile,
    termsAcceptedAt: payload.termsAcceptedAt,
  };
  setPendingRegistrations(registrations);
};

const clearPendingRegistration = (email: string) => {
  const registrations = getPendingRegistrations();
  delete registrations[normalizeEmail(email)];
  setPendingRegistrations(registrations);
};

const getPendingRegistration = (email: string) =>
  getPendingRegistrations()[normalizeEmail(email)] || null;

const mapSupabaseError = (message: string) => {
  const lowered = message.toLowerCase();
  if (lowered.includes("invalid login credentials")) {
    return "Invalid email or password";
  }
  if (lowered.includes("email not confirmed")) {
    return "Please verify your email before logging in";
  }
  if (lowered.includes("user already registered")) {
    return "An account with this email already exists";
  }
  return message;
};

const mapAdminSupabaseError = (message: string) => {
  const lowered = message.toLowerCase();
  if (lowered.includes("email not confirmed")) {
    return "Admin account exists but email is not confirmed. Please confirm once in Supabase Auth > Users.";
  }
  return mapSupabaseError(message);
};

const mapProfileToUser = (
  profile: { id: string; email: string; full_name: string | null; role: string | null },
  fallbackFullName = "Candidate",
): AppUser => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name || fallbackFullName,
  role: profile.role === "admin" ? "admin" : "candidate",
});

const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const upsertCandidateProfile = async (userId: string, payload: RegisterPayload) => {
  const candidateProfileValues = {
    user_id: userId,
    gender: payload.profile.gender || null,
    dob: payload.profile.dob || null,
    marital_status: payload.profile.maritalStatus || null,
    languages: payload.profile.languages || null,
    father_mobile: payload.profile.fatherMobile || null,
    present_address: payload.profile.presentAddress || null,
    permanent_address: payload.profile.permanentAddress || null,
    highest_education: payload.profile.highestEducation || null,
    current_designation: payload.profile.currentDesignation || null,
    total_experience: payload.profile.totalExperience || null,
    last_salary: payload.profile.lastSalary ? Number.parseFloat(payload.profile.lastSalary.replace(/[^\d.]/g, "")) || null : null,
    expected_salary: payload.profile.expectedSalary ? Number.parseFloat(payload.profile.expectedSalary.replace(/[^\d.]/g, "")) || null : null,
    declaration_accepted: true,
    terms_accepted_at: payload.termsAcceptedAt,
  };

  const { error } = await supabase.from("candidate_profiles").upsert(candidateProfileValues, {
    onConflict: "user_id",
  });

  if (!error) {
    return;
  }

  if (!error.message.toLowerCase().includes("terms_accepted_at")) {
    throw new Error(error.message);
  }

  const { terms_accepted_at: _ignored, ...fallbackValues } = candidateProfileValues;
  const { error: fallbackError } = await supabase
    .from("candidate_profiles")
    .upsert(fallbackValues, { onConflict: "user_id" });

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }
};
const uploadRegistrationAssets = async (
  userId: string,
  files: Pick<RegisterPayload, "resumeFile" | "signatureFile">,
) => {
  const uploads: Promise<unknown>[] = [];

  if (files.resumeFile) {
    const resumePath = `${userId}/${Date.now()}-resume.${getFileExtension(files.resumeFile.name)}`;
    uploads.push(
      supabase.storage
        .from("candidate-resumes")
        .upload(resumePath, files.resumeFile, {
          contentType: files.resumeFile.type || "application/octet-stream",
          upsert: true,
        })
        .then(({ error }) => {
          if (error) {
            throw new Error(error.message);
          }

          return supabase.from("candidate_documents").insert({
            candidate_id: userId,
            document_type: "resume",
            file_name: files.resumeFile?.name || "resume",
            file_path: resumePath,
            mime_type: files.resumeFile?.type || "application/octet-stream",
            file_size_bytes: files.resumeFile?.size || null,
            is_active: true,
          });
        })
        .then(({ error }) => {
          if (error) {
            throw new Error(error.message);
          }
        }),
    );
  }

  if (files.signatureFile) {
    const signaturePath = `${userId}/${Date.now()}-signature.${getFileExtension(files.signatureFile.name)}`;
    uploads.push(
      supabase.storage
        .from("candidate-consent")
        .upload(signaturePath, files.signatureFile, {
          contentType: files.signatureFile.type || "application/octet-stream",
          upsert: true,
        })
        .then(({ error }) => {
          if (error) {
            throw new Error(error.message);
          }

          return Promise.all([
            supabase.from("candidate_profiles").upsert(
              {
                user_id: userId,
                signature_file_path: signaturePath,
              },
              { onConflict: "user_id" },
            ),
            supabase.from("candidate_documents").insert({
              candidate_id: userId,
              document_type: "signature",
              file_name: files.signatureFile?.name || "signature",
              file_path: signaturePath,
              mime_type: files.signatureFile?.type || "application/octet-stream",
              file_size_bytes: files.signatureFile?.size || null,
            }),
          ]);
        })
        .then((results) => {
          results.forEach((result) => {
            if (result.error) {
              throw new Error(result.error.message);
            }
          });
        }),
    );
  }

  await Promise.all(uploads);
};

const persistCandidateRegistration = async (userId: string, payload: RegisterPayload) => {
  const normalizedEmail = normalizeEmail(payload.email);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: "candidate",
      email: normalizedEmail,
      full_name: payload.profile.fullName,
      mobile: payload.profile.mobile,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  await upsertCandidateProfile(userId, payload);

  const { error: deleteInterestsError } = await supabase
    .from("candidate_job_interests")
    .delete()
    .eq("candidate_id", userId);

  if (deleteInterestsError) {
    throw new Error(deleteInterestsError.message);
  }

  if (payload.profile.jobInterests.length > 0) {
    const { error: interestsError } = await supabase.from("candidate_job_interests").insert(
      payload.profile.jobInterests.map((interest) => ({
        candidate_id: userId,
        interest,
      })),
    );

    if (interestsError) {
      throw new Error(interestsError.message);
    }
  }

  const { error: deleteReferencesError } = await supabase
    .from("candidate_references")
    .delete()
    .eq("candidate_id", userId);

  if (deleteReferencesError) {
    throw new Error(deleteReferencesError.message);
  }

  const referenceRows = [
    payload.profile.familyRefName && payload.profile.familyRefContact
      ? {
          candidate_id: userId,
          reference_kind: "family",
          full_name: payload.profile.familyRefName,
          contact_number: payload.profile.familyRefContact,
        }
      : null,
    payload.profile.friendRefName && payload.profile.friendRefContact
      ? {
          candidate_id: userId,
          reference_kind: "friend",
          full_name: payload.profile.friendRefName,
          contact_number: payload.profile.friendRefContact,
        }
      : null,
  ].filter(Boolean);

  if (referenceRows.length > 0) {
    const { error: referencesError } = await supabase
      .from("candidate_references")
      .insert(referenceRows);

    if (referencesError) {
      throw new Error(referencesError.message);
    }
  }

  clearPendingRegistration(payload.email);
};

export const getSession = () => safeRead<AuthSession | null>(SESSION_KEY, null);

const clearAdminSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const registerCandidate = async (payload: RegisterPayload): Promise<AuthResult> => {
  const email = normalizeEmail(payload.email);
  if (!email || !payload.password) {
    throw new Error("Email and password are required");
  }

  savePendingRegistration({
    ...payload,
    email,
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.profile.fullName,
        role: "candidate",
      },
    },
  });

  if (error) {
    clearPendingRegistration(email);
    throw new Error(mapSupabaseError(error.message));
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Unable to create account");
  }

  if (data.session) {
    await persistCandidateRegistration(userId, payload);
    await uploadRegistrationAssets(userId, payload);
    const profile = await fetchProfile(userId);

    return {
      token: data.session.access_token,
      role: "candidate",
      user: {
        id: userId,
        email,
        fullName: profile.full_name || payload.profile.fullName,
      },
    };
  }

  return {
    token: "",
    role: "candidate",
    user: {
      id: userId,
      email,
      fullName: payload.profile.fullName,
    },
    requiresEmailConfirmation: true,
  };
};

export const loginUser = async (payload: LoginPayload): Promise<AuthResult> => {
  const email = normalizeEmail(payload.email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) {
    if (email === ADMIN_EMAIL) {
      throw new Error(mapAdminSupabaseError(error.message));
    }
    throw new Error(mapSupabaseError(error.message));
  }

  if (!data.user || !data.session) {
    throw new Error("Unable to start session");
  }

  const pendingRegistration = getPendingRegistration(email);
  if (pendingRegistration) {
    await persistCandidateRegistration(data.user.id, pendingRegistration);
  }

  const profile = await fetchProfile(data.user.id);
  const mappedUser = mapProfileToUser(profile, data.user.user_metadata.full_name as string | undefined);

  if (email === ADMIN_EMAIL && mappedUser.role !== "admin") {
    throw new Error("Admin email logged in but profile role is not admin. Set role='admin' in profiles table.");
  }

  return {
    token: data.session.access_token,
    role: mappedUser.role,
    user: {
      id: mappedUser.id,
      email: mappedUser.email,
      fullName: mappedUser.fullName,
    },
  };
};

export const getLoggedInUser = async (): Promise<AppUser | null> => {
  const adminSession = getSession();
  if (adminSession?.role === "admin") {
    // Legacy local-only admin session is incompatible with RLS-protected live data.
    clearAdminSession();
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  try {
    const profile = await fetchProfile(data.user.id);
    return mapProfileToUser(profile, data.user.user_metadata.full_name as string | undefined);
  } catch {
    return null;
  }
};

export const logoutUser = async () => {
  clearAdminSession();
  await supabase.auth.signOut();
};

export const getCandidateCount = async () => {
  const { count } = await supabase
    .from("candidate_profiles")
    .select("user_id", { count: "exact", head: true });

  return count ?? 0;
};
