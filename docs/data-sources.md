# Fuentes de datos de AREO-WALK

Rama de trabajo: `feat/scientific-data`. Última verificación de los servicios: 14-11-2026.

## Clasificación de los datos

| Etiqueta | Significado |
|---|---|
| `real` | Producto científico publicado por una fuente oficial. |
| `derived` | Calculado por nosotros a partir de datos reales (aún no hay ninguno). |
| `synthetic` | Generado para demostración. No es información científica. |

La etiqueta está en el campo `provenance` de cada capa en `src/data/layers.js` y de la base y los waypoints en `src/data/mission.js`.

## Estado actual por elemento

| Elemento | Archivo | Etiqueta | Nota |
|---|---|---|---|
| Mapa base CTX Gale | `layers.js` (`ctxGale`) | real | Ver sección 1. |
| Mapa base Viking color | `layers.js` (`viking`) | real | Mosaico global de 232 m. |
| Mapa base MOLA | `layers.js` (`mola`) | real | Imagen de relieve coloreado, no contiene valores de elevación. |
| Mapas base THEMIS diurno y nocturno | `layers.js` (`themisDay`, `themisNight`) | real | Imágenes infrarrojas de Mars Odyssey. No son temperaturas ni valores térmicos. Ver sección 3. |
| Malla de elevación real | `src/data/grid.json` (`gridFromJson`) | real / derived | Es la malla que usa la app. `elev` es real (media de bloques del DEM de USGS); `slope` y `obstacle` son derivadas. No tiene `thermal`. Ver sección 5. |
| Capa "Pendiente (DEM USGS, 25 m)" | `layers.js` (`slope`) | derived | Pendiente calculada de la malla real. |
| Capa "Sin datos del DEM" | `layers.js` (`obstacle`) | derived | Celdas sin elevación válida (hoy ninguna). No es un mapa de rocas. |
| Malla sintética | `grid.js` (`generateGrid`) | synthetic | Ruido sinusoidal. Ya no la usa la app; se conserva para pruebas. |
| Panel "Planetary protection" | `src/data/planetaryProtection.js` | texto con fuente | Resumen de COSPAR, NASA y National Academies. No clasifica regiones ni evalúa la ruta. Ver sección 7. |
| Base y waypoints | `mission.js` | synthetic | Posiciones aproximadas, sin validar contra la ruta real. |
| Ruta de Curiosity | `layers.js` (`curiosity`) | synthetic | Cuatro puntos de ejemplo. |
| Condiciones de Marte (panel "Mars conditions") | `src/data/marsConditions.json` | real (histórico) | Una observación diaria de REMS en Gale. Viento y polvo sin datos. Ver sección 6. |
| Límites de EVA (velocidades, pendientes máximas, 6 h, 60 µGy) | `mission.js` (`LIMITS`) | supuestos de diseño | Sin fuente. Solo la tasa de dosis cita a Hassler et al. (2014) en el código y no se ha verificado aquí. |
| Asistente de ruta ("Route assistant") | `src/lib/routeFacts.js`, `src/lib/explain.js` | derived | Respuestas por plantilla, sin IA, construidas solo con el resultado de A*, la malla y `LIMITS`. Nunca certifica que la ruta sea segura. La conexión a Gemini está desactivada: solo se activa con `VITE_ASSISTANT_API_URL`, y no debe configurarse hasta revisar el backend. |

La imagen `public/layers/minerales.webp` ya no está en la configuración. No es un mapa CRISM: es la ilustración de un globo marciano de 474×258 px. El archivo sigue en el repositorio.

## 1. CTX Gale (NASA Mars Trek)

- **Servicio:** WMTS RESTful de NASA Mars Trek.
- **Capabilities:** <https://trek.nasa.gov/tiles/Mars/EQ/Gale_CTX_BlockAdj_dd/1.0.0/WMTSCapabilities.xml>
- **Documentación:** <https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars>
- **Identificador de capa:** `Gale_CTX_BlockAdj_dd`
- **Plantilla de tile (copiada de las capabilities):**
  `https://trek.nasa.gov/tiles/Mars/EQ/Gale_CTX_BlockAdj_dd/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`
