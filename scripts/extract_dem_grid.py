"""Extrae una malla de elevación de ~25 m del MSL Gale Merged DEM 1m (USGS)
para la zona AREA.bounds de src/data/mission.js.

Lee solo las filas necesarias del GeoTIFF mediante peticiones HTTP Range,
sin descargar el archivo completo. Requiere Python 3, numpy y Pillow.

Uso:
    python scripts/extract_dem_grid.py
    python scripts/extract_dem_grid.py --cell-rows 2 --out prueba.json
"""

import argparse
import http.client
import io
import json
import math
import re
import struct
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

DEM_PAGE = "https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m"
DEM_URL = "https://planetarymaps.usgs.gov/mosaic/Mars/MSL/MSL_Gale_DEM_Mosaic_1m_v3.tif"
DEM_SIZE = 3868256546
DEM_ETAG = '"746836824e520f8f0a7fb3987bdef0ff-462"'

WIDTH = 32980
HEIGHT = 57440
STRIP_OFFSETS_POS = 3868025752
STRIP_COUNTS_POS = 3867795992
NODATA = -32767.0
DEM_MIN = -4625.875
DEM_MAX = -322.5602722168

RADIUS = 3396190.0
X0 = 8127993.992786024
Y0 = -244781.575189438

CELL_PIXELS = 25
MIN_VALID_FRACTION = 0.5
MAX_RETRIES = 5

ROOT = Path(__file__).resolve().parent.parent
downloaded_bytes = 0


def open_range(start, end):
    headers = {"Range": f"bytes={start}-{end}", "User-Agent": "extract-dem-grid/1.0"}
    request = urllib.request.Request(DEM_URL, headers=headers)
    response = urllib.request.urlopen(request, timeout=60)
    if response.status != 206:
        raise RuntimeError(f"El servidor respondió {response.status} en lugar de 206")
    return response


def read_exact(response, size):
    global downloaded_bytes
    data = bytearray()
    while len(data) < size:
        chunk = response.read(size - len(data))
        if not chunk:
            raise ConnectionError("La conexión se cerró antes de recibir todos los datos")
        data += chunk
    downloaded_bytes += size
    return bytes(data)


def read_range(start, size):
    with open_range(start, start + size - 1) as response:
        return read_exact(response, size)


def check_file_version():
    with open_range(0, 7) as response:
        total_size = int(response.headers["Content-Range"].split("/")[1])
        etag = response.headers.get("ETag")
        header = read_exact(response, 8)
    if total_size != DEM_SIZE or etag != DEM_ETAG or header[:4] != b"II*\x00":
        raise RuntimeError("El GeoTIFF cambió desde la verificación; hay que revisar sus metadatos de nuevo")


def read_area_bounds():
    text = (ROOT / "src/data/mission.js").read_text(encoding="utf-8")
    number = r"\s*(-?\d+(?:\.\d+)?)\s*"
    match = re.search(rf"bounds:\s*\[\[{number},{number}\]\s*,\s*\[{number},{number}\]\]", text)
    if not match:
        raise RuntimeError("No se encontró AREA.bounds en src/data/mission.js")
    south, west, north, east = map(float, match.groups())
    return south, west, north, east


def row_of(lat):
    return Y0 - RADIUS * math.radians(lat)


def col_of(lon):
    return RADIUS * math.radians(lon) - X0


def lat_of(row):
    return math.degrees((Y0 - row) / RADIUS)


def lon_of(col):
    return math.degrees((X0 + col) / RADIUS)


def decode_row(strip):
    data_offset = 8 + 2 + 12 * 10 + 4
    entries = [
        (256, 4, WIDTH), (257, 4, 1), (258, 3, 32), (259, 3, 5), (262, 3, 1),
        (273, 4, data_offset), (277, 3, 1), (278, 4, 1), (279, 4, len(strip)), (339, 3, 3),
    ]
    tiff = bytearray(struct.pack("<2sHIH", b"II", 42, 8, len(entries)))
    for tag, kind, value in entries:
        tiff += struct.pack("<HHIH2x" if kind == 3 else "<HHII", tag, kind, 1, value)
    tiff += struct.pack("<I", 0) + strip
    values = np.asarray(Image.open(io.BytesIO(tiff)), dtype=np.float32).reshape(-1)
    if values.size != WIDTH:
        raise ValueError(f"Fila decodificada con {values.size} valores en lugar de {WIDTH}")
    return values


