import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { RouterOSAPI } from 'node-routeros';

const router = Router();

async function connectMikrotik(mikrotik: any, useSsl: boolean = false) {
  const conn = new RouterOSAPI({
    host: mikrotik.ip,
    user: mikrotik.username,
    password: mikrotik.password,
    port: useSsl ? mikrotik.apiSslPort : mikrotik.apiPort,
    ...(useSsl && { tls: { rejectUnauthorized: false } }),
  });
  await conn.connect();
  return conn;
}

async function getRealStats(mikrotikId: string) {
  const mikrotik = await prisma.mikrotik.findUnique({ where: { id: mikrotikId } });
  if (!mikrotik) throw new Error('Mikrotik no encontrado');

  let conn;
  let useSsl = mikrotik.useSsl;

  try {
    conn = await connectMikrotik(mikrotik, useSsl);
  } catch {
    try {
      conn = await connectMikrotik(mikrotik, false);
      useSsl = false;
    } catch {
      throw new Error('No se pudo conectar al Mikrotik');
    }
  }

  const [resource, interfaces] = await Promise.all([
    conn.write('/system/resource/print'),
    conn.write('/interface/print'),
  ]);

  await conn.close();

  const res = Array.isArray(resource) ? resource[0] : resource;
  
  let totalRx = 0;
  let totalTx = 0;
  
  if (interfaces && Array.isArray(interfaces)) {
    for (const iface of interfaces) {
      if (iface['type'] === 'ether' || iface['name']?.startsWith('ether') || iface['name']?.startsWith('wan') || iface['name']?.startsWith('lan')) {
        totalRx += parseInt(iface['rx-byte'] || '0');
        totalTx += parseInt(iface['tx-byte'] || '0');
      }
    }
  }

  return {
    cpuUsage: parseFloat(res?.['cpu-load'] || res?.['cpu'] || '0'),
    ramUsage: (() => {
      const percent = res?.['used-memory-percent'];
      if (percent) return parseFloat(percent);
      const used = parseInt(res?.['used-memory'] || '0');
      const total = parseInt(res?.['total-memory'] || '1');
      return total > 0 ? (used / total) * 100 : 0;
    })(),
    uptime: parseInt(res?.['uptime']?.replace(/[^\d]/g, '') || res?.['uptime-sec'] || '0'),
    rxBytes: totalRx,
    txBytes: totalTx,
    hddUsage: parseFloat(res?.['hdd-used-percent'] || res?.['disk'] || '0'),
    temperature: parseFloat(res?.['temperature'] || res?.['cpu-temperature'] || '0'),
    version: res?.['version'] || res?.['ros-version'] || 'N/A',
  };
}

router.get('/:mikrotikId', async (req, res) => {
  try {
    const { mikrotikId } = req.params;

    const mikrotik = await prisma.mikrotik.findUnique({
      where: { id: mikrotikId },
    });

    if (!mikrotik) {
      return res.status(404).json({ error: 'Mikrotik no encontrado' });
    }

    let stats;
    try {
      stats = await getRealStats(mikrotikId);
    } catch {
      stats = {
        cpuUsage: 0,
        ramUsage: 0,
        uptime: 0,
        rxBytes: 0,
        txBytes: 0,
        hddUsage: 0,
        temperature: 0,
        version: 'N/A',
      };
    }

    const networkStat = await prisma.networkStatistic.create({
      data: {
        mikrotikId,
        cpuUsage: stats.cpuUsage,
        ramUsage: stats.ramUsage,
        uptime: stats.uptime,
        rxBytes: stats.rxBytes,
        txBytes: stats.txBytes,
      },
    });

    res.json({
      mikrotikId,
      ...stats,
      timestamp: networkStat.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/:mikrotikId/history', async (req, res) => {
  try {
    const { mikrotikId } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date();
    since.setHours(since.getHours() - Number(hours));

    const stats = await prisma.networkStatistic.findMany({
      where: {
        mikrotikId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;