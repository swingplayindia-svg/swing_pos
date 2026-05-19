import * as XLSX from "xlsx";
import {
  buildTurfFromForm,
  EMPTY_TURF_FORM,
  type TurfForm,
} from "./turf-defaults";
import type { TurfInput } from "./turf-schema";
import { DEFAULT_AMENITIES } from "./turf-schema";

export const EXCEL_TEMPLATE_HEADERS = [
  "Name",
  "Slug",
  "Pincode",
  "Address",
  "Landmark",
  "Area",
  "City",
  "State",
  "Country",
  "Lat",
  "Lon",
  "Open Time",
  "Close Time",
  "Open 24 Hours",
  "Phone",
  "WhatsApp",
  "Email",
  "Rating",
  "Total Reviews",
  "Sports",
  "Num Turfs",
  "Turf Surface",
  "Turf Location",
  "Floodlights",
  "Washrooms",
  "Drinking Water",
  "Parking",
  "Changing Rooms",
  "Seating",
  "Turf Image URL",
  "Turf URL",
  "Weekday Price",
  "Weekend Price",
] as const;

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  "venue name": "name",
  slug: "slug",
  pincode: "pincode",
  "zip code": "pincode",
  address: "address",
  landmark: "landmark",
  area: "area",
  location: "area",
  locality: "area",
  city: "city",
  state: "state",
  country: "country",
  lat: "lat",
  latitude: "lat",
  lon: "lon",
  lng: "lon",
  longitude: "lon",
  "open time": "open_time",
  open_time: "open_time",
  "close time": "close_time",
  close_time: "close_time",
  "open 24 hours": "open_24_hours",
  open_24_hours: "open_24_hours",
  "24 hours": "open_24_hours",
  phone: "phone",
  mobile: "phone",
  contact: "phone",
  whatsapp: "whatsapp",
  email: "email",
  rating: "rating",
  "total reviews": "total_reviews",
  reviews: "total_reviews",
  total_reviews: "total_reviews",
  sports: "sports",
  sport: "sports",
  "num turfs": "num_turfs",
  num_turfs: "num_turfs",
  "turf surface": "turf_surface",
  turf_surface: "turf_surface",
  surface: "turf_surface",
  "turf location": "turf_location",
  turf_location: "turf_location",
  floodlights: "floodlights",
  washrooms: "washrooms",
  "drinking water": "drinking_water",
  drinking_water: "drinking_water",
  parking: "parking",
  "changing rooms": "changing_rooms",
  changing_rooms: "changing_rooms",
  seating: "seating",
  "turf image url": "turfImage",
  turfimage: "turfImage",
  image: "turfImage",
  "turf url": "turf_url",
  turf_url: "turf_url",
  url: "turf_url",
  "weekday price": "weekday",
  weekday: "weekday",
  "weekday rate": "weekday",
  "weekend price": "weekend",
  weekend: "weekend",
  "weekend rate": "weekend",
};

export type ImportRowError = { row: number; message: string };

