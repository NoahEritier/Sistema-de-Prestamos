# Sistema de Gestión de Préstamos

Sistema completo y profesional para la gestión de préstamos desde la perspectiva del prestamista. Desarrollado en Angular 21 con diseño moderno en tonos bordos y rojos, incluyendo autenticación segura, dashboard con métricas y gráficos, gestión completa de clientes, préstamos y pagos, y generación de comprobantes en PDF.

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Configuración Inicial](#configuración-inicial)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Sistema de Autenticación](#sistema-de-autenticación)
- [Módulos y Funcionalidades](#módulos-y-funcionalidades)
- [Almacenamiento de Datos](#almacenamiento-de-datos)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Estructura del Proyecto](#estructura-del-proyecto)

## ✨ Características Principales

### 🔐 Autenticación Segura
- Sistema de login con hash PBKDF2 (1000 iteraciones)
- Protección contra ataques de fuerza bruta (5 intentos, bloqueo de 15 minutos)
- Sesiones encriptadas con AES
- Expiración automática de sesión (8 horas)
- Validación y sanitización de inputs
- Visualización/ocultación de contraseña

### 📊 Dashboard Interactivo
- Métricas en tiempo real:
  - Total prestado
  - Pendiente por cobrar
  - Total recuperado
  - Clientes activos
  - Préstamos activos/vencidos
- Gráficos interactivos:
  - Estado de cuotas (dona): Pagadas, Pendientes, Vencidas
  - Préstamos por estado (barras)
  - Evolución de pagos últimos 6 meses (línea)
- Tablas de préstamos y pagos recientes
- Exportación a Excel con múltiples hojas

### 👥 Gestión de Clientes
- CRUD completo de clientes
- Validación de eliminación (no permite eliminar si tiene préstamos activos)
- Diálogo de confirmación estilizado
- Activar/desactivar clientes
- Información completa: nombre, documento, contacto, dirección

### 💰 Gestión de Préstamos
- Creación de préstamos con cálculo automático de cuotas
- Tipos de plazo: Semanal, Quincenal, Mensual
- Configuración de tasa de interés y cantidad de cuotas
- Vista detallada de préstamo con:
  - Información general
  - Detalle completo de cuotas (estado, fechas, montos)
  - Generación de comprobante de préstamo
  - Generación de comprobante de pago por cuota
- Seguimiento automático de monto pendiente y estado
- Detección automática de préstamos vencidos

### 💳 Gestión de Pagos
- Registro de pagos (cuotas, abonos, pagos completos)
- Actualización automática del estado del préstamo
- Generación automática de comprobantes PDF
- Historial completo de pagos
- Cálculo automático de cuotas restantes

### 📄 Generación de Comprobantes
- Comprobante de préstamo (PDF)
- Comprobante de pago (PDF)
- Diseño profesional con información completa
- Acceso desde el detalle del préstamo

### 📈 Exportación de Datos
- Exportación a Excel con múltiples hojas:
  - Clientes
  - Préstamos
  - Pagos
- Formato profesional y estructurado
- Fecha automática en el nombre del archivo

## 🛠 Tecnologías Utilizadas

- **Angular 21**: Framework principal
- **TypeScript 5.9**: Lenguaje de programación
- **SCSS**: Preprocesador CSS
- **RxJS 7.8**: Programación reactiva
- **crypto-js 4.2**: Encriptación y hashing
- **jsPDF 3.0**: Generación de PDFs
- **xlsx 0.18**: Exportación a Excel
- **Chart.js / ng2-charts**: Gráficos interactivos
- **Zone.js 0.15**: Detección de cambios

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+ 
- npm 10+

### Pasos de Instalación

1. **Clonar o descargar el repositorio**
```bash
cd Sistema-de-Prestamos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
npm start
```

4. **Abrir en el navegador**
```
http://localhost:4200
```

## ⚙️ Configuración Inicial

### Credenciales de Acceso

El sistema viene con un usuario preconfigurado:

- **Usuario**: `damian`
- **Contraseña**: `2Ye3r!R4`

> **Nota de Seguridad**: Las contraseñas se almacenan usando hash PBKDF2 con salt. Nunca se guardan en texto plano.

### Inicialización de Datos

Al iniciar la aplicación por primera vez, el sistema:
1. Crea automáticamente el usuario por defecto
2. Inicializa las estructuras de almacenamiento
3. Configura las credenciales con hash seguro

Si necesitas resetear los datos:
1. Abre las herramientas de desarrollador (F12)
2. Ve a Application → Local Storage
3. Elimina las claves que comienzan con `prestamos_`

## 🏗 Arquitectura del Sistema

### Patrón de Diseño
El sistema utiliza una arquitectura modular basada en:
- **Componentes Standalone**: Cada componente es independiente
- **Servicios Singleton**: Lógica de negocio centralizada
- **Modelos TypeScript**: Tipado fuerte para datos
- **Guards**: Protección de rutas

### Flujo de Datos
```
Componente → Servicio → StorageService → localStorage
                ↓
           Validaciones
                ↓
           Actualización de Estado
```

## 🔒 Sistema de Autenticación

### Seguridad Implementada

#### 1. Hash de Contraseñas
- **Algoritmo**: PBKDF2 (Password-Based Key Derivation Function 2)
- **Iteraciones**: 1000 (balance entre seguridad y rendimiento)
- **Salt**: Valor fijo único para el sistema
- **Tamaño de clave**: 256 bits

```typescript
// Ejemplo de hash generado
PBKDF2(password, salt, {
  keySize: 256/32,
  iterations: 1000
})
```

#### 2. Protección contra Fuerza Bruta
- **Límite de intentos**: 5 intentos fallidos
- **Duración de bloqueo**: 15 minutos
- **Registro de intentos**: Almacenado en localStorage
- **Limpieza automática**: Los bloqueos expiran automáticamente

#### 3. Gestión de Sesiones
- **Duración**: 8 horas de inactividad
- **Encriptación**: AES-256 para datos de sesión
- **Token único**: Generado con SHA256
- **Verificación periódica**: Cada minuto se verifica la validez

#### 4. Validación de Inputs
- Sanitización de caracteres peligrosos
- Límite de longitud (máximo 100 caracteres)
- Validación de formato
- Prevención de XSS

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Validación de formato
   ↓
3. Verificación de bloqueo
   ↓
4. Búsqueda de usuario
   ↓
5. Hash de contraseña ingresada
   ↓
6. Comparación con hash almacenado
   ↓
7. Generación de sesión encriptada
   ↓
8. Almacenamiento seguro
   ↓
9. Redirección al dashboard
```

## 📦 Módulos y Funcionalidades

### 1. Módulo de Login (`/login`)
**Componente**: `LoginComponent`

**Funcionalidades**:
- Formulario de autenticación
- Validación en tiempo real
- Protección contra fuerza bruta
- Visualización/ocultación de contraseña
- Mensajes de error informativos
- Contador de bloqueo

**Validaciones**:
- Campos requeridos
- Longitud mínima de contraseña (4 caracteres)
- Sanitización de inputs
- Verificación de bloqueo

### 2. Dashboard (`/`)
**Componente**: `DashboardComponent`

**Métricas Principales**:
- Total Prestado: Suma de todos los préstamos otorgados
- Pendiente por Cobrar: Monto total de préstamos activos pendientes
- Total Recuperado: Suma de todos los pagos registrados
- Clientes Activos: Cantidad de clientes con estado activo
- Préstamos Activos: Cantidad de préstamos en estado activo
- Préstamos Vencidos: Cantidad de préstamos con cuotas vencidas

**Gráficos**:
1. **Estado de Cuotas (Dona)**
   - Pagadas (verde)
   - Pendientes (amarillo)
   - Vencidas (rojo)
   - Muestra porcentajes

2. **Préstamos por Estado (Barras)**
   - Activos
   - Completados
   - Vencidos
   - Cancelados

3. **Evolución de Pagos (Línea)**
   - Últimos 6 meses
   - Monto recuperado por mes
   - Tendencias visuales

**Exportación**:
- Botón de exportación a Excel
- Genera archivo con fecha actual
- Múltiples hojas de cálculo

### 3. Gestión de Clientes (`/clientes`)
**Componente**: `ClientsComponent`

**Operaciones**:
- **Crear**: Agregar nuevo cliente con validación
- **Editar**: Modificar información del cliente
- **Eliminar**: Con validación de préstamos activos
- **Activar/Desactivar**: Cambiar estado del cliente

**Validaciones de Eliminación**:
- Verifica si el cliente tiene préstamos activos
- Verifica si el cliente tiene préstamos vencidos
- Muestra mensaje de error si no se puede eliminar
- Diálogo de confirmación antes de eliminar

**Campos del Cliente**:
- Nombre* (requerido)
- Apellido* (requerido)
- Documento* (requerido, único)
- Teléfono
- Email
- Dirección
- Estado (Activo/Inactivo)

### 4. Gestión de Préstamos (`/prestamos`)
**Componente**: `LoansComponent`

**Creación de Préstamos**:
1. Selección de cliente (solo activos)
2. Monto del préstamo
3. Tasa de interés anual (%)
4. Tipo de plazo:
   - Semanal (7 días por cuota)
   - Quincenal (15 días por cuota)
   - Mensual (30 días por cuota)
5. Cantidad de cuotas
6. Fecha de inicio

**Cálculo Automático**:
- Cuota mensual calculada con fórmula de interés compuesto
- Fechas de vencimiento generadas automáticamente
- Array de cuotas creado dinámicamente

**Fórmula de Cálculo**:
```
Cuota = Monto × (tasa_periódica × (1 + tasa_periódica)^cuotas) / ((1 + tasa_periódica)^cuotas - 1)
```

**Vista Detallada**:
- Información general del préstamo
- Tabla completa de cuotas con:
  - Número de cuota
  - Monto
  - Fecha de vencimiento
  - Fecha de pago (si aplica)
  - Estado (pendiente/pagada/vencida)
  - Botón para generar comprobante (si está pagada)
- Generación de comprobante de préstamo

**Estados del Préstamo**:
- **Activo**: Tiene cuotas pendientes
- **Completado**: Todas las cuotas pagadas
- **Vencido**: Tiene cuotas vencidas sin pagar
- **Cancelado**: Préstamo cancelado manualmente

### 5. Gestión de Pagos (`/pagos`)
**Componente**: `PaymentsComponent`

**Tipos de Pago**:
1. **Cuota**: Pago de una cuota específica
   - Selecciona automáticamente la siguiente cuota pendiente
   - Actualiza el estado de la cuota
   - Incrementa contador de cuotas pagadas

2. **Abono**: Pago parcial
   - Reduce el monto pendiente
   - No marca cuotas como pagadas
   - Útil para pagos anticipados

3. **Pago Completo**: Saldar todo el préstamo
   - Marca todas las cuotas como pagadas
   - Establece monto pendiente en 0
   - Cambia estado a "completado"

**Proceso de Registro**:
1. Selección de préstamo (solo activos/vencidos)
2. Tipo de pago
3. Monto (prellenado para cuotas)
4. Fecha del pago
5. Observaciones opcionales
6. Registro y actualización automática
7. Generación de comprobante PDF

### 6. Generación de Comprobantes
**Servicio**: `ReceiptService`

**Comprobante de Préstamo**:
- Encabezado con logo y título
- Información del comprobante (ID, fechas)
- Datos del cliente
- Detalles del préstamo:
  - Monto total
  - Tasa de interés
  - Plazo y tipo
  - Cuota mensual
- Pie de página con información legal

**Comprobante de Pago**:
- Encabezado estilizado
- Información del pago
- Datos del cliente
- Información del préstamo
- Detalle del pago (tipo, cuota, monto)
- Observaciones (si aplica)

## 💾 Almacenamiento de Datos

### Estructura de Datos

El sistema utiliza `localStorage` del navegador para persistir datos. Todas las claves tienen el prefijo `prestamos_`.

#### Claves de Almacenamiento

1. **`prestamos_users`**: Usuarios del sistema
   ```json
   [
     {
       "id": "1",
       "username": "damian",
       "passwordHash": "hash_pbkdf2",
       "name": "Damian",
       "email": "damian@prestamos.com"
     }
   ]
   ```

2. **`prestamos_clients`**: Base de datos de clientes
   ```json
   [
     {
       "id": "id_generado",
       "nombre": "Juan",
       "apellido": "Pérez",
       "documento": "12345678",
       "telefono": "+5491123456789",
       "email": "juan@email.com",
       "direccion": "Calle 123",
       "fechaRegistro": "2024-01-01T00:00:00.000Z",
       "activo": true
     }
   ]
   ```

3. **`prestamos_loans`**: Préstamos otorgados
   ```json
   [
     {
       "id": "id_generado",
       "clienteId": "id_cliente",
       "clienteNombre": "Juan Pérez",
       "monto": 100000,
       "tasaInteres": 12,
       "tipoPlazo": "mensual",
       "cantidadCuotas": 12,
       "fechaInicio": "2024-01-01T00:00:00.000Z",
       "fechaVencimiento": "2024-12-01T00:00:00.000Z",
       "estado": "activo",
       "montoPendiente": 50000,
       "cuotaMensual": 8884.88,
       "cuotasPagadas": 6,
       "cuotasTotales": 12,
       "cuotas": [
         {
           "numero": 1,
           "monto": 8884.88,
           "fechaVencimiento": "2024-02-01T00:00:00.000Z",
           "estado": "pagada",
           "fechaPago": "2024-01-28T00:00:00.000Z",
           "montoPagado": 8884.88
         }
       ]
     }
   ]
   ```

4. **`prestamos_payments`**: Registro de pagos
   ```json
   [
     {
       "id": "id_generado",
       "prestamoId": "id_prestamo",
       "clienteId": "id_cliente",
       "clienteNombre": "Juan Pérez",
       "monto": 8884.88,
       "fecha": "2024-01-28T00:00:00.000Z",
       "tipo": "cuota",
       "numeroCuota": 1,
       "observaciones": "Pago puntual"
     }
   ]
   ```

5. **`prestamos_session`**: Sesión encriptada (AES)
6. **`prestamos_login_attempts`**: Intentos de login fallidos

### Migración de Datos

El sistema incluye lógica de migración automática:
- Detecta préstamos antiguos sin campo `cuotas`
- Crea array de cuotas vacío
- Migra `plazoMeses` a `cantidadCuotas` y `tipoPlazo`

## 🚢 Despliegue en Vercel

### Preparación

1. **Construir la aplicación**
```bash
npm run build
```

2. **Verificar la carpeta de salida**
```
dist/sistema-de-prestamos/
```

### Configuración en Vercel

1. **Conectar repositorio** a Vercel
2. **Configuración del proyecto**:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/sistema-de-prestamos`
   - **Install Command**: `npm install`

3. **Variables de entorno**: No requeridas (todo en localStorage)

4. **Configuración de rutas** (ya incluida en `vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Notas de Despliegue

- El sistema funciona completamente en el cliente
- Los datos se almacenan en el localStorage del navegador
- Cada usuario tiene su propia instancia de datos
- Para producción, considera migrar a un backend con base de datos

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── login/              # Componente de inicio de sesión
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   ├── dashboard/          # Dashboard con métricas y gráficos
│   │   ├── clients/            # Gestión de clientes
│   │   ├── loans/              # Gestión de préstamos
│   │   ├── payments/           # Gestión de pagos
│   │   ├── header/             # Barra de navegación
│   │   ├── toast/              # Sistema de notificaciones
│   │   └── confirm-dialog/     # Diálogos de confirmación
│   ├── services/
│   │   ├── auth.service.ts     # Autenticación y seguridad
│   │   ├── storage.service.ts  # Almacenamiento local
│   │   ├── loan.service.ts    # Lógica de préstamos
│   │   ├── receipt.service.ts # Generación de PDFs
│   │   ├── toast.service.ts   # Notificaciones
│   │   └── excel.service.ts   # Exportación a Excel
│   ├── models/
│   │   ├── user.model.ts      # Modelo de usuario
│   │   ├── client.model.ts    # Modelo de cliente
│   │   ├── loan.model.ts      # Modelo de préstamo y cuotas
│   │   └── payment.model.ts   # Modelo de pago
│   ├── guards/
│   │   └── auth.guard.ts      # Protección de rutas
│   ├── app.component.ts        # Componente raíz
│   └── app.routes.ts          # Configuración de rutas
├── styles.scss                 # Estilos globales
└── main.ts                     # Punto de entrada
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start              # Servidor de desarrollo (puerto 4200)
npm run build          # Construcción para producción
npm run watch          # Construcción en modo watch
npm test               # Ejecutar tests
```

## 🎨 Sistema de Diseño

### Paleta de Colores

- **Primario**: `#8B1538` (Bordó)
- **Primario Oscuro**: `#6B0F2A`
- **Primario Claro**: `#A51E4A`
- **Secundario**: `#C41E3A` (Rojo)
- **Acento**: `#DC143C`
- **Fondo**: `#F8F5F5`
- **Superficie**: `#FFFFFF`
- **Éxito**: `#28A745`
- **Advertencia**: `#FFC107`
- **Error**: `#DC3545`

### Tipografía

- **Fuente Principal**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700

## 🔐 Consideraciones de Seguridad

### Implementadas

✅ Hash seguro de contraseñas (PBKDF2)  
✅ Protección contra fuerza bruta  
✅ Sesiones encriptadas  
✅ Validación de inputs  
✅ Sanitización de datos  
✅ Expiración de sesión  
✅ Tokens únicos de sesión  

### Recomendaciones para Producción

⚠️ **Migrar a backend**: El sistema actual funciona en el cliente. Para producción:
- Implementar API REST
- Base de datos real (PostgreSQL, MySQL, etc.)
- Autenticación JWT
- HTTPS obligatorio
- Rate limiting en servidor
- Logs de auditoría

## 📝 Notas Técnicas

### Rendimiento

- Lazy loading de componentes
- Optimización de bundle
- Verificación de sesión cada minuto (no bloqueante)
- Cálculos de cuotas optimizados

### Compatibilidad

- Navegadores modernos (Chrome, Firefox, Edge, Safari)
- Responsive design (mobile-first)
- Soporte para diferentes resoluciones

### Limitaciones Actuales

- Datos almacenados solo en el navegador
- No hay sincronización entre dispositivos
- No hay backup automático
- No hay recuperación de contraseña

## 🤝 Contribución

Este es un proyecto privado. Para mejoras o sugerencias, contactar al desarrollador.

## 📄 Licencia

Este proyecto es de uso privado. Todos los derechos reservados.

## 📞 Soporte

Para problemas o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: 2024  
**Desarrollado con** ❤️ usando Angular 21
