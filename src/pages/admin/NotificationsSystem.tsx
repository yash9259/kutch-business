import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAdminNotification, listAdminNotifications, type AdminNotificationItem } from "@/lib/employerJobs";

const NotificationsSystem = () => {
  const [type, setType] = useState("Job Alert");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<AdminNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setHistory(await listAdminNotifications());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const send = async () => {
    if (!title || !message) {
      toast.error("Please enter title and message");
      return;
    }

    try {
      await createAdminNotification({ type, title, message });
      toast.success(`${type} sent successfully`);
      setTitle("");
      setMessage("");
      void loadNotifications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send notification");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications System</h1>
        <p className="text-sm text-muted-foreground">Send job alerts and announcements</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Job Alert">Job Alert</SelectItem>
                  <SelectItem value="Announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea className="mt-1.5" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button onClick={send}>Send Notification</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                No notifications found.
              </div>
            ) : history.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3 text-sm space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{item.title}</p>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.type.replace(/_/g, " ")}</span>
                </div>
                <p className="whitespace-pre-line text-muted-foreground">{item.body}</p>
                <p className="text-xs text-muted-foreground">Sent: {item.createdAt}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default NotificationsSystem;