- **Style:** `default`. **TileMatrixSet:** `default028mm`. **Formato:** PNG de 256×256.
- **CRS declarado:** `urn:ogc:def:crs:EPSG::104905` (coordenadas geográficas de Marte).
- **Cobertura declarada:** longitud 135.1842593 a 139.2413012 E, latitud -6.5732988 a -2.8077809. En `layers.js` está como `[[sur, oeste], [norte, este]]`.
- **Niveles de zoom:** 0 a 12 (se comprobó que el 12 responde 200 y el 13 responde 404). El nivel 0 tiene 2×1 tiles y cada nivel duplica filas y columnas, con origen arriba a la izquierda en (-180, 90). Es la misma malla que usa `L.CRS.EPSG4326` de Leaflet, con `{y}` como fila contada desde arriba.
- **Tamaño de píxel del nivel 12:** unos 10.2 m/px en el ecuador (calculado a partir de la malla, no declarado por el servicio). La resolución nativa de la imagen CTX no aparece en las capabilities y no se ha confirmado.
- **Cabeceras:** responde con `Access-Control-Allow-Origin: *`.
- **Zona de trabajo:** `AREA.bounds` (-4.80 a -4.70 N, 137.33 a 137.43 E) cae dentro de la cobertura. Sus esquinas y vecinos caen en los tiles z12 filas 2154–2157 y columnas 7221–7223, y los que se probaron responden 200. La caja mide unos 5.9 km por lado, unos 583×583 px en el nivel 12.
- **Verificación visual:** se descargó un tile (z12, fila 2156, columna 7222, 48 KB) y es una imagen en escala de grises de terreno con mesetas, coherente con CTX.

Limitaciones:
- Las capabilities repiten por error los `TileMatrix` 0 y 1 al final de la lista. Leaflet no las lee, así que no afecta.
- Según la documentación de Trek, un tile ausente significa que no hay cobertura. Fuera de la caja declarada habrá huecos.
- La capa es imagen, no contiene elevación.

## 2. MOLA (relieve global)

- **En el mapa:** el tile `Mars_MGS_MOLA_ClrShade_merge_global_463m` de Trek es un JPG de relieve coloreado. Sirve para contexto visual, no para medir.
- **Datos numéricos:** MEGDR de MOLA en el PDS: <https://pds-geosciences.wustl.edu/missions/mgs/mola.html>. El paquete PDS4 está en `pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/`. Usa el sistema de coordenadas IAU 2000.
- **Resolución:** el DEM de 128 píxeles por grado tiene unos 463 m por píxel en el ecuador ([USGS](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m)). La incertidumbre total de elevación indicada ahí es de al menos ±3 m.
- **Limitación:** nuestra caja de 5.9 km contiene unas 13×13 muestras de MOLA, así que no sirve para planificar la ruta. Solo sirve como referencia vertical regional.

## 3. THEMIS infrarrojo (NASA Mars Trek)

Dos mosaicos de la cámara THEMIS de la misión Mars Odyssey, servidos por Mars Trek. Se activan desde el panel de capas como mapas base, igual que Viking o MOLA. CTX sigue siendo el mapa recomendado para la zona de trabajo.

| | Diurno | Nocturno |
|---|---|---|
| Identificador | `THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018` | `THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018` |
| Capabilities | [XML](https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/WMTSCapabilities.xml) | [XML](https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018/1.0.0/WMTSCapabilities.xml) |
| Plantilla de tile | `https://trek.nasa.gov/tiles/Mars/EQ/<identificador>/1.0.0//default/default028mm/{z}/{y}/{x}.png` | igual |

