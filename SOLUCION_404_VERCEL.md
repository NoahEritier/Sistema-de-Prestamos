# Solución al Error 404 en Vercel

## 🔴 Problema

Error `404: NOT_FOUND` al acceder a rutas como `/clientes`, `/prestamos`, etc.

## ✅ Solución

### Paso 1: Verificar vercel.json

El archivo `vercel.json` debe tener esta configuración (ya está actualizado):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/sistema-de-prestamos",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Paso 2: Verificar en Vercel Dashboard

1. Ve a tu proyecto en Vercel
2. Settings → General
3. Verifica:
   - **Framework Preset**: Angular (o "Other")
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/sistema-de-prestamos`
   - **Install Command**: `npm install`

### Paso 3: Redesplegar

**Opción A: Desde GitHub**
- Haz un commit y push (aunque no cambies nada)
- Vercel redespelgará automáticamente

**Opción B: Desde Dashboard**
- Ve a Deployments
- Click en los 3 puntos del último deployment
- "Redeploy"

**Opción C: Desde CLI**
```bash
vercel --prod
```

### Paso 4: Verificar el Build

Asegúrate de que el build local funcione:

```bash
npm run build
```

Verifica que se cree la carpeta `dist/sistema-de-prestamos` con:
- `index.html`
- Archivos JS y CSS
- Carpeta `assets` (si existe)

## 🔍 Verificaciones Adicionales

### 1. Verificar base href

En `src/index.html` debe estar:
```html
<base href="/">
```

### 2. Verificar rutas en Angular

Las rutas deben estar configuradas en `src/app/app.routes.ts` con lazy loading.

### 3. Verificar Output Directory

En `angular.json`:
```json
"outputPath": "dist/sistema-de-prestamos"
```

Debe coincidir con `outputDirectory` en `vercel.json`.

## 🚨 Si el Problema Persiste

### Solución Alternativa: Configuración Manual en Vercel

1. Ve a **Settings → Build & Development Settings**
2. Configura manualmente:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/sistema-de-prestamos`
   - **Install Command**: `npm install`
3. Guarda y redesplega

### Verificar Logs

1. Ve a **Deployments**
2. Click en el deployment fallido
3. Revisa los **Build Logs**
4. Busca errores de compilación

### Limpiar Cache

Si el problema persiste:
1. En Vercel Dashboard → Settings → General
2. Click en "Clear Build Cache"
3. Redesplegar

## 📝 Checklist de Verificación

- [ ] `vercel.json` tiene `rewrites` configurado
- [ ] `outputDirectory` coincide con `outputPath` en `angular.json`
- [ ] `base href="/"` en `index.html`
- [ ] Build local funciona: `npm run build`
- [ ] La carpeta `dist/sistema-de-prestamos` se crea correctamente
- [ ] `index.html` existe en la carpeta de salida
- [ ] Redesplegado después de cambios

## 🎯 Configuración Final Recomendada

Si nada funciona, usa esta configuración mínima en Vercel Dashboard:

```
Framework: Other
Build Command: npm run build
Output Directory: dist/sistema-de-prestamos
Install Command: npm install
```

Y elimina `vercel.json` temporalmente para que Vercel use la configuración del dashboard.

