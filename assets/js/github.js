/* ════════ github.js · cliente de la API de contenidos de GitHub ════════ */
window.BF = window.BF || {};

(function () {
  const API = 'https://api.github.com';

  class GhError extends Error {
    constructor(status, message, detail) {
      super(message);
      this.name = 'GhError';
      this.status = status;
      this.detail = detail;
    }
  }

  /* ---------- base64 seguro para UTF-8 (acentos, °, ñ) ---------- */
  function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  function fromBase64(b64) {
    const bin = atob(String(b64).replace(/\s/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function describe(status, body, ctx) {
    const apiMsg = body && (body.message || '');
    switch (status) {
      case 401:
        return 'Token inválido o vencido. Genera uno nuevo en GitHub y vuelve a pegarlo.';
      case 403:
        return /rate limit/i.test(apiMsg)
          ? 'Se alcanzó el límite de la API de GitHub. Espera unos minutos e intenta de nuevo.'
          : 'El token no tiene permiso. Necesita "Contents: Read and write" sobre ese repositorio.';
      case 404:
        return `No se encontró ${ctx}. Verifica usuario, repositorio y ruta — y que el token incluya ese repo.`;
      case 409: return 'Conflicto de versión: el archivo cambió en el repositorio. Se reintentará la fusión.';
      case 422: return 'GitHub rechazó la operación (422). Revisa rama y ruta del archivo.';
      default: return apiMsg ? `Error ${status}: ${apiMsg}` : `Error ${status} al contactar GitHub.`;
    }
  }

  /** Configuración en el formato que usa la API. */
  function headers(token) {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`
    };
  }

  function endpoint(cfg) {
    const owner = encodeURIComponent(cfg.owner);
    const repo = encodeURIComponent(cfg.repo);
    const path = String(cfg.path).split('/').filter(Boolean).map(encodeURIComponent).join('/');
    return `${API}/repos/${owner}/${repo}/contents/${path}`;
  }

  function validate(cfg) {
    const missing = ['owner', 'repo', 'token'].filter((k) => !cfg[k]);
    if (missing.length) throw new GhError(0, 'Faltan datos de conexión: ' + missing.join(', ') + '.');
    cfg.branch = cfg.branch || BF.CONFIG.DEFAULT_BRANCH;
    cfg.path = cfg.path || BF.CONFIG.DEFAULT_PATH;
  }

  /**
   * Lee el archivo de datos.
   * @returns {{exists: boolean, sha: string|null, data: object|null}}
   */
  async function read(cfg) {
    validate(cfg);
    const url = `${endpoint(cfg)}?ref=${encodeURIComponent(cfg.branch)}`;
    const res = await fetch(url, { headers: headers(cfg.token), cache: 'no-store' });

    if (res.status === 404) return { exists: false, sha: null, data: null };
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new GhError(res.status, describe(res.status, body, 'el archivo de la bitácora'), body);
    }

    const json = await res.json();
    let text = '';
    if (json.content && json.encoding === 'base64') {
      text = fromBase64(json.content);
    } else if (json.download_url) {
      const raw = await fetch(json.download_url, { headers: { Authorization: `Bearer ${cfg.token}` } });
      if (!raw.ok) throw new GhError(raw.status, 'No se pudo descargar el archivo de datos.');
      text = await raw.text();
    }

    let data = null;
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new GhError(0, 'El archivo del repositorio no es un JSON válido. Revísalo o sube uno desde Ajustes.');
      }
    }
    return { exists: true, sha: json.sha, data };
  }

  /** Escribe (crea o actualiza) el archivo de datos. */
  async function write(cfg, data, sha, message) {
    validate(cfg);
    const body = {
      message: message || `Bitácora: actualización de casos (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`,
      content: toBase64(JSON.stringify(data, null, 2)),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(endpoint(cfg), {
      method: 'PUT',
      headers: { ...headers(cfg.token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new GhError(res.status, describe(res.status, err, 'el archivo de la bitácora'), err);
    }
    const json = await res.json();
    return { sha: json.content && json.content.sha, commit: json.commit && json.commit.html_url };
  }

  /** Verifica token + acceso al repositorio. */
  async function test(cfg) {
    validate(cfg);
    const res = await fetch(`${API}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`, {
      headers: headers(cfg.token),
      cache: 'no-store'
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new GhError(res.status, describe(res.status, body, 'el repositorio'), body);
    }
    const repo = await res.json();
    const isPrivate = !!repo.private;
    return {
      fullName: repo.full_name,
      private: isPrivate,
      canPush: !!(repo.permissions && repo.permissions.push),
      defaultBranch: repo.default_branch
    };
  }

  BF.github = { read, write, test, GhError, toBase64, fromBase64 };
})();