Datos verificados en las capabilities y con peticiones reales (14-11-2026):
- **Servicio:** WMTS RESTful, estilo `default`, `TileMatrixSet` `default028mm`, PNG de 256×256 en escala de grises con canal alfa.
- **CRS:** `urn:ogc:def:crs:EPSG::104905`, el mismo que CTX. El nivel 0 tiene 2×1 tiles y el origen está arriba a la izquierda en (-180, 90), igual que `L.CRS.EPSG4326` de Leaflet. En la app se ve alineado con CTX y con la malla del DEM.
- **Cobertura:** longitud -179.9999997 a 179.9998849, latitud -65.0006576 a 65.0007535. Gale (4.75° S) queda dentro. En `layers.js` están como `bounds`.
- **Zoom:** niveles 0 a 9. El 9 responde 200 y el 10 responde 404. En el nivel 9 un píxel del tile equivale a unos 81 m en el ecuador (calculado a partir de la malla). El producto es de 100 m/px, de modo que el nivel 9 ya es la resolución completa.
- **Nuestra zona:** la caja de 5.9 km cabe en un único tile del nivel 9 (fila 269, columna 902), unos 73 píxeles de lado. A más zoom la imagen se amplía sin añadir detalle.
- **Cabeceras:** `Access-Control-Allow-Origin: *`.
- **Carga real:** en el navegador cargaron los 6 tiles del nivel 9 de cada producto, sin errores. Un tile del nivel 9 de cada uno se descargó y se comprobó visualmente: coherente con el terreno de Gale.