def stream_rows(offsets, counts):
    row = 0
    retries = 0
    end = offsets[-1] + counts[-1] - 1
    while row < len(offsets):
        try:
            with open_range(offsets[row], end) as response:
                while row < len(offsets):
                    strip = read_exact(response, counts[row])
                    yield decode_row(strip)
                    row += 1
        except (OSError, http.client.HTTPException) as error:
            retries += 1
            if retries > MAX_RETRIES:
                raise
            print(f"  Conexión interrumpida en la fila {row} ({error}). Reintento {retries}/{MAX_RETRIES}...")
            time.sleep(5)


def derivative(elev, spacing, axis):
    forward = (np.roll(elev, -1, axis) - elev) / spacing
    backward = (elev - np.roll(elev, 1, axis)) / spacing
    if axis == 0:
        forward[-1, :] = np.nan
        backward[0, :] = np.nan
    else:
        forward[:, -1] = np.nan
        backward[:, 0] = np.nan
    central = (forward + backward) / 2
    return np.where(np.isfinite(central), central, np.where(np.isfinite(forward), forward, backward))


def to_list(values, decimals):
    return [None if math.isnan(v) else round(float(v), decimals) for v in values.ravel()]


def main():
    parser = argparse.ArgumentParser(description="Extrae la malla de elevación real de la zona de trabajo.")
    parser.add_argument("--out", default=str(ROOT / "src/data/grid.json"))
    parser.add_argument("--cell-rows", type=int, help="solo para pruebas: procesa las primeras N filas de celdas")
    args = parser.parse_args()

    start_time = time.time()
    check_file_version()
    south, west, north, east = read_area_bounds()

    first_row, last_row = math.floor(row_of(north)), math.ceil(row_of(south))
    first_col, last_col = math.floor(col_of(west)), math.ceil(col_of(east))
    if first_row < 0 or first_col < 0 or last_row >= HEIGHT or last_col >= WIDTH:
        raise RuntimeError("AREA.bounds se sale de la cobertura del DEM")

    rows = (last_row - first_row + 1) // CELL_PIXELS
    cols = (last_col - first_col + 1) // CELL_PIXELS
    if args.cell_rows:
        rows = min(rows, args.cell_rows)
    pixel_rows = rows * CELL_PIXELS
    pixel_cols = cols * CELL_PIXELS

    offsets = np.frombuffer(read_range(STRIP_OFFSETS_POS + 4 * first_row, 4 * pixel_rows), "<u4").astype(np.int64)
    counts = np.frombuffer(read_range(STRIP_COUNTS_POS + 4 * first_row, 4 * pixel_rows), "<u4").astype(np.int64)
    if not np.array_equal(offsets[1:], offsets[:-1] + counts[:-1]):
        raise RuntimeError("Las filas de la zona no están contiguas en el archivo")

    print(f"Zona: filas {first_row}-{first_row + pixel_rows - 1}, columnas {first_col}-{first_col + pixel_cols - 1}")
    print(f"Malla: {rows} x {cols} celdas de {CELL_PIXELS} x {CELL_PIXELS} px")
    print(f"Datos comprimidos a leer: {counts.sum() / 1e6:.1f} MB")

    elev = np.full((rows, cols), np.nan)
    sums = np.zeros(cols)
    valid_counts = np.zeros(cols, dtype=np.int64)
    min_valid = math.ceil(MIN_VALID_FRACTION * CELL_PIXELS ** 2)

    for index, values in enumerate(stream_rows(offsets.tolist(), counts.tolist())):
        block = values[first_col:first_col + pixel_cols].astype(np.float64).reshape(cols, CELL_PIXELS)
        is_valid = np.isfinite(block) & (block != NODATA)
        sums += np.where(is_valid, block, 0).sum(axis=1)
        valid_counts += is_valid.sum(axis=1)
        if index % CELL_PIXELS == CELL_PIXELS - 1:
            cell_row = index // CELL_PIXELS
            elev[cell_row] = np.where(valid_counts >= min_valid, sums / np.maximum(valid_counts, 1), np.nan)
            sums[:] = 0
            valid_counts[:] = 0
            if (cell_row + 1) % 10 == 0 or cell_row + 1 == rows:
                elapsed = time.time() - start_time
                print(f"  fila de celdas {cell_row + 1}/{rows}  {downloaded_bytes / 1e6:.0f} MB  {elapsed:.0f} s")

    center_lats = np.array([lat_of(first_row + i * CELL_PIXELS + (CELL_PIXELS - 1) / 2) for i in range(rows)])
    spacing_x = CELL_PIXELS * np.cos(np.radians(center_lats))[:, None]
    dz_dx = derivative(elev, spacing_x, axis=1)
    dz_dy = derivative(elev, float(CELL_PIXELS), axis=0)
    slope = np.degrees(np.arctan(np.hypot(dz_dx, dz_dy)))

    no_data = np.isnan(elev)
    if no_data.all():
        raise RuntimeError("Ninguna celda tiene elevación válida")
    elev_range = [float(np.nanmin(elev)), float(np.nanmax(elev))]
    if elev_range[0] < DEM_MIN or elev_range[1] > DEM_MAX:
        raise RuntimeError(f"Elevaciones fuera del rango del DEM: {elev_range}")

    grid = {
        "rows": rows,
        "cols": cols,
        "bounds": [
            [round(lat_of(first_row + pixel_rows - 0.5), 7), round(lon_of(first_col - 0.5), 7)],
            [round(lat_of(first_row - 0.5), 7), round(lon_of(first_col + pixel_cols - 0.5), 7)],
        ],
        "synthetic": False,
        "meta": {
            "product": "MSL Gale Merged DEM 1m, versión 3 (USGS Astrogeology)",
            "page": DEM_PAGE,
            "file": DEM_URL,
            "etag": DEM_ETAG,
            "crs": "Equirectangular, meridiano central 0, esfera Mars 2000 de radio 3396190 m",
            "verticalUnits": "m",
            "provenance": {"elev": "real", "slope": "derived", "obstacle": "derived"},
            "method": "Media de los píxeles válidos en bloques de 25 x 25 px. Pendiente por diferencias centrales "
                      "(laterales en los bordes y junto a celdas sin datos) con distancias sobre la esfera del DEM.",
            "obstacleMeaning": "Celda sin elevación válida: menos del 50 % de sus píxeles tiene dato.",
            "cellPixels": CELL_PIXELS,
            "cellSizeNorthSouthM": float(CELL_PIXELS),
            "cellSizeEastWestM": round(float(spacing_x.mean()), 2),
            "minValidFraction": MIN_VALID_FRACTION,
            "pixelWindow": {"firstRow": first_row, "firstCol": first_col, "rows": pixel_rows, "cols": pixel_cols},
            "noDataCells": int(no_data.sum()),
            "unknownSlopeCells": int((~no_data & np.isnan(slope)).sum()),
            "elevRangeM": [round(v, 1) for v in elev_range],
            "slopeRangeDeg": [round(float(np.nanmin(slope)), 1), round(float(np.nanmax(slope)), 1)],
            "downloadedBytes": downloaded_bytes,
            "createdAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
        "elev": to_list(elev, 1),
        "slope": to_list(slope, 1),
        "obstacle": no_data.astype(int).ravel().tolist(),
    }

    out_path = Path(args.out)
    out_path.write_text(json.dumps(grid, ensure_ascii=False, allow_nan=False, separators=(",", ":")), encoding="utf-8")
    print(f"Guardado {out_path} ({out_path.stat().st_size / 1e6:.2f} MB)")
    print(f"Descargado: {downloaded_bytes / 1e6:.1f} MB en {time.time() - start_time:.0f} s")
    print(f"Celdas sin datos: {grid['meta']['noDataCells']}  |  pendiente desconocida: {grid['meta']['unknownSlopeCells']}")
    print(f"Elevación: {grid['meta']['elevRangeM']} m  |  pendiente: {grid['meta']['slopeRangeDeg']} grados")


if __name__ == "__main__":
    main()
