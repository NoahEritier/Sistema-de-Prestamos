-- ============================================
-- Script de Creación de Base de Datos
-- Sistema de Préstamos
-- ============================================

-- Crear base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS freedb_sistema_de_prestamos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE freedb_sistema_de_prestamos;

-- ============================================
-- Tabla: users (Usuarios del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: clients (Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(200),
    direccion TEXT,
    fecha_registro DATETIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_documento (documento),
    INDEX idx_nombre (nombre, apellido),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: loans (Préstamos)
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(50) PRIMARY KEY,
    cliente_id VARCHAR(50) NOT NULL,
    cliente_nombre VARCHAR(200) NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    tasa_interes DECIMAL(5, 2) NOT NULL,
    tipo_plazo ENUM('semanal', 'quincenal', 'mensual') NOT NULL,
    cantidad_cuotas INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_vencimiento DATETIME NOT NULL,
    estado ENUM('activo', 'completado', 'vencido', 'cancelado') DEFAULT 'activo',
    monto_pendiente DECIMAL(15, 2) NOT NULL,
    cuota_mensual DECIMAL(15, 2) NOT NULL,
    cuotas_pagadas INT DEFAULT 0,
    cuotas_totales INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE RESTRICT,
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_vencimiento (fecha_vencimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: cuotas (Cuotas de préstamos)
-- ============================================
CREATE TABLE IF NOT EXISTS cuotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prestamo_id VARCHAR(50) NOT NULL,
    numero INT NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    fecha_vencimiento DATETIME NOT NULL,
    fecha_pago DATETIME NULL,
    estado ENUM('pendiente', 'pagada', 'vencida') DEFAULT 'pendiente',
    monto_pagado DECIMAL(15, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (prestamo_id) REFERENCES loans(id) ON DELETE CASCADE,
    UNIQUE KEY uk_prestamo_numero (prestamo_id, numero),
    INDEX idx_prestamo_id (prestamo_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_vencimiento (fecha_vencimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: payments (Pagos)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    prestamo_id VARCHAR(50) NOT NULL,
    cliente_id VARCHAR(50) NOT NULL,
    cliente_nombre VARCHAR(200) NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    tipo ENUM('cuota', 'abono', 'pago_completo') NOT NULL,
    numero_cuota INT NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestamo_id) REFERENCES loans(id) ON DELETE RESTRICT,
    FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE RESTRICT,
    INDEX idx_prestamo_id (prestamo_id),
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Datos iniciales: Usuario por defecto
-- ============================================
-- Nota: El password hash se generará en el script de migración
-- Usuario: damian
-- Password: 2Ye3r!R4

-- ============================================
-- Vistas útiles (opcional)
-- ============================================

-- Vista: Préstamos activos con información del cliente
CREATE OR REPLACE VIEW v_loans_activos AS
SELECT 
    l.id,
    l.cliente_id,
    l.cliente_nombre,
    c.documento,
    c.telefono,
    l.monto,
    l.tasa_interes,
    l.tipo_plazo,
    l.cantidad_cuotas,
    l.fecha_inicio,
    l.fecha_vencimiento,
    l.estado,
    l.monto_pendiente,
    l.cuota_mensual,
    l.cuotas_pagadas,
    l.cuotas_totales,
    (l.cuotas_totales - l.cuotas_pagadas) AS cuotas_restantes
FROM loans l
LEFT JOIN clients c ON l.cliente_id = c.id
WHERE l.estado = 'activo';

-- Vista: Cuotas vencidas
CREATE OR REPLACE VIEW v_cuotas_vencidas AS
SELECT 
    c.id,
    c.prestamo_id,
    c.numero,
    c.monto,
    c.fecha_vencimiento,
    c.estado,
    l.cliente_nombre,
    l.cliente_id,
    DATEDIFF(NOW(), c.fecha_vencimiento) AS dias_vencido
FROM cuotas c
INNER JOIN loans l ON c.prestamo_id = l.id
WHERE c.estado = 'vencida' OR (c.estado = 'pendiente' AND c.fecha_vencimiento < NOW());

-- ============================================
-- Fin del script
-- ============================================

