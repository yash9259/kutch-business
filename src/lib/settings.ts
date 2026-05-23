import { supabase } from "@/lib/supabase";

export interface JobApprovalConfig {
  required: boolean;
}

export const getJobApprovalConfig = async (): Promise<JobApprovalConfig> => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "job_approval_config")
      .maybeSingle();

    if (error) {
      console.error("Error fetching job approval config:", error);
      return { required: true };
    }

    if (data && data.setting_value) {
      // Handle potential type variance gracefully
      const val = data.setting_value as any;
      return {
        required: val.required !== false,
      };
    }
  } catch (error) {
    console.error("Exception fetching job approval config:", error);
  }
  return { required: true }; // secure default fallback
};

export const setJobApprovalConfig = async (required: boolean): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("site_settings")
    .upsert({
      setting_key: "job_approval_config",
      setting_value: { required },
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(error.message);
  }
};