Qué son (según USGS Astrogeology):
- Mosaicos controlados de THEMIS a 100 m/px entre ±65° de latitud, formados con la banda 9 del infrarrojo térmico (12.57 µm) en la versión de teselas de USGS (`ProductVersionId` 2 en una etiqueta de ejemplo). Los productos son de 8 bits, es decir, **cualitativos**.
- El instrumento THEMIS tiene 9 bandas de infrarrojo térmico y 5 visibles y cercanas al infrarrojo (Christensen et al., 2004).
- Procedencia: [mosaicos controlados de THEMIS en USGS](https://astrogeology.usgs.gov/search/map/mars_themis_day_ir_controlled_mosaic_sinus_sabaeus_30s_00e_100_mpp), [descripción STAC](https://stac.astrogeology.usgs.gov/docs/data/mars/themis_controlled_mosaics/), [ASU](https://www.mars.asu.edu/data/thm_dir_100m), [Christensen et al. 2004](https://lpl.arizona.edu/hamilton/sites/lpl.arizona.edu.hamilton/files/courses/ptys551/Chapters/Christensen_et_al_2004.pdf).

Limitaciones:
- **No son temperaturas.** Las imágenes de 8 bits se han estirado en contraste; el gris de un píxel no se puede convertir en grados Celsius ni en Kelvin. Tampoco son inercia térmica, que es otro producto (ver sección 8).
- **No hay valores numéricos en la app:** no se ha creado ningún campo `thermal`, y A* no usa estas imágenes. La penalización por suelo suelto sigue desactivada.
- Es una imagen de brillo infrarrojo: mezcla temperatura de la superficie con la influencia de la topografía y la hora del día. La lectura cualitativa (zonas más claras u oscuras) depende de la hora de observación y de la estación; esa información no está en los tiles.
- El diurno y el nocturno son mosaicos de muchas pasadas: se ven costuras entre tiles con distinto brillo.
- A 100 m/px la caja de trabajo son unos 59 píxeles de lado, así que la imagen no distingue detalles del tamaño de un rover.
- No se ha confirmado a qué versión exacta corresponde cada mosaico de Trek (`v2_oct2018` es el nombre del producto), ni las fechas de las imágenes que contiene.

## 4. DEM de referencia: MSL Gale Merged DEM 1 m (USGS)

- **Página:** <https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m>
- **Archivo:** <https://planetarymaps.usgs.gov/mosaic/Mars/MSL/MSL_Gale_DEM_Mosaic_1m_v3.tif>
- **Tamaño:** 3 868 256 546 bytes (unos 3.6 GB), `Content-Type: image/tiff`, el servidor admite `Accept-Ranges: bytes`. Última modificación: 09-11-2022.
- **Origen:** combina DEM de HRSC, CTX y HiRISE ajustados a un DEM de MOLA. Se creó para evaluar la entrada, descenso y aterrizaje de Curiosity.
- **Exactitud:** según los metadatos de USGS, HRSC está controlado a MOLA, por lo que es tan exacto como MOLA (unos 100 m en horizontal y 1 m en vertical).
- **Servidor:** redirige a `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/MSL/MSL_Gale_DEM_Mosaic_1m_v3.tif` y admite lectura por rangos (`206 Partial Content`).

Metadatos leídos de la cabecera del GeoTIFF (1 273 bytes leídos, 14-11-2026):

| Campo | Valor |
|---|---|
| Tamaño | 32 980 × 57 440 píxeles, 1 banda |
| Tipo | float32 (`SampleFormat` 3) |
| Compresión | LZW, sin predictor |
| Organización | una franja (strip) por fila, sin teselas y sin overviews |
| Proyección | equirectangular, meridiano central 0, paralelo estándar 0, en metros |
| Esfera | `GCS_Mars_2000_Sphere`, radio 3 396 190 m |
| Origen | `PixelIsPoint`; centro del píxel (0, 0) en X = 8 127 993.99 m, Y = -244 781.58 m |
| Píxel | 1 × 1 m, norte arriba, sin rotación |
| NoData | -32767 |
| Estadísticas guardadas | mínimo -4625.9, máximo -322.6, media -3641.8 |
| Referencia vertical | no aparece en el archivo |

- **Cobertura (centros de píxel):** latitud -5.098644 a -4.129613, longitud 137.124175 a 137.680551 E. Coincide con la ficha de USGS.
- **Nuestra zona:** la caja de `mission.js`, la base y los 4 waypoints están dentro. La caja corresponde a las filas 33809–39737 y columnas 12200–18128 (5929 × 5929 px).
- **Coste de lectura:** las filas de la caja ocupan un único bloque contiguo de 451.8 MB. Leer una fila de cada 25 cuesta unos 18 MB.
- **Prueba:** se decodificó la fila 36773 (latitud -4.75) con Pillow. Las 5929 columnas de la caja tienen datos, entre -4213.6 y -3758.4 m.
- **Limitación:** es un mosaico de DEM de distinto origen remuestreado a 1 m. El detalle real depende de qué instrumento cubre cada zona; que la cuadrícula sea de 1 m no significa que haya 1 m de detalle en todas partes.

## 5. Malla de elevación real (`src/data/grid.json`)

Generada con `scripts/extract_dem_grid.py` el 14-11-2026 a partir del DEM de la sección 4.

**Cómo se ejecuta.** Necesita Python 3 con numpy y Pillow; no usa GDAL. En este equipo Python no está en el PATH:

```powershell
& "$env:LOCALAPPDATA\Python\bin\python.exe" scripts/extract_dem_grid.py
node scripts/check_grid.mjs
```

**Método**
1. Comprueba que el GeoTIFF es la misma versión verificada: tamaño 3 868 256 546 bytes y ETag `"746836824e520f8f0a7fb3987bdef0ff-462"`. Si cambió, se detiene.
2. Lee `AREA.bounds` de `src/data/mission.js` y calcula la ventana de píxeles: filas 33809–39733 y columnas 12200–18124. Se descartan los 4 últimos píxeles de cada eje para que la ventana sea múltiplo de 25.
3. Descarga solo esas filas, que están contiguas en el archivo, en una petición HTTP Range en streaming. Si la conexión se corta, reanuda desde la fila pendiente (hasta 5 reintentos).
4. Decodifica cada fila LZW con Pillow y la descarta tras acumularla. Nunca hay más de una fila en memoria.
5. Elevación de cada celda: media de los píxeles válidos de un bloque de 25 × 25 px. Un píxel es válido si es finito y distinto de NoData (-32767). Si menos del 50 % del bloque es válido, la celda queda sin datos. No se interpola.
6. Pendiente en grados: `atan(√((dz/dx)² + (dz/dy)²))`, con diferencias centrales entre celdas vecinas. En los bordes y junto a celdas sin datos usa la diferencia lateral disponible. Las distancias se miden sobre la esfera del DEM: 25 m norte-sur y 25 · cos(latitud) ≈ 24.92 m este-oeste.
7. `obstacle` vale 1 solo en celdas sin elevación válida. No hay mapa de rocas ni de peligros.
8. Guarda el JSON sin `NaN` ni `Infinity`; las celdas sin dato se escriben como `null`.

**Contrato de datos.** Es la misma estructura que usan `grid.js` y `astar.js`:

| Campo | Contenido |
|---|---|
| `rows`, `cols` | 237 × 237 |
| `bounds` | `[[-4.7999414, 137.3299879], [-4.6999831, 137.4299462]]`, bordes exteriores de la malla |
| `elev` | metros, fila a fila, de norte a sur; `null` si no hay dato |
| `slope` | grados; `null` si no se puede calcular |
| `obstacle` | 0 o 1 |
| `synthetic` | `false` |
| `meta` | producto, URL, ETag, CRS, método, ventana de píxeles, rangos, bytes descargados y fecha |

`gridFromJson(data)` en `grid.js` convierte el JSON a `Float32Array` y `Uint8Array` (`null` pasa a `NaN`).

**Resultados**
- Descarga: 451.9 MB en 34 s. Archivo generado: 0.81 MB.
- Celdas sin datos: 0. Celdas con elevación pero sin pendiente: 0.
- Elevación: -4433.9 a -3431.8 m. Pendiente: 0.1 a 47.4°.
- 17.5 % de las celdas superan 15° y 5.3 % superan 25°.
- En Vite pesa 1.29 MB dentro del bundle (208 KB con gzip).

**Validaciones** (`node scripts/check_grid.mjs`, todas superadas)
- Dimensiones, formato de bounds, ausencia de `NaN` e `Infinity`, valores 0/1 en `obstacle`.
- `obstacle` coincide exactamente con las celdas sin elevación.
- Elevaciones dentro del rango del DEM y pendientes entre 0 y 90°.
- `cellSizeKm` da 25.00 m.
- La fila 0 de la malla coincide con la fila más al norte de la ventana del DEM.
- `cellToLatLon` y `latLonToCell` son coherentes en las 56 169 celdas.
- Comprobación independiente (no incluida en el repo): una fila del DEM decodificada por separado (fila 36773, latitud -4.75) coincide con su fila de la malla con una diferencia media de 0.26 m. Desplazar una fila o columna la sube a más de 3 m, así que la orientación y la alineación son correctas.

**Limitaciones**
- La pendiente a 25 m es una media. Una celda puede contener escarpes, rocas o grietas de pocos metros que no aparecen. **Una pendiente baja en la malla no garantiza que el terreno sea seguro.**
- El DEM es un mosaico de HRSC, CTX y HiRISE remuestreado a 1 m. No se ha comprobado qué fuente cubre nuestra zona, así que el detalle real puede ser menor de 1 m.
- La exactitud absoluta depende de MOLA (unos 100 m en horizontal y 1 m en vertical, según USGS).
- La referencia vertical no aparece en el archivo. No afecta a la pendiente, solo a las alturas absolutas.
- Las distancias usan la esfera de radio 3396.19 km del propio DEM, no un elipsoide.
- La base y los waypoints siguen siendo posiciones sintéticas. Que caigan en celdas transitables no valida su interés científico.

## 6. Condiciones ambientales: REMS de Curiosity

- **Fuente:** feed público `https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json`. Lo elabora el Centro de Astrobiología (CSIC-INTA) con los datos de REMS y lo publica NASA. Su aviso dice que es para divulgación y que los datos científicos están en el PDS ([REMS en el PDS Atmospheres Node](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html)). También advierte que el rover influye en las lecturas y que REMS no mide a la misma hora cada sol.
- **Unidades:** el feed no las declara. Se verificaron con el script oficial del widget de NASA que lee este mismo feed (`https://mars.nasa.gov/js/general/weather/msl-weather.min.js`): trata `min_temp` y `max_temp` como °C (convierte con `9·t/5+32` a °F) y la página archivada ([Wayback, 02-12-2020](http://web.archive.org/web/20201202173215/https://mars.nasa.gov/msl/weather/)) rotula la presión como "Pressure (Pa)". La descripción de presión del propio feed habla de pascales.
- **Campos usados:** `sol`, `terrestrial_date`, `ls`, `min_temp`/`max_temp` (aire, °C), `min_gts_temp`/`max_gts_temp` (suelo, sensor GTS, °C) y `pressure` (Pa).
- **Observación integrada:** sol 4995 (25-08-2026, Ls 341°): aire −71 a −5 °C, suelo −84 a 4 °C, 777 Pa. Es el último sol del feed al descargarlo el 14-11-2026; Curiosity ya va por soles posteriores, así que la app la muestra como histórica, nunca como actual.
- **Viento:** `wind_speed` y `wind_direction` valen `--` en los 4745 soles del feed. Se muestra "Data unavailable".
- **Polvo:** `atmo_opacity` solo contiene la etiqueta "Sunny" (4742 soles) o `--`. No es una medida de opacidad, así que no se usa y se muestra "Data unavailable".
- **Alternativa revisada, MEDA de Perseverance (cráter Jezero, no Gale):** el feed equivalente (`category=mars2020`) solo trae 7 soles (1127 a 1133, abril de 2024) con temperatura y presión, sin viento ni polvo. No completa ningún campo que falte en REMS y mezclaría otro lugar, así que no se integró. Los datos de viento de MEDA están en el PDS, con su sensor de viento degradado desde 2022.
- **Reproducir:** `node scripts/fetch_mars_conditions.mjs` descarga el feed, toma el sol más reciente con temperatura del aire y presión, comprueba que mínimo ≤ máximo y escribe `src/data/marsConditions.json` con la fecha de descarga, el SHA-256 de la respuesta y el número de soles. Como el feed cambia, otra descarga puede dar otro sol.
- **Lo que la app no hace:** no califica las condiciones como favorables o peligrosas ni las usa en la ruta, el A* o los límites de EVA.

## 7. Protección planetaria (panel "Planetary protection")

Contenido en `src/data/planetaryProtection.js`; `PlanetaryProtection.jsx` solo lo muestra. Se verificó el 14-11-2026 contra el texto de estas fuentes:

- **COSPAR Policy on Planetary Protection, versión 2026** ([página](https://cosparhq.cnes.fr/cospar-policy-on-planetary-protection/), [PDF](https://cosparhq.cnes.fr/assets/uploads/2026/01/SRT_224_Editorial_PPP-Nov-2025.pdf)). Se define como estándar internacional voluntario y no vinculante. Define "Special Region", da los límites de actividad del agua (0.5) y temperatura (−28 °C) y establece la Categoría IVc. No usa el término "Uncertain Region".
- **NASA Planetary Protection** ([página](https://sma.nasa.gov/sma-disciplines/planetary-protection/)). Cita el Artículo IX del Tratado del Espacio Exterior, la NPR 8715.24 (septiembre de 2021, sustituye a la NPR 8020.12D), la lista de la NID 8715.129 para misiones tripuladas a Marte y las definiciones de contaminación directa e inversa.
- **National Academies, Review of the MEPAG Report on Mars Special Regions, 2015** ([capítulo](https://www.nationalacademies.org/read/21816/chapter/8)). De aquí sale el concepto "Uncertain Regions" y la lista de tipos de rasgo. Es una revisión científica de 2015, no una norma. Su umbral de temperatura (−25 °C) es anterior al de COSPAR 2026 (−28 °C), por eso el panel solo usa el de COSPAR.

Qué muestra el panel y qué no:

- Distingue tratado, recomendación COSPAR, política NASA y revisión científica.
- Las listas de regiones (`entries`) están vacías. No hay coordenadas ni polígonos. Para añadir una región validada: un objeto `{ name, evidence, sourceLabel, sourceUrl }` en `specialRegions.entries` o `uncertainRegions.entries`.
- El estado de la ruta aparece como "Not evaluated". La app no comprueba si la base, las paradas o la ruta tocan una región, y no debe decirlo.

Sin verificar: el estado vigente de la NID 8715.129 (las NID caducan o se renuevan) y el texto del Tratado en la fuente original de la ONU; se citó a través de NASA y COSPAR.

## 8. Pendiente (no integrado)

- **THEMIS cuantitativo:** los mosaicos de inercia térmica de unos 100 m/px, entre ±60° de latitud, en teselas de 30°×60° ([ejemplo en USGS](https://astrogeology.usgs.gov/search/map/themis_thermal_inertia_mosaic_quantitative_30s060e_100mpp)), tienen versión cuantitativa y cualitativa. Precisión absoluta indicada: unos 20 %. Es el único producto de la lista que podría dar un valor numérico para `thermal`. Hace falta localizar la tesela que cubre 137.4° E, -4.75° N y leer solo nuestra ventana, como se hizo con el DEM. Todavía no se ha comprobado.
- **HiRISE:** recortes de imagen o DTM propios de la caja. Sin comprobar.
- **Geología y minerales:** no hay ninguna capa real. La capa `geology` (apuntaba a un `geology.png` que no existe) y la capa térmica se retiraron de `layers.js`. Una capa térmica con valores solo se añadirá cuando haya un producto cuantitativo de THEMIS leído y verificado; las imágenes de la sección 3 no sirven para eso.

## Integración en la app

Hecha en `feat/scientific-data` (14-11-2026):

1. `astar.js`, `cellCost`: si la malla no trae `thermal`, no aplica penalización por suelo suelto. Rechaza pendientes no finitas (`!Number.isFinite(s)`). Con la malla sintética da los mismos resultados que antes.
2. `MarsMap.jsx`: solo rasteriza las capas `grid` cuya clave existe en la malla. El `TileLayer` recibe `bounds={base.bounds}`, así que la capa CTX no pide tiles fuera de su cobertura.
3. `App.jsx`: importa `src/data/grid.json` y lo carga con `gridFromJson` dentro de `useMemo`. Muestra el producto y la malla, y avisa de que los puntos son aproximados y de que la ruta no garantiza seguridad.

Resultados con la malla real y los 4 puntos (`node scripts/check_grid.mjs` y comprobado en el navegador):

| Modo | Distancia | Tiempo | Dosis | Pendiente máx. | Perfil | Avisos |
|---|---|---|---|---|---|---|
| A pie | 12.56 km | 8.3 h | 72.4 µGy | 12.4° | -4191.5 a -4029.8 m | EVA y dosis |
| Rover | 12.41 km | 3.6 h | 31.1 µGy | 16.2° | -4188.7 a -4027.8 m | ninguno |

Los avisos vienen de los límites de `LIMITS`, que son supuestos de diseño.

Resuelto en el rediseño de la interfaz (14-11-2026):
- La app abre con CTX (`recommendedBaseId` en `App.jsx`).
- Las leyendas del panel de capas ya no se solapan.
- En la lista de paradas, la casilla incluye o quita la parada y el nombre solo despliega su detalle.
- El panel muestra la procedencia de cada capa con las etiquetas Real, Derivado y Simulado, tomadas del campo `provenance`.

Valores que la interfaz marca como estimados o simulados:
- Tiempo de EVA, dosis y sus límites: salen de `LIMITS`, que son supuestos de diseño.
- El oxígeno del HUD es una fórmula de demostración, sin modelo real.
- El aviso de "punto de no retorno" del HUD se activa al 70 % del límite de EVA o de dosis; es una regla de demostración.
- El rumbo del HUD se calcula entre la posición simulada y la siguiente parada, con las coordenadas de la ruta.
