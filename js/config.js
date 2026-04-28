// config.js
// Configuraciones generales y constantes del sistema

const Config = {
  colors: {
    Q1: '#800026',
    Q2: '#BD0026',
    Q3: '#E31A1C',
    Q4: '#FC4E2A',
    Q5: '#FD8D3C',
    default: '#FFEDA0'
  },

  map: {
    crs: L.CRS.EPSG900913,
    minZoom: 4,
    zoomDefault: window.innerWidth < 1100 ? 6 : 7,
    centerDefault: window.innerWidth < 1100
      ? [19.16592425362802, -101.56860351562501]
      : [19.041348796589013, -94.57580566406251]
  },

  tileLayer: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  },

  data: {
    menu: 'indicadores/menu.csv',
    municipios: 'indicadores/municipios.json',
    indicadoresBasePath: 'indicadores/'
  },

  table: {
    selector: "#tbl_indicador",
    scrollY: "615px"
  }
};
