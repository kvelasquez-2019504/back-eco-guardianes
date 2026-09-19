# 🌱 Eco-Guardianes API (Backend)

API RESTful y motor de gamificación escolar para la plataforma **Eco-Guardianes** del Colegio Kinal. Diseñada para registrar, auditar, clasificar y premiar acciones ecológicas dentro de las jornadas educativas, integrando almacenamiento binario optimizado para evidencias fotográficas y un sistema de evaluación híbrido.

---

## 📋 Tabla de Contenidos
- [Características del Sistema](#-características-del-sistema)
- [Arquitectura y Tecnologías](#-arquitectura-y-tecnologías)
- [Requisitos Previos e Instalación](#-requisitos-previos-e-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Catálogo General de Endpoints](#-catálogo-general-de-endpoints)
- [Guía de Integración para el Frontend](#-guía-de-integración-para-el-frontend)
  - [1. Autenticación y Formato de Respuestas](#1-autenticación-y-formato-de-respuestas)
  - [2. Registro de Evidencias (Carga de Imágenes con Multer)](#2-registro-de-evidencias-carga-de-imágenes-con-multer)
  - [3. Feeds y Consulta de Publicaciones](#3-feeds-y-consulta-de-publicaciones)
  - [4. Renderizado Directo de Imágenes (Streaming)](#4-renderizado-directo-de-imágenes-streaming)
  - [5. Calificación Híbrida de Publicaciones](#5-calificación-híbrida-de-publicaciones)
  - [6. Manejo de Errores y Códigos HTTP](#6-manejo-de-errores-y-códigos-http)
- [Ejemplos de Implementación en React](#-ejemplos-de-implementación-en-react)

---

## 🚀 Características del Sistema

1. **Almacenamiento Multimedia Optimizado en MongoDB:**
   * Sustitución completa de cadenas Base64 por buffers binarios (`Buffer` / `BinData` BSON) mediante **Multer** (`memoryStorage`).
   * Desacoplamiento de red: Las consultas de feeds (`GET /post`) no transmiten arreglos de bytes pesados; en su lugar, devuelven URLs semánticas.
   * Endpoint de streaming dedicado (`GET /post/:id/image/:index`) con cabeceras de caché (`Cache-Control: public, max-age=86400`) y `Content-Type` dinámico.
2. **Control de Horario Escolar Estricto (Kinal GMT-6):**
   * Validación automática en tiempo real que solo permite publicar evidencias de lunes a viernes dentro del horario oficial según el ciclo y la jornada.
3. **Evaluación Híbrida de Evidencias:**
   * **Oficial (Docentes, Coordinadores, Admin):** Otorga puntos oficiales al ranking bimestral de la sección y al Eco-Aura del autor.
   * **Comunitaria (Revisión entre pares por Estudiantes):** Sin tope de revisores, con reglas antifraude (prohibida autoevaluación y doble voto) y recompensa de **+5 puntos de Eco-Aura** al revisor.
4. **Gamificación (Eco-Aura):**
   * Niveles automáticos (`NOVATO`, `GUARDIAN`, `LEYENDA`) basados en puntos acumulados por cada estudiante.
5. **Turnos de Guardia y Rotación Bimestral:**
   * Calendario automatizado de 8 semanas de guardia por bimestre con asignación de bonos de guardia institucional.
6. **Rankings y Cierres Bimestrales:**
   * Tablas de posiciones colectivas por sección y ranking individual de alumnos, con congelamiento inmutable de podios al cierre de cada bimestre.

---

## 🛠 Arquitectura y Tecnologías

* **Entorno de Ejecución:** Node.js `>= 20.0.0` (ES Modules nativos).
* **Framework Web:** Express.js 5.
* **Base de Datos:** MongoDB `>= 6.0` con Mongoose ODM.
* **Manejo de Archivos:** Multer 2.x (`memoryStorage`).
* **Seguridad y Validación:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `express-validator`, `helmet`, `cors`, `express-rate-limit`.
* **Gestor de Paquetes:** `pnpm`.

---

## 📦 Requisitos Previos e Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/kvelasquez-2019504/back-eco-guardianes.git
   cd back-eco-guardianes
   ```

2. **Instalar dependencias con pnpm:**
   ```bash
   pnpm install
   ```

3. **Configurar el archivo de entorno (`.env`):**
   Crear un archivo `.env` en la raíz del proyecto tomando como base la siguiente sección.

4. **Sembrar datos base (opcional, el servidor también lo ejecuta al arrancar):**
   ```bash
   pnpm seed
   ```

5. **Iniciar en modo desarrollo:**
   ```bash
   pnpm dev
   ```

6. **Iniciar en modo producción:**
   ```bash
   pnpm start
   ```

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha del servidor HTTP | `3000` |
| `ROUTER_PATH_MASTER` | Prefijo base de las rutas de la API | `/eco-guardians/v1` |
| `URI_MONGODB` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/eco_guardians_db` |
| `SECRETORPRIVATEKEY` | Clave secreta para firmar tokens JWT | `clave_secreta_kinal_2026` |

---

## 📚 Catálogo General de Endpoints

Ruta base: `http://localhost:3000/eco-guardians/v1`

### 1. Autenticación (`/auth`)
| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Público | Autenticación con correo y contraseña. Retorna JWT y datos de usuario. |
| `GET` | `/auth/renew` | Bearer Token | Revalida el JWT y renueva la sesión del usuario. |

### 2. Usuarios (`/users`)
| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Bearer Token | Listado de usuarios activos con paginación (`limit`, `from`) y filtro por rol. |
| `GET` | `/users/:id` | Bearer Token | Consulta detalle de un usuario por su ID. |
| `POST` | `/users` | Condicional | Registro de usuarios (público solo permite `STUDENT`; `ADMIN`/`COORDINATOR` pueden crear otros roles). |
| `PUT` | `/users/:id` | Bearer Token | Actualización de datos de perfil con control de privilegios. |
| `DELETE` | `/users/:id` | Bearer Token | Desactivación lógica (*soft delete*) de usuario. |

### 3. Publicaciones de Evidencias Ecológicas (`/post`)
| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/post` | `STUDENT`, `ADMIN` | **Publicar evidencia:** Carga multipart de 1 a 4 imágenes y descripción. Valida horario escolar Kinal. |
| `GET` | `/post` | Bearer Token | Feed general paginado (`?classGroupId=`, `?shift=`, `?studentId=`). |
| `GET` | `/post/my-posts` | `STUDENT`, `ADMIN` | Consulta de las publicaciones del estudiante autenticado. |
| `GET` | `/post/:id` | Bearer Token | Detalle completo de una publicación y su desglose de evaluaciones. |
| `GET` | `/post/:id/image/:index` | **Público** | **Streaming de imagen binaria:** Retorna los bytes directamente con cabecera `Content-Type` y caché para renderizado web. |
| `POST` | `/post/:id/evaluate` | Bearer Token | **Calificación híbrida:** Evaluación oficial o revisión comunitaria según rol. |
| `DELETE` | `/post/:id` | Autor o `ADMIN` | Desactivación lógica de la publicación. |

### 4. Niveles y Carreras (`/level`, `/career`)
* `GET /level` & `POST /level/seed`: Consulta y sembrado de los 6 niveles educativos de Kinal (Básicos y Diversificado).
* `GET /career` & `POST /career/seed`: Consulta y sembrado de especialidades técnicas (Informática, Electrónica, Dibujo).

### 5. Clases y Matrículas (`/class`, `/enrollment`)
* `GET /class/my-classes`: Clases que imparte el profesor logueado.
* `GET /enrollment/my-enrollment`: Clases y jornada en las que está inscrito el alumno logueado.
* `POST /enrollment`: Inscripción de alumnos a sección y jornada (`MATUTINA` o `VESPERTINA`).

### 6. Rúbrica Oficial de Evaluación (`/rubric`)
* `GET /rubric`: Listado de criterios evaluables vigentes.
* `POST /rubric/seed`: Sembrado de criterios oficiales predefinidos de clasificación y limpieza.

### 7. Turnos de Guardia (`/turn`)
* `GET /turn/current`: Turno semanal activo según la fecha actual con las secciones de guardia.
* `POST /turn/generate-schedule`: Generación automática de la matriz bimestral de 8 semanas.
* `POST /turn/:id/bonus`: Asignación de bono de guardia institucional a una sección destacada.

### 8. Clasificación y Rankings (`/ranking`)
* `GET /ranking/collective`: Leaderboard de secciones por puntos oficiales y bonos de guardia (podio Top 3 y tabla general).
* `GET /ranking/individual`: Ranking de estudiantes por puntos de Eco-Aura y nivel.
* `GET /ranking/history`: Consulta de podios bimestrales históricos archivados.
* `POST /ranking/close-bimester`: Cierre y congelamiento inmutable de podios bimestrales (`RankingHistory`).

---

## 💻 Guía de Integración para el Frontend

### 1. Autenticación y Formato de Respuestas

* **Base URL:** `http://localhost:3000/eco-guardians/v1`
* **Cabecera obligatoria en rutas protegidas:**
  ```http
  Authorization: Bearer <TOKEN_JWT>
  ```
* **Identificador universal:** Todo objeto retornado en la API utiliza **`uid`** como clave de identificación (el servidor transforma automáticamente el `_id` de MongoDB).

---

### 2. Registro de Evidencias (Carga de Imágenes con Multer)

#### `POST /eco-guardians/v1/post`
Permite a un estudiante subir una acción ecológica con sus respectivas fotografías de evidencia.

#### Especificación de Cabeceras
```http
Authorization: Bearer <TOKEN_JWT>
Content-Type: multipart/form-data
```
> [!CAUTION]
> **No colocar manualmente `'Content-Type': 'multipart/form-data'` en Axios o Fetch.**
> Al enviar un objeto `FormData`, el cliente HTTP genera de forma nativa la cabecera con el delimitador `boundary`. Si se fuerza manualmente, el servidor no podrá descomponer el flujo multipart y devolverá error.

#### Campos del Formulario (`FormData`)
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `description` | `string` | **Sí** | Descripción textual de la labor ecológica realizada. |
| `images` | `File[]` | **Sí** | De 1 a 4 archivos de imagen binarios (`File` o `Blob`). |

#### Validaciones y Restricciones
1. **Restricciones de Archivos:**
   * **Formatos soportados:** `image/jpeg`, `image/png`, `image/webp`, `image/jpg`.
   * **Tamaño máximo:** **5 MB** por imagen.
   * **Límite de cantidad:** Mínimo **1**, máximo **4** imágenes por publicación.
2. **Restricción de Matrícula Activa:**
   * El usuario autenticado debe tener rol `STUDENT` y contar con un registro activo en `Enrollment`.
3. **Restricción de Horario Escolar Kinal (GMT-6):**
   * Las publicaciones solo se admiten de **lunes a viernes** en las siguientes ventanas:
     * **Básicos:** `07:00` a `13:15`.
     * **Diversificado Jornada Matutina:** `07:00` a `12:05`.
     * **Diversificado Jornada Vespertina:** `12:40` a `17:40`.
   * Intentos fuera de estos horarios o durante fines de semana son denegados con `400 Bad Request`.

---

### 3. Feeds y Consulta de Publicaciones

#### `GET /eco-guardians/v1/post`
Retorna el feed de publicaciones con URLs semánticas para las imágenes.

#### Formato de la Respuesta JSON
```json
{
  "ok": true,
  "msg": "Publicaciones obtenidas exitosamente.",
  "total": 1,
  "posts": [
    {
      "uid": "6aaacba2310e3922ef5f43dd",
      "description": "Clasificación de residuos orgánicos en cafetería",
      "shift": "MATUTINA",
      "academicYear": 2026,
      "publishedAt": "2026-09-16T15:30:00.000Z",
      "officialScore": 25,
      "communityScore": 10,
      "totalEcoAuraEarned": 35,
      "isOfficiallyVerified": true,
      "images": [
        {
          "uid": "6aaacba2310e3922ef5f43de",
          "contentType": "image/jpeg",
          "url": "/eco-guardians/v1/post/6aaacba2310e3922ef5f43dd/image/0"
        },
        {
          "uid": "6aaacba2310e3922ef5f43df",
          "contentType": "image/png",
          "url": "/eco-guardians/v1/post/6aaacba2310e3922ef5f43dd/image/1"
        }
      ],
      "student": {
        "uid": "6aa9dd3c805bf151fd23a9bf",
        "name": "Carlos",
        "lastName": "López",
        "code": "2022001",
        "ecoAura": {
          "points": 120,
          "level": "NOVATO"
        }
      },
      "classGroup": {
        "uid": "6aa9eb12805bf151fd23a9c5",
        "name": "5to Bachillerato en Computación",
        "section": "A",
        "type": "TALLER"
      }
    }
  ]
}
```

---

### 4. Renderizado Directo de Imágenes (Streaming)

#### `GET /eco-guardians/v1/post/:id/image/:index`
* **Acceso Público:** No requiere token en cabeceras.
* **Respuesta:** Flujo de bytes crudo con cabeceras `Content-Type: image/jpeg` y `Cache-Control: public, max-age=86400`.
* **Consumo Nativo en HTML/React:**
  ```jsx
  <img 
    src={`http://localhost:3000${post.images[0].url}`} 
    alt="Evidencia ecológica" 
    loading="lazy" 
  />
  ```

---

### 5. Calificación Híbrida de Publicaciones

#### `POST /eco-guardians/v1/post/:id/evaluate`
* **Content-Type:** `application/json`
* **Cuerpo de la Petición:**
  ```json
  {
    "checks": [
      { "criterionId": "6aa9f982805bf151fd23a9d1", "achieved": true },
      { "criterionId": "6aa9f982805bf151fd23a9d2", "achieved": false }
    ],
    "comment": "Buen trabajo separando el plástico limpio."
  }
  ```
* **Lógica de Roles:**
  * **Docente / Coordinador / Admin:** Otorga puntos oficiales a la sección y al Eco-Aura del autor; marca `isOfficiallyVerified = true`.
  * **Estudiante (Peer Review):** Otorga puntos comunitarios de Eco-Aura al autor y otorga **+5 puntos** al estudiante evaluador.
* **Reglas Antifraude:**
  * No se permite autocalificar publicaciones propias.
  * No se permite calificar más de una vez la misma publicación.

---

### 6. Manejo de Errores y Códigos HTTP

| Código | Causa | Mensaje de Ejemplo |
| :--- | :--- | :--- |
| `400` | Horario escolar no válido | `"Publicación rechazada: Estás fuera del horario de tu jornada..."` |
| `400` | Archivo excede tamaño | `"Una o más imágenes superan el tamaño máximo permitido de 5 MB."` |
| `400` | Más de 4 imágenes | `"Se superó el límite máximo de 4 imágenes por publicación."` |
| `400` | Tipo de archivo no permitido | `"Solo se permiten imágenes JPEG, PNG o WEBP."` |
| `400` | Sin archivos adjuntos | `"Debe incluir al menos una imagen fotográfica como evidencia..."` |
| `400` | Autoevaluación rechazada | `"No puedes calificar tu propia publicación."` |
| `401` | Token no proporcionado o inválido | `"Token no válido o expirado."` |
| `403` | Permiso denegado por rol | `"No tienes permisos para realizar esta acción."` |
| `404` | Recurso no encontrado | `"Publicación no encontrada."` o `"Imagen no encontrada."` |

---

## 💡 Ejemplos de Implementación en React

### Servicio de Creación de Publicaciones (`postService.js`)
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/eco-guardians/v1';

export const createPost = async ({ description, files, token }) => {
    const formData = new FormData();
    formData.append('description', description.trim());

    Array.from(files).forEach((file) => {
        formData.append('images', file);
    });

    const response = await axios.post(`${API_URL}/post`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};
```

### Componente de Formulario (`CreatePostModal.jsx`)
```jsx
import React, { useState } from 'react';
import { createPost } from './postService';

export const CreatePostModal = ({ token, onPostCreated, onClose }) => {
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 4) {
            setError('Solo puedes seleccionar hasta 4 imágenes.');
            return;
        }
        setError(null);
        setFiles(selectedFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            setError('Debes adjuntar al menos una fotografía como evidencia.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await createPost({ description, files, token });
            onPostCreated(data.post);
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || err.message || 'Error al publicar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Acción Ecológica</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción de la acción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={3}
                            placeholder="Ej. Clasificación y reciclaje de botellas PET en el laboratorio..."
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fotografías de evidencia (1 a 4 fotos, máx 5MB c/u)
                        </label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {loading ? 'Publicando...' : 'Publicar Evidencia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
```

---

## 👥 Equipo y Créditos

Proyecto desarrollado para la comunidad educativa de **Fundación Kinal** dentro del programa de **Eco-Guardianes**.
