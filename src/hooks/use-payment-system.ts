import { useEffect, useState } from "react";
import { getPaymentSystemEnabled } from "@/lib/paymentSystem";

export const usePaymentSystem = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    setIsEnabled(await getPaymentSystemEnabled());
    setIsLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  return {
    isEnabled,
    isLoading,
    refresh,
  };
};
