**Tata cara setup**
* Install dependen server
  ```bash
  cd server && npm install
  ```
* Jalankan server backend
  ```bash
  npm start
  ```
* Buka terminal baru
* Install dependen frontend
  ```bash
  cd client && npm install
  ```
* jalankan server frontend
  ```bash
  npm run dev
  ```
  > Open http://localhost:3000/
  
**Struktur file**
```library
root
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       └── components/
│           ├── EditorModal.jsx
│           ├── KitabPreview.jsx
│           ├── PathInput.jsx
│           ├── RedirectPreview.jsx
│           ├── Sidebar.jsx
│           ├── TopicEditor.jsx
│           └── TopicList.jsx
└── server/
    ├── package.json
    └── server.js
```
