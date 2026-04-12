import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobFiltersProps {
  keyword: string;
  city: string;
  experience: string;
  category: string;
  onKeywordChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onExperienceChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

const cities = ["All Cities", "Mumbai", "Delhi", "Pune", "Bangalore", "Chennai", "Ahmedabad", "Hyderabad", "Kolkata"];
const experiences = ["Any Experience", "0-1 years", "1-3 years", "2-4 years", "3-5 years", "5+ years"];
const categories = ["All Categories", "Technology", "Healthcare", "Finance", "Marketing", "Sales", "Engineering", "Design", "Customer Service", "Human Resources"];

const JobFilters = ({
  keyword, city, experience, category,
  onKeywordChange, onCityChange, onExperienceChange, onCategoryChange,
}: JobFiltersProps) => (
  <div className="bg-card p-4 sm:p-5 rounded-xl shadow-card space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:items-center">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by keyword..."
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="pl-9 h-11"
      />
    </div>
    <Select value={city} onValueChange={onCityChange}>
      <SelectTrigger className="w-full sm:w-40 h-11">
        <SelectValue placeholder="City" />
      </SelectTrigger>
      <SelectContent>
        {cities.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={experience} onValueChange={onExperienceChange}>
      <SelectTrigger className="w-full sm:w-44 h-11">
        <SelectValue placeholder="Experience" />
      </SelectTrigger>
      <SelectContent>
        {experiences.map((e) => (
          <SelectItem key={e} value={e}>{e}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={category} onValueChange={onCategoryChange}>
      <SelectTrigger className="w-full sm:w-44 h-11">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default JobFilters;
