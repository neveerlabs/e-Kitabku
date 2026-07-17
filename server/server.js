// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

const app = express();
app.use(cors());
app.use(express.json());

let jsonFilePath = '';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_PATH = process.env.GITHUB_PATH || 'data.json';

const githubAPI = axios.create({
  baseURL: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/`,
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
});

function log(message, type = 'INFO') {
  const time = new Date().toISOString();
  let coloredType;
  switch (type) {
    case 'ERROR':
      coloredType = chalk.red(type);
      break;
    case 'WARNING':
      coloredType = chalk.yellow(type);
      break;
    default:
      coloredType = chalk.green(type);
  }
  console.log(`[${time}] [${coloredType}] ${message}`);
}

const KITABKU_ROOT = '/home/neverlabs/Documents/e-Kitabku';
app.use('/img/preview', express.static(path.join(KITABKU_ROOT, 'img', 'preview')));

const BACKGROUND_DIR = path.join(KITABKU_ROOT, 'Editor', 'client', 'background');
app.use('/background', express.static(BACKGROUND_DIR));

app.get('/api/backgrounds', (req, res) => {
  try {
    const files = fs.readdirSync(BACKGROUND_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg'].includes(ext);
    });
    res.json(imageFiles);
  } catch (e) {
    log(`Failed to list backgrounds: ${e.message}`, 'ERROR');
    res.status(500).json({ error: 'Failed to list background images' });
  }
});

async function syncToGithub(data) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    log('GitHub configuration missing, skipping sync', 'WARNING');
    return false;
  }

  try {
    let sha = null;
    try {
      const getRes = await githubAPI.get(GITHUB_PATH);
      sha = getRes.data.sha;
      log('Existing file found in repository, will update', 'INFO');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        sha = null;
        log('File not present in repository, creating new', 'INFO');
      } else {
        throw err;
      }
    }

    const content = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
    const payload = {
      message: 'Update data.json from Kitabku Editor',
      content: content,
      branch: 'main',
    };
    if (sha) payload.sha = sha;

    await githubAPI.put(GITHUB_PATH, payload);
    log('Successfully synced data to GitHub repository', 'INFO');
    return true;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.statusText || error.message;
    log(`GitHub sync failed: ${status} ${message}`, 'ERROR');
    return false;
  }
}

app.post('/api/set-path', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) {
    log('Set path request missing path parameter', 'WARNING');
    return res.status(400).json({ error: 'Path wajib diisi' });
  }
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'ERROR');
    return res.status(404).json({ error: 'File tidak ditemukan' });
  }
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf8'));
    jsonFilePath = filePath;
    log(`File path set to: ${filePath}`, 'INFO');
    return res.json({ success: true });
  } catch (e) {
    log(`Invalid JSON file: ${filePath}`, 'ERROR');
    return res.status(400).json({ error: 'File bukan JSON yang valid' });
  }
});

app.get('/api/data', (req, res) => {
  if (!jsonFilePath) {
    log('Attempted to read data without setting path', 'WARNING');
    return res.status(400).json({ error: 'Path belum diset' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    log('Data read successfully from local file', 'INFO');
    res.json(data);
  } catch (e) {
    log(`Failed to read local file: ${e.message}`, 'ERROR');
    res.status(500).json({ error: 'Gagal membaca file' });
  }
});

app.put('/api/data', async (req, res) => {
  if (!jsonFilePath) {
    log('Attempted to save data without setting path', 'WARNING');
    return res.status(400).json({ error: 'Path belum diset' });
  }
  try {
    const newData = req.body;
    fs.writeFileSync(jsonFilePath, JSON.stringify(newData, null, 2), 'utf8');
    log('Local file updated successfully', 'INFO');

    const synced = await syncToGithub(newData);
    res.json({ success: true, synced });
  } catch (e) {
    log(`Local save failed: ${e.message}`, 'ERROR');
    res.status(500).json({ error: 'Gagal menyimpan file' });
  }
});

app.post('/api/upload', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Konten file wajib diisi' });
  }

  try {
    JSON.parse(content);
  } catch (e) {
    return res.status(400).json({ error: 'File bukan JSON yang valid' });
  }

  const targetPath = path.join(KITABKU_ROOT, 'data.json');
  try {
    fs.writeFileSync(targetPath, content, 'utf8');
    log(`File uploaded and saved to ${targetPath}`, 'INFO');
    res.json({ path: targetPath });
  } catch (e) {
    log(`Failed to save uploaded file: ${e.message}`, 'ERROR');
    res.status(500).json({ error: 'Gagal menyimpan file' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  log(`Backend running on http://localhost:${PORT}`, 'INFO');
  if (!GITHUB_TOKEN) log('GITHUB_TOKEN not set, GitHub sync disabled', 'WARNING');
});