export type ImportPreview = {
  turfs: TurfInput[];
  errors: ImportRowError[];
  skipped: number;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseSports(value: unknown): string[] {
  if (!value) return [];
  return String(value)
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePrice(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseBool(value: unknown, fallback = false): boolean {
  if (value === null || value === undefined || value === "") return fallback;
  const s = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1", "x"].includes(s)) return true;
  if (["no", "n", "false", "0"].includes(s)) return false;
  return fallback;
}

function rowToTurfForm(
  row: Record<string, unknown>,
  rowIndex: number,
): { data?: TurfForm; error?: string; empty?: boolean } {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    const field = HEADER_ALIASES[normalizeHeader(key)];
    if (field) mapped[field] = value;
  }

  const name = String(mapped.name ?? "").trim();
  const area = String(mapped.area ?? "").trim();
  const city = String(mapped.city ?? "").trim();
  const phone = String(mapped.phone ?? "").trim();

  if (!name && !area && !city && !phone) {
    return { empty: true };
  }

  const sports = parseSports(mapped.sports);
  const weekday = parsePrice(mapped.weekday);
  const weekend = parsePrice(mapped.weekend) || weekday;

  if (!name) return { error: `Row ${rowIndex}: Name is required` };
  if (!area) return { error: `Row ${rowIndex}: Area is required` };
  if (!city) return { error: `Row ${rowIndex}: City is required` };
  if (!phone) return { error: `Row ${rowIndex}: Phone is required` };
  if (sports.length === 0)
    return { error: `Row ${rowIndex}: At least one sport is required` };
  if (weekday <= 0)
    return { error: `Row ${rowIndex}: Weekday price must be greater than 0` };

  const open24 = parseBool(mapped.open_24_hours, false);

  const form: TurfForm = {
    ...EMPTY_TURF_FORM,
    name,
    slug: String(mapped.slug ?? "").trim(),
    pincode: String(mapped.pincode ?? "").trim(),
    address: String(mapped.address ?? "").trim(),
    landmark: String(mapped.landmark ?? "").trim(),
    area,
    city,
    state: String(mapped.state ?? "").trim(),
    country: String(mapped.country ?? "India").trim(),
    lat: String(mapped.lat ?? ""),
    lon: String(mapped.lon ?? ""),
    open_time: String(mapped.open_time ?? "06:00").trim(),
    close_time: String(mapped.close_time ?? "23:00").trim(),
    open_24_hours: open24,
    phone,
    whatsapp: String(mapped.whatsapp ?? phone).trim(),
    email: String(mapped.email ?? "").trim(),
    rating: String(mapped.rating ?? "4.5"),
    total_reviews: String(mapped.total_reviews ?? "0"),
    sports,
    num_turfs: String(mapped.num_turfs ?? "1"),
    turf_surface: String(mapped.turf_surface ?? "Synthetic Grass").trim(),
    turf_location: String(mapped.turf_location ?? "").trim(),
    amenities: {
      floodlights: parseBool(mapped.floodlights, DEFAULT_AMENITIES.floodlights),
      washrooms: parseBool(mapped.washrooms, DEFAULT_AMENITIES.washrooms),
      drinking_water: parseBool(
        mapped.drinking_water,
        DEFAULT_AMENITIES.drinking_water,
      ),
      parking: parseBool(mapped.parking, DEFAULT_AMENITIES.parking),
      changing_rooms: parseBool(
        mapped.changing_rooms,
        DEFAULT_AMENITIES.changing_rooms,
      ),
      seating: parseBool(mapped.seating, DEFAULT_AMENITIES.seating),
    },
    turfImage: String(mapped.turfImage ?? "").trim(),
    turf_url: String(mapped.turf_url ?? "").trim(),
    weekday: String(weekday),
    weekend: String(weekend),
  };

  return { data: form };
}

export function parseExcelRows(rows: Record<string, unknown>[]): ImportPreview {
  const turfs: TurfInput[] = [];
  const errors: ImportRowError[] = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const result = rowToTurfForm(row, rowNumber);

    if (result.empty) {
      skipped += 1;
      return;
    }

    if (result.error) {
      errors.push({ row: rowNumber, message: result.error });
      return;
    }

    if (result.data) {
      turfs.push(buildTurfFromForm(result.data));
    }
  });

  return { turfs, errors, skipped };
}

export async function parseExcelFile(file: File): Promise<ImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return {
      turfs: [],
      errors: [{ row: 0, message: "The file has no sheets." }],
      skipped: 0,
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    return {
      turfs: [],
      errors: [{ row: 0, message: "No data rows found. Use the template format." }],
      skipped: 0,
    };
  }

  return parseExcelRows(rows);
}

export function downloadImportTemplate(): void {
  const sample = [
    {
      Name: "CoPlay TurfPark – Mahalaxmi",
      Slug: "coplay-turfpark-mahalaxmi",
      Pincode: "400018",
      Address:
        "Evergreen Industrial Estate, Shakti Mills Lane, Mahalakshmi, Mumbai, Maharashtra 400018",
      Landmark: "Near Mahalakshmi Railway Station",
      Area: "Mahalakshmi",
      City: "Mumbai",
      State: "Maharashtra",
      Country: "India",
      Lat: 18.9883,
      Lon: 72.8251,
      "Open Time": "00:00",
      "Close Time": "23:59",
      "Open 24 Hours": "yes",
      Phone: "+917506223300",
      WhatsApp: "+917506223300",
      Email: "",
      Rating: 4.3,
      "Total Reviews": 683,
      Sports: "Football, Cricket, Padel, Badminton",
      "Num Turfs": 2,
      "Turf Surface": "Synthetic Grass",
      "Turf Location": "Terrace (4th Floor)",
      Floodlights: "yes",
      Washrooms: "yes",
      "Drinking Water": "yes",
      Parking: "yes",
      "Changing Rooms": "yes",
      Seating: "yes",
      "Turf Image URL":
        "https://res.cloudinary.com/dmzp6notl/image/upload/v1778244213/unnamed_nzcquk.webp",
      "Turf URL":
        "https://www.khelomore.com/sports-venues/mumbai/the-spirit-field-samhita-complex-(-building-no.8)-andheri-east/1725",
      "Weekday Price": 1000,
      "Weekend Price": 1500,
    },
  ];

  const sheet = XLSX.utils.json_to_sheet(sample, {
    header: [...EXCEL_TEMPLATE_HEADERS],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Turfs");
  XLSX.writeFile(workbook, "swing-play-turfs-template.xlsx");
}
