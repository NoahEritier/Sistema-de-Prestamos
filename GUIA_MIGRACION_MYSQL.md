# Guía de Migración a MySQL

Esta guía te ayudará a migrar los datos desde localStorage (Angular) a MySQL.

## 📋 Requisitos Previos

1. **Base de datos creada**: Ejecuta el script `database.sql` en tu servidor MySQL
2. **Node.js instalado**: Versión 14 o superior
3. **Datos exportados**: Necesitas exportar los datos desde la aplicación Angular

## 🔧 Paso 1: Instalar Dependencias

```bash
npm install mysql2
```

O si prefieres instalar solo para migración:

```bash
npm install mysql2 --save-dev
```

## 📤 Paso 2: Exportar Datos desde Angular

### Opción A: Desde la Consola del Navegador

1. Abre la aplicación Angular en el navegador
2. Abre la consola del desarrollador (F12)
3. Ejecuta el siguiente código:

```javascript
// Exportar todos los datos
const data = {
  users: JSON.parse(localStorage.getItem('prestamos_users') || '[]'),
  clients: JSON.parse(localStorage.getItem('prestamos_clients') || '[]'),
  loans: JSON.parse(localStorage.getItem('prestamos_loans') || '[]'),
  payments: JSON.parse(localStorage.getItem('prestamos_payments') || '[]')
};

// Crear y descargar archivo JSON
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'data-export.json';
a.click();
URL.revokeObjectURL(url);
```

### Opción B: Desde el Código (si tienes acceso)

Si tienes acceso al código, puedes agregar temporalmente un botón de exportación en el dashboard.

## 📥 Paso 3: Preparar el Archivo de Datos

1. Guarda el archivo JSON descargado como `data-export.json` en la raíz del proyecto
2. Verifica que el archivo tenga esta estructura:

```json
{
  "users": [...],
  "clients": [...],
  "loans": [...],
  "payments": [...]
}
```

## 🗄️ Paso 4: Ejecutar el Script SQL

Antes de migrar, asegúrate de que las tablas estén creadas:

```bash
# Opción 1: Desde línea de comandos MySQL
mysql -h sql.freedb.tech -u freedb_sistema_de_prestamos5001 -p freedb_sistema_de_prestamos < database.sql

# Opción 2: Desde cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)
# Copia y pega el contenido de database.sql y ejecútalo
```

## 🚀 Paso 5: Ejecutar la Migración

```bash
npm run migrate
```

O directamente:

```bash
node migrate-to-mysql.js
```

## ✅ Verificación

Después de la migración, verifica los datos:

```sql
-- Verificar usuarios
SELECT * FROM users;

-- Verificar clientes
SELECT COUNT(*) as total_clientes FROM clients;

-- Verificar préstamos
SELECT COUNT(*) as total_prestamos FROM loans;

-- Verificar cuotas
SELECT COUNT(*) as total_cuotas FROM cuotas;

-- Verificar pagos
SELECT COUNT(*) as total_pagos FROM payments;
```

## 🔍 Solución de Problemas

### Error: "Cannot find module 'mysql2'"

```bash
npm install mysql2
```

### Error: "Access denied for user"

Verifica las credenciales en `database.config.json`:
- Host: `sql.freedb.tech`
- User: `freedb_sistema_de_prestamos5001`
- Password: `Fk*4!WZWHp@sFh*`
- Database: `freedb_sistema_de_prestamos`

### Error: "Table doesn't exist"

Asegúrate de haber ejecutado el script `database.sql` primero.

### Error: "Duplicate entry"

El script usa `ON DUPLICATE KEY UPDATE`, por lo que si ejecutas la migración varias veces, actualizará los registros existentes en lugar de crear duplicados.

## 📝 Notas Importantes

1. **Backup**: Siempre haz un backup de tus datos antes de migrar
2. **Contraseña del usuario 'damian'**: El script regenera automáticamente el hash de la contraseña `2Ye3r!R4` para el usuario 'damian'
3. **Fechas**: Las fechas se convierten automáticamente del formato ISO a formato MySQL
4. **Transacciones**: Todo el proceso se ejecuta en una transacción, si algo falla, se revierte todo

## 🔄 Migración Incremental

Si necesitas migrar datos nuevos después de la primera migración:

1. Exporta solo los datos nuevos desde Angular
2. Ejecuta el script de migración nuevamente
3. El script actualizará los registros existentes y agregará los nuevos

## 🎯 Próximos Pasos

Después de migrar a MySQL, necesitarás:

1. **Crear un backend API** (Node.js/Express, PHP, etc.) para conectar Angular con MySQL
2. **Actualizar los servicios de Angular** para usar HTTP requests en lugar de localStorage
3. **Implementar autenticación JWT** para las sesiones
4. **Configurar CORS** en el backend para permitir requests desde Angular

## 📚 Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema
- **clients**: Clientes
- **loans**: Préstamos
- **cuotas**: Cuotas de cada préstamo
- **payments**: Registro de pagos

### Relaciones

- `loans.cliente_id` → `clients.id`
- `cuotas.prestamo_id` → `loans.id`
- `payments.prestamo_id` → `loans.id`
- `payments.cliente_id` → `clients.id`

### Vistas Útiles

- `v_loans_activos`: Préstamos activos con información del cliente
- `v_cuotas_vencidas`: Cuotas vencidas con días de retraso

## 🔐 Seguridad

⚠️ **IMPORTANTE**: El archivo `database.config.json` contiene credenciales sensibles. 

- **NO** lo subas a Git
- Agrega `database.config.json` a `.gitignore`
- Usa variables de entorno en producción

Ejemplo de `.gitignore`:
```
database.config.json
data-export.json
```

