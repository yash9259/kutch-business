import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

const StatCard = ({ label, value, icon: Icon }: StatCardProps) => (
  <div className="bg-card p-5 rounded-xl shadow-card flex items-center gap-4">
    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
      <Icon className="h-5 w-5 text-accent-foreground" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default StatCard;
