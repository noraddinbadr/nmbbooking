export interface Clinic {
  id: string;
  nameAr: string;
  nameEn: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  ownerId: string;
}

export function mapClinic(row: any): Clinic {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en ?? null,
    city: row.city ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    ownerId: row.owner_id,
  };
}