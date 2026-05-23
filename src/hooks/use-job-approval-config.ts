import { useEffect, useState } from "react";
import { getJobApprovalConfig } from "@/lib/settings";

export const useJobApprovalConfig = () => {
  const [required, setRequired] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    const config = await getJobApprovalConfig();
    setRequired(config.required);
    setIsLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return {
    required,
    isLoading,
    refresh,
    setRequired,
  };
};
