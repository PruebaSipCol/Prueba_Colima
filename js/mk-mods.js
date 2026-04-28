(() => {
  // ====== Configuración inicial leaflet ======
  const isSmall = window.innerWidth < 1100;
  const Zoom = isSmall ? 6 : 7;
  const Centro = isSmall
    ? [19.16592425362802, -101.56860351562501]
    : [19.041348796589013, -94.57580566406251];

  // ====== Mapa Leaflet ======
  const map = L.map("map", { crs: L.CRS.EPSG3857 }).setView(Centro, Zoom);
  map.attributionControl.setPrefix('&copy ' + new Date().getFullYear());
  map.options.minZoom = 4;

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // ====== Intl NumberFormat ======
  const nf = new Intl.NumberFormat('es-MX');
  const miles = (n) => nf.format(n);

  // ====== Helpers ======
  const csvCache = new Map();
  function loadCSV(url) {
    if (csvCache.has(url)) return Promise.resolve(csvCache.get(url));
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "GET", url, dataType: "text",
        success: (data) => { csvCache.set(url, data); resolve(data); },
        error: reject
      });
    });
  }

  function sortByNumericKey(arr, key, dir = "asc") {
    const mul = dir === "desc" ? -1 : 1;
    return arr.sort((a, b) => {
      const x = Number(a[key]), y = Number(b[key]);
      if (!Number.isFinite(x) && !Number.isFinite(y)) return 0;
      if (!Number.isFinite(x)) return 1;
      if (!Number.isFinite(y)) return -1;
      return (x - y) * mul;
    });
  }

  const hasMin = (arr, key) =>
    arr.reduce((min, o) => (min && Number(min[key]) <= Number(o[key]) ? min : o), null);
  const hasMax = (arr, key) =>
    arr.reduce((max, o) => (max && Number(max[key]) >= Number(o[key]) ? max : o), null);

  function indexBy(arr, key) {
    const m = new Map();
    for (const o of arr) m.set(o[key], o);
    return m;
  }

  function resetAllMunicipios() {
    if (!municipios) return;
    municipios.eachLayer(l => municipios.resetStyle(l));
    info.update();
  }

// ====== DataTables (configuración global) ======
Object.assign(DataTable.defaults, {
  language: { url: "js/es-ES.json" },
  info: false,
  //columns: [{ data: null }, { data: null }, { data: null }],
  scrollY: "615px",
   autoWidth: true,
  scrollCollapse: true,
  ordering: true,
  paging: false
});

// Inicializamos DataTable sin array
let mitabla = new DataTable("#tbl_indicador", { data: [] });

function renderTabla(rowsObj) {
  // Convertimos cada objeto a un array en el orden correcto
  const rows = rowsObj.map(r => [r.Clave, r.Municipio, r.Valor]);
  mitabla.clear();
  mitabla.rows.add(rows);
  mitabla.draw();
  mitabla.columns.adjust().draw(false);
}


// ====== Chart.js ======
let chartInstance = null;                     
const chartCanvas = document.getElementById('myChart');

function getExistingChart() {
  if (typeof Chart !== 'undefined' && typeof Chart.getChart === 'function' && chartCanvas) {
    const c = Chart.getChart(chartCanvas);
    if (c) return c;
  }
  if (chartCanvas && chartCanvas._chartInstance) return chartCanvas._chartInstance;
  return chartInstance;
}

function destroyChartIfAny() {
  const c = getExistingChart();
  if (c && typeof c.destroy === 'function') c.destroy();
  chartInstance = null;
  if (chartCanvas) chartCanvas._chartInstance = null;
}

