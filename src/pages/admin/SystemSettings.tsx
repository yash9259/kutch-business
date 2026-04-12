import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePaymentSystem } from "@/hooks/use-payment-system";
import { setPaymentSystemEnabled } from "@/lib/paymentSystem";

const SystemSettings = () => {
  const { isEnabled: isPaymentEnabled, isLoading, refresh } = usePaymentSystem();
  const [isSavingPaymentSetting, setIsSavingPaymentSetting] = useState(false);

  const handlePaymentToggle = async (nextValue: boolean) => {
    try {
      setIsSavingPaymentSetting(true);
      await setPaymentSystemEnabled(nextValue);
      await refresh();
      toast.success(`Payment system ${nextValue ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update payment setting");
    } finally {
      setIsSavingPaymentSetting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-muted-foreground">Admin profile, email settings, and website settings</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input className="mt-1.5" defaultValue="Platform Admin" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" defaultValue="suppoert@kutchbusiness.com" />
            </div>
            <Button onClick={() => toast.success("Admin profile saved")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>SMTP Host</Label>
              <Input className="mt-1.5" defaultValue="smtp.mailserver.com" />
            </div>
            <div>
              <Label>Sender Email</Label>
              <Input className="mt-1.5" defaultValue="suppoert@kutchbusiness.com" />
            </div>
            <Button onClick={() => toast.success("Email settings saved")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Enable Payment System</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When OFF: payment page is hidden and apply job works without payment.
                  </p>
                </div>
                <Switch
                  checked={isPaymentEnabled}
                  disabled={isLoading || isSavingPaymentSetting}
                  onCheckedChange={(checked) => void handlePaymentToggle(checked)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Current status: {isPaymentEnabled ? "ON" : "OFF"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Website Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Site Name</Label>
              <Input className="mt-1.5" defaultValue="kutchh business" />
            </div>
            <div>
              <Label>Support Contact</Label>
              <Input className="mt-1.5" defaultValue="8780254591" />
            </div>
            <Button onClick={() => toast.success("Website settings saved")}>Save</Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SystemSettings;
