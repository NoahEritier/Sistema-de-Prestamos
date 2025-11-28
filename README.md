# Sistema de Gestión de Préstamos

Sistema completo para la gestión de préstamos desde la perspectiva del prestamista. Desarrollado en Angular con diseño moderno en tonos bordos y rojos.

## Características

- ✅ **Autenticación segura**: Sistema de login con contraseñas hasheadas (SHA256)
- ✅ **Dashboard con métricas**: Vista general con estadísticas clave del negocio
- ✅ **Gestión de clientes**: CRUD completo para administrar la base de datos de clientes
- ✅ **Gestión de préstamos**: Crear y administrar préstamos con cálculo automático de cuotas
- ✅ **Registro de pagos**: Sistema completo para registrar pagos (cuotas, abonos, pagos completos)
- ✅ **Generación de comprobantes**: Exportación de comprobantes en PDF (pago y préstamo)
- ✅ **Almacenamiento local**: Todos los datos se guardan en localStorage (simulando archivos JSON)
- ✅ **Diseño moderno**: Interfaz atractiva en tonos bordos y rojos

## Credenciales por Defecto

- **Usuario**: `admin`
- **Contraseña**: `password`

También disponible:
- **Usuario**: `prestamista`
- **Contraseña**: `password`

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar el servidor de desarrollo:
```bash
npm start
```

3. Abrir en el navegador:
```
http://localhost:4200
```

## Despliegue en Vercel

1. Construir la aplicación:
```bash
npm run build
```

2. La carpeta `dist/sistema-de-prestamos` contiene los archivos listos para desplegar.

3. En Vercel:
   - Conectar tu repositorio
   - Framework Preset: Angular
   - Build Command: `npm run build`
   - Output Directory: `dist/sistema-de-prestamos`

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── login/          # Componente de inicio de sesión
│   │   ├── dashboard/      # Dashboard con métricas
│   │   ├── clients/        # Gestión de clientes
│   │   ├── loans/          # Gestión de préstamos
│   │   ├── payments/       # Gestión de pagos
│   │   └── header/         # Barra de navegación
│   ├── services/
│   │   ├── auth.service.ts      # Autenticación
│   │   ├── storage.service.ts   # Almacenamiento local
│   │   ├── loan.service.ts      # Lógica de préstamos
│   │   └── receipt.service.ts   # Generación de comprobantes
│   ├── models/             # Modelos de datos
│   └── guards/             # Guards de autenticación
├── styles.scss             # Estilos globales
└── index.html
```

## Funcionalidades

### Dashboard
- Métricas en tiempo real: Total prestado, pendiente por cobrar, recuperado
- Contadores: Clientes activos, préstamos activos, préstamos vencidos
- Tablas de préstamos y pagos recientes

### Clientes
- Crear, editar y eliminar clientes
- Activar/desactivar clientes
- Información completa: nombre, documento, contacto, dirección

### Préstamos
- Crear préstamos con cálculo automático de cuotas
- Configurar tasa de interés y plazo
- Seguimiento de monto pendiente y estado

### Pagos
- Registrar pagos (cuotas, abonos, pagos completos)
- Generación automática de comprobantes PDF
- Actualización automática del estado del préstamo

## Notas Técnicas

- Los datos se almacenan en `localStorage` del navegador
- Las contraseñas se hashean con SHA256 antes de almacenar
- Los comprobantes se generan usando jsPDF
- El sistema está preparado para migrar a un backend real

## Tecnologías Utilizadas

- Angular 17
- TypeScript
- SCSS
- crypto-js (para hashing)
- jsPDF (para generación de PDFs)
- RxJS

## Licencia

Este proyecto es de uso privado.