function renderChart(labels, data) {
  if (!chartCanvas) return;                       
  const ctx = chartCanvas.getContext('2d');
  if (!ctx) return;

  destroyChartIfAny();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        borderWidth: 2,
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: false }
    }
  });

  chartCanvas._chartInstance = chartInstance;
}


  // ====== Colores / estilos ======
  function getColor(d) {
    return d == 'Q1' ? '#800026' :
           d == 'Q2' ? '#BD0026' :
           d == 'Q3' ? '#E31A1C' :
           d == 'Q4' ? '#FC4E2A' :
           d == 'Q5' ? '#FD8D3C' :
                       '#FFEDA0';
  }
  function style(feature) {
    return {
      fillColor: getColor(feature.properties.Q),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.6
    };
  }

  // ====== Info control ======
  const info = L.control({ position: 'topright' });
  info.onAdd = () => {
    info._div = L.DomUtil.create('div', 'info');
    return info._div;
  };
  info.update = (props) => { info._div.innerHTML = props ? `<h5>${props.nomgeo} (${miles(props.Valor)})</h5>` : ''; };
  info.addTo(map);

  // ====== Legend ======
  let legend = null;
  function mkLegend(labels, nombreCapa) {
    if (legend) map.removeControl(legend);
    legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const qs = ['Q1','Q2','Q3','Q4','Q5'];
      div.innerHTML = labels.map((txt, i) =>
        `<i style="background:${getColor(qs[i])}"></i> <span>${txt}</span>`
      ).join('<br>');
      return div;
    };
    legend.addTo(map);

    // Asegurar re-bind limpio
    map.off('overlayadd').off('overlayremove');

    map.on('overlayadd', (ev) => {
      if (ev.name === nombreCapa) {
        map.addControl(legend);
        map.addControl(info);
      }
    });
    map.on('overlayremove', (ev) => {
      if (ev.name === nombreCapa) {
        map.removeControl(legend);
        map.removeControl(info);
      }
    });
  }

  // ====== Eventos de resaltado ======
  function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({ weight: 3, color: '#666', dashArray: '', fillOpacity: 0.7 });
    layer.bringToFront?.();
    info.update(layer.feature.properties);
  }
  function resaltarFeature(layer) {
    layer.setStyle({ weight: 3, color: '#666', dashArray: '', fillOpacity: 0.7 });
    layer.bringToFront?.();
    info.update(layer.feature.properties);
  }
  function resetHighlight(e) {
    municipios.resetStyle(e.target);
    info.update();
  }
  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer) {
    layer.on({ mouseover: highlightFeature, mouseout: resetHighlight, click: zoomToFeature });
  }

  // ====== Variables globales ======
  let municipios = null;
  let layerByClave = new Map();
  let mun = {};            // GeoJSON municipios
  let oindica = [];        // indicador ordenado
  let Arr = [];            // indicador ordenado para estratos
  let Min = 0, Max = 0;
  let minMun = '', maxMun = '', seleccionado = '';
  let E1 = '', E2 = '', E3 = '', E4 = '', E5 = '';

  // ====== Carga municipios (GeoJSON) ======
  $.ajax({
    type: "GET",
    url: "indicadores/municipios.json",
    dataType: "json",
    complete: function (result) { mun = JSON.parse(result.responseText); }
  });

