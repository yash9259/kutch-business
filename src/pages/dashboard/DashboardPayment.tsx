import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Upload, QrCode, Copy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDefaultPlan, submitPaymentProof, type PaymentPlan } from "@/lib/candidateDashboard";

const UPI_ID = "anandgor420-1@oksbi";
const UPI_PAYEE_NAME = "Anand Gor";

const PLAN_FEATURES = [
  "Apply to unlimited job listings",
  "Full profile visibility to employers",
  "Access to all job categories",
  "Priority application handling",
  "1 year of platform access",
];

const DashboardPayment = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const displayAmount = plan?.amount ?? 200;
  const upiPaymentLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${displayAmount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiPaymentLink)}`;

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setPlan(await getDefaultPlan());
      } catch {
        // ignore – plan details are also hardcoded below
      }
    };
    void loadPlan();
  }, []);

  const copyUpi = () => {
    void navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  const submitProof = async () => {
    if (!utrNumber.trim()) {
      toast.error("Please enter the UTR number");
      return;
    }
    if (!paymentScreenshot) {
      toast.error("Please upload the payment screenshot");
      return;
    }
    if (!user?.id) {
      toast.error("Please login first");
      return;
    }
    if (!plan) {
      toast.error("Plan details not loaded. Please refresh and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitPaymentProof(user.id, plan.id, plan.amount, utrNumber, paymentScreenshot);
      toast.success("Payment proof submitted! Admin will verify shortly.");
      setUtrNumber("");
      setPaymentScreenshot(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit payment proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold text-foreground mb-1">Activate Your Account</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pay once and get full access for a year
      </p>

      {/* Plan card */}
      <div className="bg-card rounded-xl shadow-card p-6 mb-6 ring-2 ring-primary">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Candidate Access Plan</h3>
            <p className="text-xs text-muted-foreground">Full platform access</p>
          </div>
        </div>
        <div className="mb-4">
          <span className="text-3xl font-bold text-foreground tabular-nums">₹200</span>
          <span className="text-sm text-muted-foreground ml-1">/ year</span>
        </div>
        <ul className="space-y-2">
          {PLAN_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment section */}
      <div className="bg-card rounded-xl shadow-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <QrCode className="h-4 w-4" /> Pay via UPI
        </h3>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={qrCodeUrl}
              alt="UPI QR code for payment"
              className="w-40 h-40 rounded-xl border border-border bg-white p-2"
            />
            <p className="text-xs text-muted-foreground">Scan to pay ₹{displayAmount}</p>
          </div>

          {/* UPI ID */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payee Name</p>
              <div className="p-3 rounded-lg bg-muted border border-border mb-3">
                <span className="text-sm font-medium text-foreground">{UPI_PAYEE_NAME}</span>
              </div>

              <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                <span className="flex-1 text-sm font-mono font-medium text-foreground select-all">
                  {UPI_ID}
                </span>
                <button
                  type="button"
                  onClick={copyUpi}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Copy UPI ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-medium mb-1">How to pay:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                <li>Send ₹{displayAmount} to the UPI ID above</li>
                <li>Save the UTR / transaction number</li>
                <li>Submit proof below for admin verification</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Proof */}
      <div className="bg-card rounded-xl shadow-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Submit Payment Proof</h3>
        <p className="text-xs text-muted-foreground mb-4">
          After paying, enter your UTR number and upload the screenshot for admin verification.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Plan</Label>
            <Input
              value="Candidate Access Plan – ₹200 / year"
              readOnly
              className="mt-1.5 h-11 bg-muted"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">UTR / Transaction Reference Number *</Label>
            <Input
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="mt-1.5 h-11"
              placeholder="Enter UTR number from your UPI app"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Payment Screenshot *</Label>
            <label className="mt-1.5 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-5 bg-surface cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {paymentScreenshot ? paymentScreenshot.name : "Upload screenshot or payment receipt"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={submitProof} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Proof"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPayment;
