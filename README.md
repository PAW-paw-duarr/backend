
# 📚CapstoneLegacy
**CapstoneLegacy** adalah webApp yang membantu mahasiswa **meneruskan proyek** capstone lintas angkatan secara terstruktur dan aman. Platform ini menjembatani **kelompok lama** dan **kelompok baru** dengan menyediakan ringkasan proyek, kebutuhan penerus, serta mekanisme **request–approve** untuk mengakses dokumen handover

## 🧑‍💻PAW-PAW DUAR (Kelompok 14) - Developer
* Hilmi Musyaffa (23/516589/TK/56795)
* Muhammad Rhizal Rhomadon (23/514719/TK/56511)
* Riyan Naffa Nusafara (23/516897/TK/56833)
* Irfan Firdaus Isyfi (23/520128/TK/57322)
* Rahma Putri Anjani (23/519131/TK/57233)

## ⚙️Backend Features
* **Routes** `src/routes` - Menangani request-response:
  * `/auth` → login, token
  * `/users` → data user
  * `/teams` → buat tim (cek anggota 4–5)
  * `/titles` → judul/tema proyek
  * `/submissions` → ajukan & approve akses handov
* **Services** `src/services` - Bisnis rules & validation:
  * Validasi tim 4–5 anggota
  * Privasi proposal (akses by approve)
  * Log/Audit saat approve & unduh
  * Role check (owner/dosen/admin)
* **Models** `src/services` - Akses database & relasi:
  * `users`, `teams`, `titles`, `submissions`
  * Transaksi data.
  Menyimpan jejak audit.

## 📂File Directory
```
PAW-paw-duarr/
├─ backend/
│  ├─ .husky/
│  ├─ .vscode/
│  ├─ node_modules/
│  ├─ src/
│  │  ├─ lib/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ types/
│  │  ├─ utils/
│  │  ├─ app.ts
│  │  └─ index.ts
│  ├─ .env
│  ├─ .env.example
│  ├─ .gitignore
│  ├─ biome.json
│  ├─ lint-staged.config.js
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ README.md
└── tsconfig.json
``` 

## 🛠️Tech Stack
<img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white" align="center"/> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" align="center"/> <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" align="center"/> 

## 🔗Report URL GDrive
[Click here.](https://drive.google.com/drive/folders/1zJP95_f-4snHbYVY5AKdkhTLSKwYjc6Z)