// ====== Menú dinámico (botones primero, submenús en paralelo) ======
$(document).ready(function () {

  //const menuUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTuKrHC9towlLAw9C3LQAWkHDuMrEASiMeQnmT1RL1DjtFey5HUt2rjxoFctzgU27ph7WFIp-z3UrYc/pub?output=csv";
  const menuUrl = 'indicadores/menu.csv';
  
  $("#loader").show();

  // util: id seguro para el DOM
  const slug = (s) => String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  (async function initMenu() {
    try {
      const raw = await loadCSV(menuUrl);
      const menuItems = $.csv.toObjects(raw);

      // 1) Pintar TODOS los botones 
      for (const item of menuItems) {
        const id = 'submenu-' + slug(item.Dominio);
        const html = `
          <li nav-item>
            <div class="dropdown" style="padding-right: 15px;">
              <button type="button" class="btn ${item.Boton} dropdown-toggle"
                style="min-width: 150px !important; margin-bottom: 5px;" data-toggle="dropdown"
                aria-expanded="false">
                ${item.Dominio}
              </button>
              <div id="${id}" class="dropdown-menu">
                <span class="dropdown-item-text text-muted">Cargando…</span>
              </div>
            </div>
          </li>`;
        $("#myMenu").append(html);
      }

      // 2) Cargar submenús en segundo plano (todos en paralelo)
      for (const item of menuItems) {
        const id = '#submenu-' + slug(item.Dominio);
       
        const archivoUrl = item.Archivo.includes("docs.") ? item.Archivo : "indicadores/" + item.Archivo + ".csv";
 console.log(280, archivoUrl)
        loadCSV(archivoUrl).then(csv => {
          const indicadores = $.csv.toObjects(csv);
          const links = indicadores.map(ind =>
            `<a class="dropdown-item" href="#"
               onclick="mkIndicador('${ind.valores}','${ind.descriptores}')">
               ${ind.indicador}
             </a>`
          ).join('');
          $(id).html(links || `<span class="dropdown-item-text text-muted">Sin elementos</span>`);
        }).catch(err => {
          console.error("Submenú error:", archivoUrl, err);
          $(id).html(`<span class="dropdown-item-text text-danger">Error al cargar</span>`);
        });
      }
    } catch (e) {
      console.error("Error cargando archivo de menú:", menuUrl, e);
      $("#myMenu").append(
        `<li class="nav-item"><span class="dropdown-item-text text-danger">Error al cargar el menú</span></li>`
      );
    } finally {
      $("#loader").hide();
    }
  })();
});


  // ====== Cálculo de estratos (Dalenius-Hodges) y construcción de capa ======
  function cmas(a) { return a < 0 ? a * -1 : a; }

  function mkArray(_oindica) {
    Arr = sortByNumericKey(_oindica.slice(), "Valor", "asc");

    Min = hasMin(Arr, 'Valor').Valor;
    Max = hasMax(Arr, 'Valor').Valor;
    minMun = hasMin(Arr, 'Valor').Clave;
    maxMun = hasMax(Arr, 'Valor').Clave;

    // lsup / linf (cuadrícula base para DH)
    Arr.forEach((e, i) => { e.lsup = Min + ((i + 1) * ((Max - Min) / Math.min(Arr.length, 50))); });
    Arr.forEach((e, i) => { e.linf = (i === 0) ? Number(Arr[0].Valor) : Number(Arr[i - 1].lsup); });

    // Frecuencias por intervalo base
    Arr.forEach((row, i) => {
      let t = 0;
      Arr.forEach((ev) => {
        const v = Number(ev.Valor);
        if (v >= row.linf && v < row.lsup) t += 1;
      });
      row.frec = t;
    });

    // r2 y acumulado
    Arr.forEach((e, i) => {
      e.r2 = Math.sqrt(e.frec);
      e.r2a = i === 0 ? e.r2 : e.r2 + Arr[i - 1].r2a;
    });

    const Q1 = (1 / 5) * Arr[Arr.length - 1].r2a;
    const Q2 = Q1 * 2, Q3 = Q1 * 3, Q4 = Q1 * 4, Q5 = Q1 * 5;

    let maxQ1=0,maxQ2=0,maxQ3=0,maxQ4=0,maxQ5=0;
    let minQ1=0,minQ2=0,minQ3=0,minQ4=0,minQ5=0;
    Arr.forEach((e, i) => {
      if (e.r2a <= Q1) minQ1 = i; if (!maxQ1 && e.r2a >= Q1) maxQ1 = i;
      if (e.r2a <= Q2) minQ2 = i; if (!maxQ2 && e.r2a >= Q2) maxQ2 = i;
      if (e.r2a <= Q3) minQ3 = i; if (!maxQ3 && e.r2a >= Q3) maxQ3 = i;
      if (e.r2a <= Q4) minQ4 = i; if (!maxQ4 && e.r2a >= Q4) maxQ4 = i;
      if (e.r2a <= Q5 && minQ5 !== i) minQ5 = i; if (!maxQ5 && e.r2a >= Q5) maxQ5 = i;
    });

    const lQ1 = Math.round(cmas(Arr[minQ1].r2a - Q1) < cmas(Arr[maxQ1].r2a - Q1) ? Arr[minQ1].lsup : Arr[maxQ1].lsup);
    const lQ2 = Math.round(cmas(Arr[minQ2].r2a - Q2) < cmas(Arr[maxQ2].r2a - Q2) ? Arr[minQ2].lsup : Arr[maxQ2].lsup);
    const lQ3 = Math.round(cmas(Arr[minQ3].r2a - Q3) < cmas(Arr[maxQ3].r2a - Q3) ? Arr[minQ3].lsup : Arr[maxQ3].lsup);
    const lQ4 = Math.round(cmas(Arr[minQ4].r2a - Q4) < cmas(Arr[maxQ4].r2a - Q4) ? Arr[minQ4].lsup : Arr[maxQ4].lsup);
    const lQ5 = Math.round(cmas(Arr[minQ5].r2a - Q5) < cmas(Arr[maxQ5].r2a - Q5) ? Arr[minQ5].lsup : Arr[maxQ5].lsup);

    E1 = `${miles(Min)} - ${miles(lQ1)}`;
    E2 = `${miles(lQ1 + 1)} - ${miles(lQ2)}`;
    E3 = `${miles(lQ2 + 1)} - ${miles(lQ3)}`;
    E4 = `${miles(lQ3 + 1)} - ${miles(lQ4)}`;
    E5 = `${miles(lQ4 + 1)} - ${miles(Max)}`;

    Arr.forEach((e) => {
      const v = Number(e.Valor);
      e.intervalo =
        (v <  lQ1 + 1)                      ? "Q1" :
        (v >= lQ1 + 1 && v < lQ2 + 1)       ? "Q2" :
        (v >= lQ2 + 1 && v < lQ3 + 1)       ? "Q3" :
        (v >= lQ3 + 1 && v < lQ4 + 1)       ? "Q4" :
                                              "Q5";
    });

    // Join O(n) con GeoJSON
    const idxIndicador = indexBy(oindica, 'Clave');
    for (const f of mun.features) {
      const hit = idxIndicador.get(f.properties.cvegeo);
      if (hit) {
        f.properties.Valor = hit.Valor;
        f.properties.Q = hit.intervalo;
      } else {
        f.properties.Valor = 0;
        f.properties.Q = null;
      }
    }

    mkCapa();
  }

  // ====== Construcción de capa y leyenda ======
  function mkCapa() {
    if (municipios) municipios.remove();
    layerByClave = new Map();

    municipios = L.geoJson(mun, {
      style,
      onEachFeature: (feature, layer) => {
        onEachFeature(feature, layer);
        layerByClave.set(feature.properties.cvegeo, layer);
      }
    }).addTo(map);

    mkLegend([E1,E2,E3,E4,E5], 'municipios');
    map.invalidateSize();
    const bounds = municipios.getBounds();
    map.fitBounds(bounds);

    // Mínimo y máximo al chart por default
    const rows = filterData(Arr, [minMun, maxMun]);
    void rows; 
  }

  // ====== Filtrado para gráfica ======
  function filterData(data, cves) {
    const set = new Set(cves);
    const rows = data.filter(v => v?.Clave?.length === 5 && set.has(v.Clave));
    const labels = rows.map(v => v.Municipio);
    const serie  = rows.map(v => v.Valor);
    renderChart(labels, serie);
    return rows;
  }

  // ====== Exponer mkIndicador global (lo llama el menú) ======
  window.mkIndicador = function mkIndicador(i, d) {
    seleccionado = '';
    try {
      const bounds = municipios?.getBounds?.();
      if (bounds) {
        map.fitBounds(bounds);
        resetAllMunicipios();
      }
    } catch(e) {}

    info.update();

    const metaUrl = d.includes("docs.") ? d : `indicadores/${d}.csv`;
    const dataUrl = i.includes("docs.") ? i : `indicadores/${i}.csv`;

    Promise.all([loadCSV(metaUrl), loadCSV(dataUrl)]).then(([metaCSV, dataCSV]) => {
      const meta = $.csv.toObjects(metaCSV);
      $("#banner").hide();
      $("#header").show();
      // Sanear texto (evitar HTML inyectado si no se requiere)
      $("#i-header").text(meta[0]?.Nombre ?? '');
      $("#i-body").text(meta[0]?.Descripcion ?? '');

      const parsed = $.csv.toObjects(dataCSV).map(r => ({
        ...r,
        Valor: Number(String(r.Valor).replace(/[,\s]/g,'')) || 0
      }));

      oindica = sortByNumericKey(parsed, "Clave", "asc");
      renderTabla(oindica);
      $("#indicadores").css("display", "block")
      // Recalcular estratos y dibujar capa
      mkArray(oindica);
      mitabla.columns.adjust().draw(false);
    }).catch(err => console.error('mkIndicador error:', err));
  };

  // ====== Click en filas de la tabla ======
