import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Check, FileText, Mail, X } from "lucide-react";
import { sendCandidateInvoiceEmail } from "@/lib/employerJobs";

interface PaymentRow {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  planName: string;
  amount: number;
  createdAt: string;
  status: string;
}

const formatAmount = (amount: number) => `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;
const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-IN");
};

const getInvoiceNo = (paymentId: string) => `INV-${paymentId.slice(0, 8).toUpperCase()}`;
const normalizeEmail = (value: string | null | undefined) => (value || "").trim().toLowerCase();

const statusBadge = (status: string) => {
  if (status === "verified") return "secondary" as const;
  if (status === "rejected") return "destructive" as const;
  return "outline" as const;
};

const PaymentsManagement = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const { data: paymentRows, error: paymentError } = await supabase
          .from("candidate_payments")
          .select("id, candidate_id, plan_id, amount, status, created_at")
          .order("created_at", { ascending: false });

        if (paymentError) throw paymentError;

        const candidateIds = Array.from(new Set((paymentRows || []).map((row) => row.candidate_id)));
        const planIds = Array.from(new Set((paymentRows || []).map((row) => row.plan_id)));

        const [{ data: profiles, error: profileError }, { data: plans, error: planError }] = await Promise.all([
          candidateIds.length > 0
            ? supabase.from("profiles").select("id, full_name, email").in("id", candidateIds)
            : Promise.resolve({ data: [], error: null }),
          planIds.length > 0
            ? supabase.from("subscription_plans").select("id, name").in("id", planIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profileError) throw profileError;
        if (planError) throw planError;

        const profileById = new Map((profiles || []).map((row) => [
          row.id,
          {
            fullName: row.full_name || "Unknown",
            email: row.email || "",
          },
        ]));
        const planById = new Map((plans || []).map((row) => [row.id, row.name || "Plan"]));

        setPayments(
          (paymentRows || []).map((row) => ({
            id: row.id,
            candidateId: row.candidate_id,
            candidateName: profileById.get(row.candidate_id)?.fullName || "Unknown",
            candidateEmail: profileById.get(row.candidate_id)?.email || "",
            planName: planById.get(row.plan_id) || "Plan",
            amount: Number(row.amount || 0),
            createdAt: row.created_at,
            status: row.status,
          })),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load payments");
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, []);

  const invoices = useMemo(
    () =>
      payments.map((row) => ({
        invoiceNo: getInvoiceNo(row.id),
        amount: formatAmount(row.amount),
        generatedAt: formatDate(row.createdAt),
        paymentId: row.id,
      })),
    [payments],
  );

  const sendInvoiceMail = async (
    row: PaymentRow,
    options?: { silentSuccess?: boolean },
  ) => {
    const candidateEmail = normalizeEmail(row.candidateEmail);
    if (!candidateEmail) {
      toast.error("Candidate registered email not found for this payment.");
      return;
    }

    try {
      setEmailSendingId(row.id);
      await sendCandidateInvoiceEmail({
        candidateId: row.candidateId,
        candidateEmail,
        candidateName: row.candidateName,
        invoiceNo: getInvoiceNo(row.id),
        paymentId: row.id,
        amount: formatAmount(row.amount),
        planName: row.planName,
        paidAt: formatDate(row.createdAt),
        status: row.status,
      });

      if (!options?.silentSuccess) {
        toast.success("Invoice email sent successfully.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invoice email");
    } finally {
      setEmailSendingId(null);
    }
  };

  const updatePaymentStatus = async (row: PaymentRow, nextStatus: "verified" | "rejected") => {
    try {
      setStatusUpdatingId(row.id);
      const { error } = await supabase
        .from("candidate_payments")
        .update({ status: nextStatus })
        .eq("id", row.id);

      if (error) {
        throw error;
      }

      setPayments((prev) => prev.map((item) => (
        item.id === row.id ? { ...item, status: nextStatus } : item
      )));
      toast.success(`Payment ${nextStatus === "verified" ? "accepted" : "rejected"}.`);

      if (nextStatus === "verified") {
        await sendInvoiceMail({ ...row, status: nextStatus }, { silentSuccess: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update payment status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openInvoicePdf = (row: PaymentRow) => {
    const invoiceNo = getInvoiceNo(row.id);
    const issuedAt = formatDate(row.createdAt);
    const invoiceHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${invoiceNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #1f2937; }
            .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; max-width: 780px; }
            h1 { margin: 0 0 12px; font-size: 22px; }
            .muted { color: #6b7280; margin: 0 0 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td { border: 1px solid #e5e7eb; padding: 10px; font-size: 14px; }
            .key { width: 220px; font-weight: 600; background: #f9fafb; }
          </style>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () {
                window.print();
              }, 300);
            });
          </script>
        </head>
        <body>
          <div class="card">
            <h1>Invoice ${invoiceNo}</h1>
            <p class="muted">kutch business</p>
            <p class="muted">Issued On: ${issuedAt}</p>
            <table>
              <tr><td class="key">Payment ID</td><td>${row.id}</td></tr>
              <tr><td class="key">Candidate Name</td><td>${row.candidateName}</td></tr>
              <tr><td class="key">Candidate Email</td><td>${row.candidateEmail || "-"}</td></tr>
              <tr><td class="key">Plan</td><td>${row.planName}</td></tr>
              <tr><td class="key">Amount</td><td>${formatAmount(row.amount)}</td></tr>
              <tr><td class="key">Payment Status</td><td>${row.status}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `;

    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      toast.error("Please allow popups to view invoice PDF");
      return;
    }

    popup.document.open();
    popup.document.write(invoiceHtml);
    popup.document.close();
    popup.focus();
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payments Management</h1>
          <p className="text-sm text-muted-foreground">Payment history and invoices for candidate plans</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[320px] rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments Management</h1>
        <p className="text-sm text-muted-foreground">Payment history and invoices for candidate plans</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments yet.</p> : payments.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{row.candidateName}</p>
                  <Badge variant={statusBadge(row.status)}>{row.status}</Badge>
                </div>
                <p className="text-muted-foreground">{row.planName} • {formatAmount(row.amount)}</p>
                {row.candidateEmail && <p className="text-xs text-muted-foreground mt-1">{row.candidateEmail}</p>}
                {!row.candidateEmail && <p className="text-xs text-destructive mt-1">Registered email missing</p>}
                <p className="text-xs text-muted-foreground mt-1">Payment ID: {row.id} • {formatDate(row.createdAt)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInvoicePdf(row)}
                    className="gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> Invoice PDF
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={emailSendingId === row.id}
                    onClick={() => void sendInvoiceMail(row)}
                    className="gap-1.5"
                  >
                    <Mail className="h-4 w-4" /> {emailSendingId === row.id ? "Sending..." : "Send Invoice"}
                  </Button>

                  {row.status !== "verified" && (
                    <Button
                      size="sm"
                      disabled={statusUpdatingId === row.id}
                      onClick={() => void updatePaymentStatus(row, "verified")}
                      className="gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                  )}

                  {row.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={statusUpdatingId === row.id}
                      onClick={() => void updatePaymentStatus(row, "rejected")}
                      className="gap-1.5"
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices available.</p> : invoices.map((row) => (
              <div key={row.invoiceNo} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{row.invoiceNo}</p>
                <p className="text-muted-foreground">Amount: {row.amount}</p>
                <p className="text-xs text-muted-foreground mt-1">Generated: {row.generatedAt} • Ref: {row.paymentId}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PaymentsManagement;
