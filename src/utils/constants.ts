import os from "node:os";
import path from "node:path";

export enum CategoryCapstone {
  Kesehatan = "Kesehatan",
  PengelolaanSampah = "Pengelolaan Sampah",
  SmartCity = "Smart City",
  TransportasiRamahLingkungan = "Transportasi Ramah Lingkungan",
}

export const TMP_DIR = path.join(os.tmpdir(), "paw-paw");
