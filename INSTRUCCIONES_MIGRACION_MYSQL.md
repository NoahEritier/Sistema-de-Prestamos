# Instrucciones de Migración a MySQL

## ✅ Archivos Creados

1. **server.js** - Servidor Express con todas las rutas API
2. **database.sql** - Script SQL para crear las tablas
3. **database.config.json** - Configuración de la base de datos
4. **src/app/services/api.service.ts** - Servicio para hacer llamadas HTTP
5. **src/environments/environment.ts** - Configuración de entorno
6. **src/environments/environment.prod.ts** - Configuración de producción

## ✅ Archivos Actualizados

1. **src/main.ts** - Agregado HttpClient
2. **src/app/services/storage.service.ts** - Ahora usa ApiService (Observables)
3. **src/app/services/auth.service.ts** - Ahora usa ApiService (Observables)
4. **src/app/guards/auth.guard.ts** - Actualizado para usar Observables
5. **package.json** - Agregadas dependencias: express, mysql2, cors, dotenv

## ⚠️ Archivos que Necesitan Actualización

Los siguientes componentes necesitan ser actualizados para usar Observables:

### 1. src/app/components/clients/clients.component.ts
- `loadClients()` debe suscribirse al Observable
- `saveClient()`, `updateClient()`, `deleteClient()` deben usar `.subscribe()`

### 2. src/app/components/loans/loans.component.ts
- `loadLoans()`, `loadClients()` deben suscribirse
- `saveLoan()`, `updateLoan()` deben usar `.subscribe()`

### 3. src/app/components/payments/payments.component.ts
- `loadPayments()`, `loadLoans()` deben suscribirse
- `savePayment()` debe usar `.subscribe()`

### 4. src/app/components/dashboard/dashboard.component.ts
- `loadMetrics()`, `loadChartsData()` deben suscribirse a los Observables

### 5. src/app/components/login/login.component.ts
- `onSubmit()` debe usar `.subscribe()` en lugar de resultado directo

### 6. src/app/services/loan.service.ts
- Métodos que usan `storageService` deben retornar Observables

## 🚀 Pasos para Completar la Migración

### Paso 1: Instalar Dependencias

```bash
npm install express mysql2 cors dotenv
```

### Paso 2: Crear Base de Datos

Ejecuta el script `database.sql` en tu servidor MySQL.

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```
DB_HOST=sql.freedb.tech
DB_USER=freedb_sistema_de_prestamos5001
DB_PASSWORD=Fk*4!WZWHp@sFh*
DB_NAME=freedb_sistema_de_prestamos
PORT=3000
```

### Paso 4: Iniciar el Servidor Backend

```bash
npm run server
```

El servidor estará disponible en `http://localhost:3000`

### Paso 5: Actualizar Componentes

Todos los componentes que usan `storageService` deben:
1. Suscribirse a los Observables
2. Manejar errores con `.catchError()` o `.subscribe({ error: ... })`
3. Actualizar la UI cuando los datos cambien

### Ejemplo de Actualización:

**Antes:**
```typescript
loadClients(): void {
  this.clients = this.storageService.getClients();
}
```

**Después:**
```typescript
loadClients(): void {
  this.storageService.getClients().subscribe({
    next: (clients) => {
      this.clients = clients;
    },
    error: (error) => {
      this.toastService.error('Error al cargar clientes');
      console.error(error);
    }
  });
}
```

## 📝 Notas Importantes

1. **Autenticación**: El token se guarda en `localStorage` como `auth_token`
2. **CORS**: El servidor tiene CORS habilitado para desarrollo
3. **Sesiones**: Las sesiones se guardan en la tabla `user_sessions` en MySQL
4. **Usuario por defecto**: Se crea automáticamente al iniciar el servidor (damian / 2Ye3r!R4)

## 🔧 Solución de Problemas

### Error: "Cannot find module 'express'"
```bash
npm install express mysql2 cors dotenv
```

### Error: "ECONNREFUSED"
- Verifica que el servidor esté corriendo en el puerto 3000
- Verifica la configuración de la base de datos en `.env`

### Error: "Access denied for user"
- Verifica las credenciales en `.env`
- Asegúrate de que la base de datos existe y el usuario tiene permisos

## 🎯 Próximos Pasos

1. Actualizar todos los componentes para usar Observables
2. Probar todas las funcionalidades
3. Configurar el backend para producción
4. Actualizar `environment.prod.ts` con la URL del backend en producción

