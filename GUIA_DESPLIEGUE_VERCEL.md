# Guía de Despliegue en Vercel

Guía completa paso a paso para desplegar el Sistema de Gestión de Préstamos en Vercel.

## 📋 Requisitos Previos

1. **Cuenta de Vercel**: Crear cuenta en [vercel.com](https://vercel.com)
2. **Repositorio Git**: Código en GitHub, GitLab o Bitbucket
3. **Node.js**: Versión 18 o superior (Vercel lo detecta automáticamente)

## 🚀 Pasos para Desplegar

### Opción 1: Despliegue desde GitHub (Recomendado)

#### Paso 1: Preparar el Repositorio

1. **Asegúrate de tener todos los archivos en Git**:
```bash
git add .
git commit -m "Preparación para despliegue en Vercel"
git push origin main
```

2. **Verifica que estos archivos estén incluidos**:
   - ✅ `package.json`
   - ✅ `angular.json`
   - ✅ `tsconfig.json`
   - ✅ `vercel.json`
   - ✅ `src/` (todo el código fuente)

#### Paso 2: Conectar con Vercel

1. **Inicia sesión en Vercel**: [vercel.com/login](https://vercel.com/login)

2. **Importar Proyecto**:
   - Click en "Add New..." → "Project"
   - Conecta tu repositorio (GitHub/GitLab/Bitbucket)
   - Selecciona el repositorio `Sistema-de-Prestamos`

3. **Configuración del Proyecto**:
   Vercel detectará automáticamente Angular, pero verifica:
   
   - **Framework Preset**: Angular (debe detectarse automáticamente)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (ya configurado en vercel.json)
   - **Output Directory**: `dist/sistema-de-prestamos` (ya configurado)
   - **Install Command**: `npm install` (por defecto)

4. **Variables de Entorno**: 
   - **No se requieren** para este proyecto (todo funciona en el cliente)

5. **Click en "Deploy"**

#### Paso 3: Verificar el Despliegue

1. Vercel construirá la aplicación (puede tardar 2-5 minutos)
2. Una vez completado, recibirás una URL: `https://tu-proyecto.vercel.app`
3. Prueba la aplicación:
   - Accede a la URL
   - Verifica que el login funcione
   - Prueba las funcionalidades principales

### Opción 2: Despliegue con Vercel CLI

#### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

#### Paso 2: Login en Vercel

```bash
vercel login
```

#### Paso 3: Desplegar

```bash
# Desde la raíz del proyecto
vercel

# Para producción
vercel --prod
```

Sigue las instrucciones en la terminal:
- ¿Set up and deploy? → **Y**
- ¿Which scope? → Selecciona tu cuenta
- ¿Link to existing project? → **N** (primera vez) o **Y** (si ya existe)
- ¿Project name? → `sistema-de-prestamos` (o el que prefieras)
- ¿Directory? → `./` (raíz)

## ⚙️ Configuración en Vercel Dashboard

Una vez desplegado, puedes configurar:

### Settings → General

- **Project Name**: Nombre de tu proyecto
- **Framework**: Angular (detectado automáticamente)

### Settings → Build & Development Settings

Verifica que esté configurado así:
```
Build Command: npm run build
Output Directory: dist/sistema-de-prestamos
Install Command: npm install
```

### Settings → Domains

- Puedes agregar un dominio personalizado
- Vercel proporciona SSL automáticamente

## 🔧 Archivo vercel.json

El proyecto ya incluye `vercel.json` con la configuración correcta:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/sistema-de-prestamos",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**¿Qué hace esto?**
- `rewrites`: Redirige todas las rutas a `index.html` (necesario para SPA de Angular)
- `outputDirectory`: Especifica dónde está el build
- `framework`: Ayuda a Vercel a optimizar el despliegue

## ⚠️ Consideraciones Importantes

### 1. Almacenamiento de Datos (localStorage)

**IMPORTANTE**: Los datos se almacenan en el `localStorage` del navegador del usuario.

**Implicaciones**:
- ✅ Cada usuario tiene sus propios datos
- ✅ Los datos persisten entre sesiones
- ⚠️ Si el usuario limpia el navegador, se pierden los datos
- ⚠️ No hay sincronización entre dispositivos
- ⚠️ No hay backup automático

**Recomendación para Producción**:
- Considera migrar a un backend con base de datos
- Implementa exportación periódica de datos
- Educa a los usuarios sobre backups

### 2. Credenciales de Acceso

Las credenciales por defecto son:
- **Usuario**: `damian`
- **Contraseña**: `2Ye3r!R4`

**Recomendación**:
- Cambia la contraseña después del primer login
- Considera implementar cambio de contraseña
- Para producción, implementa múltiples usuarios

### 3. HTTPS

Vercel proporciona HTTPS automáticamente. ✅

### 4. Variables de Entorno

No se requieren variables de entorno para este proyecto.

Si en el futuro necesitas agregar variables:
1. Ve a Settings → Environment Variables
2. Agrega las variables necesarias
3. Vuelve a desplegar

### 5. Límites de Vercel (Plan Gratuito)

- **100GB bandwidth/mes**: Suficiente para uso moderado
- **100 builds/mes**: Suficiente para desarrollo
- **Funciones serverless**: No se usan en este proyecto

### 6. Actualizaciones Automáticas

Si conectaste con GitHub:
- Cada `git push` a la rama principal desplegará automáticamente
- Puedes desactivar esto en Settings → Git

### 7. Builds Fallidos

Si el build falla:
1. Revisa los logs en Vercel Dashboard
2. Prueba localmente: `npm run build`
3. Verifica que todas las dependencias estén en `package.json`
4. Asegúrate de que `node_modules` esté en `.gitignore`

## 🧪 Pruebas Post-Despliegue

Después del despliegue, verifica:

### ✅ Checklist de Verificación

- [ ] La aplicación carga correctamente
- [ ] El login funciona con las credenciales
- [ ] El dashboard muestra correctamente
- [ ] Se pueden crear clientes
- [ ] Se pueden crear préstamos
- [ ] Se pueden registrar pagos
- [ ] Los comprobantes PDF se generan
- [ ] La exportación a Excel funciona
- [ ] Los gráficos se muestran correctamente
- [ ] Las rutas funcionan (navegación)
- [ ] El diseño es responsive

### Pruebas Específicas

1. **Login**:
   ```
   Usuario: damian
   Contraseña: 2Ye3r!R4
   ```

2. **Crear Cliente**:
   - Nombre: Test
   - Apellido: Cliente
   - Documento: 12345678

3. **Crear Préstamo**:
   - Cliente: Test Cliente
   - Monto: 100000
   - Tipo: Mensual
   - Cuotas: 12

4. **Registrar Pago**:
   - Seleccionar el préstamo creado
   - Tipo: Cuota
   - Verificar que se genere el PDF

## 🔄 Actualizaciones Futuras

### Para Actualizar la Aplicación

1. **Haz cambios en tu código local**
2. **Prueba localmente**: `npm start`
3. **Commit y push**:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push origin main
   ```
4. **Vercel desplegará automáticamente** (si está conectado a Git)

### Despliegue Manual

Si prefieres desplegar manualmente:
```bash
vercel --prod
```

## 🐛 Solución de Problemas

### Problema: Build falla

**Solución**:
1. Verifica los logs en Vercel
2. Prueba localmente: `npm run build`
3. Verifica que todas las dependencias estén instaladas
4. Asegúrate de usar Node.js 18+

### Problema: Rutas no funcionan (404)

**Solución**:
- Verifica que `vercel.json` tenga los `rewrites` configurados
- Asegúrate de que `outputDirectory` sea correcto

### Problema: Los datos no persisten

**Solución**:
- Esto es normal, los datos están en localStorage del navegador
- Cada usuario/dispositivo tiene sus propios datos
- Considera implementar backend para producción

### Problema: Los gráficos no se muestran

**Solución**:
- Verifica que `ng2-charts` esté en `package.json`
- Revisa la consola del navegador para errores
- Asegúrate de que Chart.js esté instalado

## 📊 Monitoreo

Vercel proporciona:
- **Analytics**: Visitas y rendimiento (requiere plan Pro)
- **Logs**: Logs de build y runtime
- **Deployments**: Historial de despliegues

## 🔐 Seguridad en Producción

### Recomendaciones

1. **HTTPS**: Ya está activo automáticamente ✅
2. **Credenciales**: Cambia la contraseña por defecto
3. **Backup**: Implementa exportación periódica de datos
4. **Rate Limiting**: Considera implementar en el futuro
5. **Logs**: Revisa logs de acceso en Vercel

## 📝 Notas Finales

- **Primera vez**: El despliegue puede tardar 3-5 minutos
- **Actualizaciones**: Los despliegues subsecuentes son más rápidos (1-2 min)
- **Dominio**: Puedes usar el dominio de Vercel o agregar uno personalizado
- **Soporte**: Vercel tiene excelente documentación y soporte

## 🎯 Resumen Rápido

1. ✅ Código en GitHub/GitLab/Bitbucket
2. ✅ Conectar repositorio en Vercel
3. ✅ Verificar configuración (ya está en vercel.json)
4. ✅ Click en Deploy
5. ✅ Probar la aplicación
6. ✅ ¡Listo!

---

**¿Necesitas ayuda?** Revisa los logs en Vercel Dashboard o la documentación oficial de Vercel.

