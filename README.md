# ReCapstone - Backend

ReCapstone is a web app that helps students continue capstone projects across different cohorts in a structured and simple way

## Kelompok 14

- Hilmi Musyaffa (23/516589/TK/56795)
- Muhammad Rhizal Rhomadon (23/514719/TK/56511)
- Riyan Naffa Nusafara (23/516897/TK/56833)
- Irfan Firdaus Isyfi (23/520128/TK/57322)
- Rahma Putri Anjani (23/519131/TK/57233)

## Folder Structure

- **Lib** `src/lib` - Helper functions
- **Models** `src/services` - Database models
- **Routes** `src/routes` - Express routes
- **Services** `src/services` - Bussiness logic
- **Test** `src/test` - Unit test
- **Types** `src/types` - Custom types
- **Utils** `src/utils` - Utility functions

## File Directory

```
backend/
├── .env.example
├── .gitignore
├── .husky/
│   └── pre-commit
├── .vscode/
│   ├── extension.json
│   └── settings.json
├── biome.json
├── lint-staged.config.js
├── package-lock.json
├── package.json
├── README.md
├── src/
│   ├── app.ts
│   ├── index.ts
│   ├── lib/
│   │   ├── api/
│   │   │   └── schema.d.ts
│   │   ├── auth.ts
│   │   ├── file.ts
│   │   ├── logger.ts
│   │   ├── multer.ts
│   │   └── s3.ts
│   ├── models/
│   │   ├── config.ts
│   │   ├── submissions.ts
│   │   ├── teams.ts
│   │   ├── titles.ts
│   │   └── users.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── file.ts
│   │   ├── index.ts
│   │   ├── submission.ts
│   │   ├── team.ts
│   │   ├── title.ts
│   │   └── user.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── submissionService.ts
│   │   ├── teamService.ts
│   │   ├── titleService.ts
│   │   └── userService.ts
│   ├── test/
│   │   ├── database/
│   │   │   ├── data.ts
│   │   │   └── helper.ts
│   │   ├── services_test/
│   │   │   ├── authService.test.ts
│   │   │   ├── submission.test.ts
│   │   │   ├── teamService.test.ts
│   │   │   ├── titleService.test.ts
│   │   │   └── userService.test.ts
│   │   └── setup.ts
│   ├── types/
│   │   ├── express.ts
│   │   └── service.ts
│   └── utils/
│       ├── constants.ts
│       ├── env.ts
│       ├── frontend.ts
│       └── httpError.ts
├── tsconfig.json
└── vitest.config.ts
```

## Tech Stack

<img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/-Express-000000?style=for-the-badge&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/-MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white"/>
<img src="https://img.shields.io/badge/-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>

## Report URL

[https://drive.google.com/drive/folders/1zJP95_f-4snHbYVY5AKdkhTLSKwYjc6Z](https://drive.google.com/drive/folders/1zJP95_f-4snHbYVY5AKdkhTLSKwYjc6Z)
