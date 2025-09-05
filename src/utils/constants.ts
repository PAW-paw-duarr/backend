export enum CategoryCapstone {
  Kesehatan = "Kesehatan",
  PengelolaanSampah = "Pengelolaan Sampah",
  SmartCity = "Smart City",
  TransportasiRamahLingkungan = "Transportasi Ramah Lingkungan",
}

export const isProd = process.env.NODE_ENV === "production";
