import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface SportsChipSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
}

export function SportsChipSelect({
  value,
  onChange,
  options,
}: SportsChipSelectProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => {
              if (value.includes(sport)) {
                onChange(value.filter((s) => s !== sport));
              } else {
                onChange([...value, sport]);
              }
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              value.includes(sport)
                ? "bg-primary text-primary-foreground"
                : "bg-background border border-border text-foreground hover:border-primary"
            }`}
          >
            {sport}
          </button>
        ))}
      </div>
    </div>
  );
}

interface AmenityToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AmenityToggle({
  label,
  checked,
  onChange,
}: AmenityToggleProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border hover:border-accent/50 transition-colors cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="cursor-pointer"
      />
      <label className="text-sm font-medium text-foreground cursor-pointer flex-1">
        {label}
      </label>
    </div>
  );
}

interface MapPreviewProps {
  address?: string;
}

export function MapPreview({ address }: MapPreviewProps) {
  const encodedAddress = address ? encodeURIComponent(address) : "India";
  return (
    <div className="w-full h-64 bg-background rounded-lg border border-border overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDummyKey&q=${encodedAddress}`}
        allowFullScreen={false}
        loading="lazy"
        className="w-full h-full"
      />
    </div>
  );
}
