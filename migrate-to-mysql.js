/**
 * Script de Migración de Datos
 * Traspasa datos desde localStorage (exportados a JSON) a MySQL
 * 
 * Uso:
 * 1. Exporta los datos desde la aplicación Angular (localStorage)
 * 2. Guarda el JSON en un archivo llamado 'data-export.json'
 * 3. Ejecuta: node migrate-to-mysql.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Cargar configuración de la base de datos
const dbConfig = require('./database.config.json');

// Función para generar hash PBKDF2 (igual que en Angular)
function generatePasswordHash(password) {
  const salt = 'prestamos-salt-2024-secure';
  const iterations = 1000;
  const keyLength = 32; // 256 bits
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

// Función para parsear fecha ISO a formato MySQL
function parseDate(isoDate) {
  if (!isoDate) return null;
  try {
    const date = new Date(isoDate);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (error) {
    console.error(`Error parseando fecha: ${isoDate}`, error);
    return null;
  }
}

async function migrateData() {
  let connection;
  
  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      charset: dbConfig.charset
    });
    console.log('✅ Conexión establecida');

    // Leer archivo JSON con los datos exportados
    console.log('\n📖 Leyendo archivo de datos...');
    const dataPath = path.join(__dirname, 'data-export.json');
    const dataContent = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(dataContent);
    console.log('✅ Datos cargados');

    // Iniciar transacción
    await connection.beginTransaction();
    console.log('\n🔄 Iniciando migración...\n');

    // 1. Migrar Usuarios
    if (data.users && data.users.length > 0) {
      console.log(`📝 Migrando ${data.users.length} usuario(s)...`);
      for (const user of data.users) {
        // Si el usuario es 'damian', regenerar el hash con la contraseña correcta
        let passwordHash = user.passwordHash;
        if (user.username === 'damian' || user.username.toLowerCase() === 'damian') {
          passwordHash = await generatePasswordHash('2Ye3r!R4');
        }

        await connection.execute(
          `INSERT INTO users (id, username, password_hash, name, email) 
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           password_hash = VALUES(password_hash),
           name = VALUES(name),
           email = VALUES(email)`,
          [user.id, user.username, passwordHash, user.name, user.email]
        );
      }
      console.log('✅ Usuarios migrados');
    }

    // 2. Migrar Clientes
    if (data.clients && data.clients.length > 0) {
      console.log(`\n👥 Migrando ${data.clients.length} cliente(s)...`);
      for (const client of data.clients) {
        await connection.execute(
          `INSERT INTO clients (id, nombre, apellido, documento, telefono, email, direccion, fecha_registro, activo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           nombre = VALUES(nombre),
           apellido = VALUES(apellido),
           telefono = VALUES(telefono),
           email = VALUES(email),
           direccion = VALUES(direccion),
           activo = VALUES(activo)`,
          [
            client.id,
            client.nombre,
            client.apellido,
            client.documento,
            client.telefono || null,
            client.email || null,
            client.direccion || null,
            parseDate(client.fechaRegistro),
            client.activo !== undefined ? client.activo : true
          ]
        );
      }
      console.log('✅ Clientes migrados');
    }

    // 3. Migrar Préstamos
    if (data.loans && data.loans.length > 0) {
      console.log(`\n💰 Migrando ${data.loans.length} préstamo(s)...`);
      for (const loan of data.loans) {
        await connection.execute(
          `INSERT INTO loans (
            id, cliente_id, cliente_nombre, monto, tasa_interes, tipo_plazo, 
            cantidad_cuotas, fecha_inicio, fecha_vencimiento, estado, 
            monto_pendiente, cuota_mensual, cuotas_pagadas, cuotas_totales
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          monto_pendiente = VALUES(monto_pendiente),
          cuotas_pagadas = VALUES(cuotas_pagadas),
          estado = VALUES(estado)`,
          [
            loan.id,
            loan.clienteId,
            loan.clienteNombre,
            loan.monto,
            loan.tasaInteres,
            loan.tipoPlazo,
            loan.cantidadCuotas,
            parseDate(loan.fechaInicio),
            parseDate(loan.fechaVencimiento),
            loan.estado,
            loan.montoPendiente,
            loan.cuotaMensual,
            loan.cuotasPagadas || 0,
            loan.cuotasTotales || loan.cantidadCuotas
          ]
        );

        // 4. Migrar Cuotas del préstamo
        if (loan.cuotas && loan.cuotas.length > 0) {
          // Eliminar cuotas existentes del préstamo
          await connection.execute('DELETE FROM cuotas WHERE prestamo_id = ?', [loan.id]);

          for (const cuota of loan.cuotas) {
            await connection.execute(
              `INSERT INTO cuotas (
                prestamo_id, numero, monto, fecha_vencimiento, 
                fecha_pago, estado, monto_pagado
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                loan.id,
                cuota.numero,
                cuota.monto,
                parseDate(cuota.fechaVencimiento),
                cuota.fechaPago ? parseDate(cuota.fechaPago) : null,
                cuota.estado,
                cuota.montoPagado || null
              ]
            );
          }
        }
      }
      console.log('✅ Préstamos y cuotas migrados');
    }

    // 5. Migrar Pagos
    if (data.payments && data.payments.length > 0) {
      console.log(`\n💳 Migrando ${data.payments.length} pago(s)...`);
      for (const payment of data.payments) {
        await connection.execute(
          `INSERT INTO payments (
            id, prestamo_id, cliente_id, cliente_nombre, 
            monto, fecha, tipo, numero_cuota, observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          observaciones = VALUES(observaciones)`,
          [
            payment.id,
            payment.prestamoId,
            payment.clienteId,
            payment.clienteNombre,
            payment.monto,
            parseDate(payment.fecha),
            payment.tipo,
            payment.numeroCuota || null,
            payment.observaciones || null
          ]
        );
      }
      console.log('✅ Pagos migrados');
    }

    // Confirmar transacción
    await connection.commit();
    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Usuarios: ${data.users?.length || 0}`);
    console.log(`   - Clientes: ${data.clients?.length || 0}`);
    console.log(`   - Préstamos: ${data.loans?.length || 0}`);
    console.log(`   - Pagos: ${data.payments?.length || 0}`);

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✨ Proceso finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };

