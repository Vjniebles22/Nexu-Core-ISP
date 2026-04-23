import { RouterOSAPI } from 'node-routeros';

export interface MikrotikConfig {
  id: string;
  name: string;
  ip: string;
  apiPort: number;
  apiSslPort: number;
  username: string;
  password: string;
  useSsl: boolean;
}

async function safeClose(conn: RouterOSAPI | null): Promise<void> {
  if (conn) {
    try { await conn.close(); } catch {}
  }
}

function ignoreEmptyError(promise: Promise<any>): Promise<any> {
  return new Promise((resolve) => {
    promise.then(resolve).catch((err: any) => {
      if (err?.message?.includes('!empty') || err?.message?.includes('UNKNOWNREPLY')) {
        resolve(null);
      } else {
        resolve(Promise.reject(err));
      }
    });
  });
}

export async function testMikrotikConnection(mikrotik: MikrotikConfig): Promise<{ success: boolean; message: string; useSsl: boolean }> {
  let conn: RouterOSAPI | null = null;
  
  for (const useSsl of [true, false]) {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    try {
      await conn.connect();
      await ignoreEmptyError(conn.write('/system/identity/print'));
      await safeClose(conn);
      return { success: true, message: useSsl ? 'Conexión exitosa (SSL)' : 'Conexión exitosa', useSsl };
    } catch (err: any) {
      await safeClose(conn);
      if (useSsl === false) {
        return { success: false, message: `Error: ${err?.message || 'No se pudo conectar'}`, useSsl: false };
      }
    }
  }
  
  return { success: false, message: 'No se pudo conectar', useSsl: false };
}

export async function verifyConnection(mikrotik: MikrotikConfig): Promise<boolean> {
  try {
    const result = await testMikrotikConnection(mikrotik);
    return result.success;
  } catch {
    return false;
  }
}

async function execCommand(conn: RouterOSAPI, cmd: string, args: string[] = []): Promise<any[]> {
  try {
    const result = await conn.write(cmd, args);
    return result;
  } catch (err: any) {
    if (err?.message?.includes('!empty') || err?.message?.includes('UNKNOWNREPLY')) {
      return [];
    }
    throw err;
  }
}

export async function getMikrotikQueues(mikrotik: MikrotikConfig): Promise<any[]> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    const queues = await execCommand(conn, '/queue/simple/print');
    await safeClose(conn);
    return queues.filter((q: any) => q && q.name && !q.name.startsWith('global'));
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al obtener colas: ${err}`);
  }
}

export async function getMikrotikPPPESecrets(mikrotik: MikrotikConfig): Promise<any[]> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    const secrets = await execCommand(conn, '/ppp/secret/print');
    await safeClose(conn);
    return secrets.filter((s: any) => s && s.name);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al obtener secretos PPPoE: ${err}`);
  }
}

export async function createPPPoESecret(
  mikrotik: MikrotikConfig,
  user: string,
  password: string,
  profile: string
): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    await execCommand(conn, '/ppp/secret/add', [
      `=name=${user}`,
      `=password=${password}`,
      `=profile=${profile}`,
      `=service=pppoe`,
    ]);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al crear usuario PPPoE: ${err}`);
  }
}

export async function deletePPPoESecret(mikrotik: MikrotikConfig, user: string): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    await execCommand(conn, '/ppp/secret/remove', [`=name=${user}`]);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al eliminar usuario PPPoE: ${err}`);
  }
}

export async function createQueue(
  mikrotik: MikrotikConfig,
  name: string,
  target: string,
  maxLimit: string,
  priority: number = 8
): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    await execCommand(conn, '/queue/simple/add', [
      `=name=${name}`,
      `=target=${target}`,
      `=max-limit=${maxLimit}`,
      `=priority=${priority}`,
    ]);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al crear cola: ${err}`);
  }
}

export async function updateQueue(
  mikrotik: MikrotikConfig,
  name: string,
  maxLimit?: string,
  disabled?: boolean
): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    const params: string[] = [`=name=${name}`];
    if (maxLimit) params.push(`=max-limit=${maxLimit}`);
    if (disabled !== undefined) params.push(`=disabled=${disabled}`);
    await execCommand(conn, '/queue/simple/set', params);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al actualizar cola: ${err}`);
  }
}

export async function deleteQueue(mikrotik: MikrotikConfig, name: string): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    await execCommand(conn, '/queue/simple/remove', [`=name=${name}`]);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al eliminar cola: ${err}`);
  }
}

export async function enablePPPoEUser(mikrotik: MikrotikConfig, user: string): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    await execCommand(conn, '/ppp/secret/set', [`=name=${user}`, '=disabled=false']);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al habilitar usuario: ${err}`);
  }
}

export async function disablePPPoEUser(mikrotik: MikrotikConfig, user: string): Promise<void> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    await execCommand(conn, '/ppp/secret/set', [`=name=${user}`, '=disabled=true']);
    await safeClose(conn);
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al deshabilitar usuario: ${err}`);
  }
}

export async function getMikrotikResources(mikrotik: MikrotikConfig): Promise<any> {
  let conn: RouterOSAPI | null = null;
  try {
    conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.username,
      password: mikrotik.password,
      port: mikrotik.useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
      timeout: 15,
      keepalive: false,
      ...(mikrotik.useSsl && { tls: { rejectUnauthorized: false } }),
    });
    
    await conn.connect();
    const resources = await execCommand(conn, '/system/resource/print');
    const identity = await execCommand(conn, '/system/identity/print');
    await safeClose(conn);
    
    return {
      ...resources[0],
      identity: identity[0]?.name || 'Unknown'
    };
  } catch (err) {
    await safeClose(conn);
    throw new Error(`Error al obtener recursos: ${err}`);
  }
}