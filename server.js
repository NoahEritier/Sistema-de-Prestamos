/**
 * Servidor Backend Express
 * Sistema de Préstamos - API REST
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'sql.freedb.tech',
  user: process.env.DB_USER || 'freedb_sistema_de_prestamos5001',
  password: process.env.DB_PASSWORD || 'Fk*4!WZWHp@sFh*',
  database: process.env.DB_NAME || 'freedb_sistema_de_prestamos',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Constantes de seguridad
const SALT = 'prestamos-salt-2024-secure';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

// Almacenamiento en memoria para intentos de login (en producción usar Redis)
const loginAttempts = new Map();

// ============================================
// Utilidades
// ============================================

function hashPassword(password, salt = SALT) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 1000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isUserLocked(username) {
  const attempt = loginAttempts.get(username);
  if (!attempt) return false;
  
  if (attempt.lockedUntil && attempt.lockedUntil > Date.now()) {
    return true;
  }
  
  // Limpiar si expiró
  if (attempt.lockedUntil && attempt.lockedUntil <= Date.now()) {
    loginAttempts.delete(username);
    return false;
  }
  
  return false;
}

function recordFailedAttempt(username) {
  const attempt = loginAttempts.get(username) || { attempts: 0, lastAttempt: Date.now() };
  attempt.attempts += 1;
  attempt.lastAttempt = Date.now();
  
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(username, attempt);
}

function clearFailedAttempts(username) {
  loginAttempts.delete(username);
}

// Middleware de autenticación
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const [sessions] = await pool.execute(
      'SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    
    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
    req.user = sessions[0];
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}

// ============================================
// Rutas de Autenticación
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    // Verificar bloqueo
    if (isUserLocked(username)) {
      const attempt = loginAttempts.get(username);
      const remainingTime = attempt?.lockedUntil 
        ? Math.ceil((attempt.lockedUntil - Date.now()) / 60000)
        : 0;
      return res.status(423).json({ 
        error: `Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos.`,
        lockedUntil: attempt?.lockedUntil
      });
    }
    
    // Buscar usuario
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );
    
    if (users.length === 0) {
      recordFailedAttempt(username);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const passwordHash = await hashPassword(password.trim());
    
    if (user.password_hash !== passwordHash) {
      recordFailedAttempt(username);
      const attempt = loginAttempts.get(username);
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - (attempt?.attempts || 0);
      
      if (remainingAttempts > 0) {
        return res.status(401).json({ 
          error: `Usuario o contraseña incorrectos. ${remainingAttempts} intentos restantes.` 
        });
      } else {
        return res.status(423).json({ 
          error: 'Cuenta bloqueada por múltiples intentos fallidos',
          lockedUntil: attempt?.lockedUntil
        });
      }
    }
    
    // Login exitoso
    clearFailedAttempts(username);
    
    // Crear sesión
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await pool.execute(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );
    
    // Limpiar sesiones expiradas
    await pool.execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
    
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    await pool.execute('DELETE FROM user_sessions WHERE token = ?', [token]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Verificar sesión
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, username, name, email FROM users WHERE id = ?', [req.user.user_id]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error verificando sesión:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================
// Rutas de Usuarios
// ============================================

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, username, name, email, created_at FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================
// Rutas de Clientes
// ============================================

app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const [clients] = await pool.execute(
      'SELECT * FROM clients ORDER BY fecha_registro DESC'
    );
    res.json(clients.map(client => ({
      id: client.id,
      nombre: client.nombre,
      apellido: client.apellido,
      documento: client.documento,
      telefono: client.telefono,
      email: client.email,
      direccion: client.direccion,
      fechaRegistro: client.fecha_registro,
      activo: client.activo === 1 || client.activo === true
    })));
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { nombre, apellido, documento, telefono, email, direccion } = req.body;
    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.execute(
      `INSERT INTO clients (id, nombre, apellido, documento, telefono, email, direccion, fecha_registro, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), TRUE)`,
      [id, nombre, apellido, documento, telefono || null, email || null, direccion || null]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Ya existe un cliente con ese documento' });
    } else {
      console.error('Error creando cliente:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, documento, telefono, email, direccion, activo } = req.body;
    
    await pool.execute(
      `UPDATE clients SET nombre = ?, apellido = ?, documento = ?, telefono = ?, 
       email = ?, direccion = ?, activo = ? WHERE id = ?`,
      [nombre, apellido, documento, telefono || null, email || null, direccion || null, activo !== undefined ? activo : true, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Ya existe un cliente con ese documento' });
    } else {
      console.error('Error actualizando cliente:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si tiene préstamos activos
    const [loans] = await pool.execute(
      'SELECT COUNT(*) as count FROM loans WHERE cliente_id = ? AND estado = "activo"',
      [id]
    );
    
    if (loans[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un cliente con préstamos activos' });
    }
    
    await pool.execute('DELETE FROM clients WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================
// Rutas de Préstamos
// ============================================

app.get('/api/loans', authenticateToken, async (req, res) => {
  try {
    const [loans] = await pool.execute(
      `SELECT l.*, 
       (SELECT COUNT(*) FROM cuotas c WHERE c.prestamo_id = l.id) as total_cuotas_db,
       (SELECT COUNT(*) FROM cuotas c WHERE c.prestamo_id = l.id AND c.estado = 'pagada') as cuotas_pagadas_db
       FROM loans l ORDER BY l.fecha_inicio DESC`
    );
    
    // Obtener cuotas para cada préstamo
    const loansWithCuotas = await Promise.all(loans.map(async (loan) => {
      const [cuotas] = await pool.execute(
        'SELECT * FROM cuotas WHERE prestamo_id = ? ORDER BY numero',
        [loan.id]
      );
      
      return {
        id: loan.id,
        clienteId: loan.cliente_id,
        clienteNombre: loan.cliente_nombre,
        monto: parseFloat(loan.monto),
        tasaInteres: parseFloat(loan.tasa_interes),
        tipoPlazo: loan.tipo_plazo,
        cantidadCuotas: loan.cantidad_cuotas,
        fechaInicio: loan.fecha_inicio,
        fechaVencimiento: loan.fecha_vencimiento,
        estado: loan.estado,
        montoPendiente: parseFloat(loan.monto_pendiente),
        cuotaMensual: parseFloat(loan.cuota_mensual),
        cuotasPagadas: loan.cuotas_pagadas || 0,
        cuotasTotales: loan.cuotas_totales,
        cuotas: cuotas.map(c => ({
          numero: c.numero,
          monto: parseFloat(c.monto),
          fechaVencimiento: c.fecha_vencimiento,
          fechaPago: c.fecha_pago,
          estado: c.estado,
          montoPagado: c.monto_pagado ? parseFloat(c.monto_pagado) : undefined
        }))
      };
    }));
    
    res.json(loansWithCuotas);
  } catch (error) {
    console.error('Error obteniendo préstamos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/loans', authenticateToken, async (req, res) => {
  try {
    const loan = req.body;
    const id = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.execute(
      `INSERT INTO loans (
        id, cliente_id, cliente_nombre, monto, tasa_interes, tipo_plazo, 
        cantidad_cuotas, fecha_inicio, fecha_vencimiento, estado, 
        monto_pendiente, cuota_mensual, cuotas_pagadas, cuotas_totales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, loan.clienteId, loan.clienteNombre, loan.monto, loan.tasaInteres,
        loan.tipoPlazo, loan.cantidadCuotas, loan.fechaInicio, loan.fechaVencimiento,
        loan.estado, loan.montoPendiente, loan.cuotaMensual, 0, loan.cuotasTotales
      ]
    );
    
    // Insertar cuotas
    if (loan.cuotas && loan.cuotas.length > 0) {
      for (const cuota of loan.cuotas) {
        await pool.execute(
          `INSERT INTO cuotas (prestamo_id, numero, monto, fecha_vencimiento, estado) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, cuota.numero, cuota.monto, cuota.fechaVencimiento, cuota.estado]
        );
      }
    }
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error creando préstamo:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/loans/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const loan = req.body;
    
    await pool.execute(
      `UPDATE loans SET 
       monto_pendiente = ?, cuotas_pagadas = ?, estado = ? 
       WHERE id = ?`,
      [loan.montoPendiente, loan.cuotasPagadas, loan.estado, id]
    );
    
    // Actualizar cuotas
    if (loan.cuotas && loan.cuotas.length > 0) {
      // Eliminar cuotas existentes
      await pool.execute('DELETE FROM cuotas WHERE prestamo_id = ?', [id]);
      
      // Insertar cuotas actualizadas
      for (const cuota of loan.cuotas) {
        await pool.execute(
          `INSERT INTO cuotas (prestamo_id, numero, monto, fecha_vencimiento, fecha_pago, estado, monto_pagado) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id, cuota.numero, cuota.monto, cuota.fechaVencimiento,
            cuota.fechaPago || null, cuota.estado, cuota.montoPagado || null
          ]
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando préstamo:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================
// Rutas de Pagos
// ============================================

app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const [payments] = await pool.execute(
      'SELECT * FROM payments ORDER BY fecha DESC'
    );
    
    res.json(payments.map(p => ({
      id: p.id,
      prestamoId: p.prestamo_id,
      clienteId: p.cliente_id,
      clienteNombre: p.cliente_nombre,
      monto: parseFloat(p.monto),
      fecha: p.fecha,
      tipo: p.tipo,
      numeroCuota: p.numero_cuota,
      observaciones: p.observaciones
    })));
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const payment = req.body;
    const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.execute(
      `INSERT INTO payments (id, prestamo_id, cliente_id, cliente_nombre, monto, fecha, tipo, numero_cuota, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, payment.prestamoId, payment.clienteId, payment.clienteNombre,
        payment.monto, payment.fecha, payment.tipo, payment.numeroCuota || null, payment.observaciones || null
      ]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error creando pago:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================
// Inicialización
// ============================================

// Crear tabla de sesiones si no existe
async function initializeDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Crear usuario por defecto si no existe
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const passwordHash = await hashPassword('2Ye3r!R4');
      await pool.execute(
        `INSERT INTO users (id, username, password_hash, name, email) 
         VALUES ('1', 'damian', ?, 'Damian', 'damian@prestamos.com')`,
        [passwordHash]
      );
      console.log('Usuario por defecto creado: damian / 2Ye3r!R4');
    }
    
    console.log('Base de datos inicializada');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
}

// Iniciar servidor
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);

// Limpiar sesiones expiradas cada hora
setInterval(async () => {
  try {
    await pool.execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Error limpiando sesiones:', error);
  }
}, 60 * 60 * 1000);

module.exports = app;