$("#tbl_indicador tbody").on("click", "tr", function (e) {
  // Quita selección anterior en la tabla
  $(".selected").removeClass('selected');

  // Lee la clave de la fila
  const clave = this.cells && this.cells[0] ? this.cells[0].innerHTML : null;
  if (!clave) return; // sin clave, no hacemos nada

  // Si no hay capa cargada aún, salimos
  if (!municipios) return;

  // Toggle: si vuelves a pulsar la misma clave -> limpiar estilos y vista general
  if (seleccionado === clave) {
    seleccionado = '';
    this.classList.remove('selected');

    // Reset estilos correctamente (sin resetStyle vacío)
    resetAllMunicipios();

    // Zoom a todos los municipios
    const b = municipios.getBounds?.();
    if (b && b.isValid && b.isValid()) {
      map.fitBounds(b);
    }

    // Actualiza info y gráfica de min/max
    info.update();
    filterData(Arr, [minMun, maxMun]);
    return;
  }

  // Nueva selección
  this.classList.add('selected');
  seleccionado = clave;

  // Limpia estilos de todos
  resetAllMunicipios();

  // Busca la capa por clave
  const lyr = layerByClave.get(clave);
  if (!lyr) {
    // No encontramos el polígono: evita errores y sal
    console.warn('No se encontró layer para clave:', clave);
    return;
  }

  // Resalta de forma segura
  try {
    lyr.setStyle({ weight: 3, color: '#666', dashArray: '', fillOpacity: 0.7 });
    if (typeof lyr.bringToFront === 'function') lyr.bringToFront();
    info.update(lyr.feature?.properties);
  } catch (err) {
    console.error('Error al resaltar capa:', err);
  }

  // Zoom al polígono
  const bounds = lyr.getBounds?.();
  if (bounds && bounds.isValid && bounds.isValid()) {
    map.fitBounds(bounds);
  }

  // Actualiza la gráfica (mínimo, seleccionado, máximo)
  filterData(Arr, [minMun, clave, maxMun]);
});


  // ====== Exportar a PDF ======
  window.exportarIndicador = function exportarIndicador() {
    const view = document.getElementById('indicadorView');
    const boton = document.getElementById('btnDescargarPDF');
    const grafica = document.getElementById('graficaIndicador');
    const barraBusqueda = document.querySelector('#indicadorView input');
    const originalMarginTop = view.style.marginTop;

    // Encabezado institucional
    const encabezado = document.createElement('div');
    encabezado.id = 'pdfEncabezado';
    encabezado.innerHTML = `
      <div style="text-align:center; margin-bottom:10px;">
        <h2 style="margin:0;">SIPINNA Michoacán</h2>
        <h4 style="margin:0;">Indicador generado el ${new Date().toLocaleDateString('es-MX')}</h4>
        <hr>
      </div>`;
    view.prepend(encabezado);

    // Ocultar elementos no necesarios
    view.classList.add('pdf-export');
    view.style.marginTop = '0px';
    if (boton) boton.style.display = 'none';
    if (grafica) grafica.style.display = 'none';
    if (barraBusqueda) barraBusqueda.style.display = 'none';

    // Asegurar reflow del mapa
    requestAnimationFrame(() => {
      map?.invalidateSize(true);
      const opt = {
        margin: [0,0,0,0],
        filename: 'indicador.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      setTimeout(() => {
        html2pdf().set(opt).from(view).save().then(() => {
          // Restaurar
          view.classList.remove('pdf-export');
          view.style.marginTop = originalMarginTop;
          if (boton) boton.style.display = 'inline-block';
          if (grafica) grafica.style.display = 'block';
          if (barraBusqueda) barraBusqueda.style.display = 'block';
          document.getElementById('pdfEncabezado')?.remove();
        });
      }, 300);
    });
  };

})();

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll('.navbar-collapse a');
  const navbarCollapse = document.querySelector('.navbar-collapse');

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (navbarCollapse.classList.contains("show")) {
        new bootstrap.Collapse(navbarCollapse).toggle();
      }
    });
  });
});