import { supabase } from "@/lib/supabase";

export const getPaymentSystemEnabled = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    // Fail-open to avoid blocking applications if settings cannot be fetched.
    return true;
  }

  return Boolean(data);
};

export const setPaymentSystemEnabled = async (enabled: boolean) => {
  const { data: plans, error: loadError } = await supabase
    .from("subscription_plans")
    .select("id");

  if (loadError) {
    throw new Error(loadError.message);
  }

  const planIds = (plans || []).map((plan) => plan.id);
  if (planIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: enabled })
    .in("id", planIds);

  if (error) {
    throw new Error(error.message);
  }
};
