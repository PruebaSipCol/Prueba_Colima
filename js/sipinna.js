$(".navbar-light .navbar-nav .nav-link").css("color", "#6F1D46")
$(".navbar-light .navbar-nav .nav-link").css("font-size", "larger")

window.innerWidth < 1100 ? Zoom = 6: Zoom = 7;
window.innerWidth < 1100 ? Centro = [ 19.16592425362802, -101.56860351562501] : Centro = [
  19.041348796589013, -94.57580566406251
];
//$('#map').length ? map = L.map("map", {crs: L.CRS.EPSG900913}).setView(Centro, Zoom) : null;

map = L.map("map", {crs: L.CRS.EPSG900913}).setView(Centro, Zoom)
//map.removeControl(map.zoomControl);
map.attributionControl.setPrefix('SIPINNA &copy ' + new Date().getFullYear());
/* map.setMaxBounds([
    [34.010757, -117.758715],
    [13.977554, -80.232818]
]); */
map.options.minZoom =4;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);



function sortJSON(data, key, orden) {
  return data.sort(function (a, b) {
    var x = parseFloat(a[key]),
      y = parseFloat(b[key]);
    if (orden === "asc") {
      return x < y ? -1 : x > y ? 1 : 0;
    }

    if (orden === "desc") {
      return x > y ? -1 : x < y ? 1 : 0;
    }
  });
}


// Definimos las opciones para la tabla
    var mitabla;
    Object.assign(DataTable.defaults, {
      //searching: false,
      language: {
        url: "js/es-ES.json",
      },
      info: false,
      scrollY: "615px",
      ordering: true,
      paging: false,
    });



// Agregamos funciones para obtener Min Max de un arreglo
    Array.prototype.hasMin = function(attrib) {
      const checker = (o, i) => typeof(o) === 'object' && o[i]
      return (this.length && this.reduce(function(prev, curr){
          const prevOk = checker(prev, attrib);
          const currOk = checker(curr, attrib);
          if (!prevOk && !currOk) return {};
          if (!prevOk) return curr;
          if (!currOk) return prev;
          return prev[attrib] < curr[attrib] ? prev : curr; 
      })) || null;
    }

    Array.prototype.hasMax = function(attrib) {
      const checker = (o, i) => typeof(o) === 'object' && o[i]
      return (this.length && this.reduce(function(prev, curr){
          const prevOk = checker(prev, attrib);
          const currOk = checker(curr, attrib);
          if (!prevOk && !currOk) return {};
          if (!prevOk) return curr;
          if (!currOk) return prev;
          return prev[attrib] > curr[attrib] ? prev : curr; 
      })) || null;
    }

// Funcion para filtrar municipios a graficar
    function filterData(data,cves) {
      arrGraficar = [];
      gLabels = [], gData = [];
      for (var key in data) {
          var value   = data[key];
          try {
            
            if (value.Clave.length === 5) {
              if (value.Clave===cves[0] || value.Clave===cves[1] || value.Clave===cves[2]) {
                arrGraficar.push(value)
                gLabels.push(value.Municipio)
                gData.push(value.Valor)
              }
            }
          } catch (error) {
            
          }
          
          
      }
      const ctx = document.getElementById('myChart');
      try {
        myChart.destroy()
      } catch (error) {
        
      }
      

      myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: gLabels,
          datasets: [{
            
            data: gData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
              legend: false
          }
        }
      });
      return arrGraficar;
    }



    function cmas(a) {
      if (a < 0) {
          a = a * -1;
      }
      return a;
  }



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

  function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
      weight: 3,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    info.update(layer.feature.properties);
  } 

  function resaltarFeature(e) {
    var layer = e;
    layer.setStyle({
      weight: 3,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
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
      layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
      });
  }

  
  var info = L.control();

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
     // this.update();
      return this._div;
  };
  
  // method that we will use to update the control based on feature properties passed
  info.update = function (props) {
      this._div.innerHTML = (props ?
          '<h5>' + props.nomgeo + ' (' + miles(props.Valor) + ') </h5>'
          : null);
  };
  
  info.addTo(map);
  

  function mkLegend(E1, E2, E3, E4, E5, capa) {
    legend = L.control({position: 'bottomright'});
  
    legend.onAdd = function (map) {
  
      var div = L.DomUtil.create('div', 'info legend'),
        grades = [E1, E2, E3, E4, E5],
        Qs = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
        //labels = ['<strong>Legenda</strong>'];
        labels = [];
        //from, to;
  
      for (var i = 0; i < grades.length; i++) {
        from = Qs[i];
        //to = grades[i + 1];
        labels.push( 
          '<i style="background:' + getColor(from)+'"></i>'+
          '<span style="text-align: left;">'+grades[i]+'</span>' /*+ (to ? '&ndash;' + to : '+')*/);
       
      }
  
      div.innerHTML = labels.join('<br>');
      return div;
    };
  
    legend.addTo(map);
  
 
    map.on('overlayadd', function (eventLayer) {
        // Switch to the Population legend...
        console.log(eventLayer.name)
        if (eventLayer.name === capa) {
            //this.removeControl(populationChangeLegend);
            legend.addTo(this);
            info.addTo(this);
        } /*else { // Or switch to the Population Change legend...
            this.removeControl(legend);
            //populationChangeLegend.addTo(this);
        }*/
    });
    
    map.on('overlayremove', function (eventLayer) {
        // Switch to the Population legend...
        console.log(eventLayer.name)
        if (eventLayer.name === capa) {
            this.removeControl(legend);
            this.removeControl(info);
            //legend.addTo(this);
        }
    });
  }
  
$(document).ready(function () {
  
  $.ajax({
    type: "GET",
    url: "indicadores/menu.csv",
    dataType: "text/csv",
    complete: function (result) {
      theMenu = $.csv.toObjects(result.responseText);
      theMenu.forEach(function (objD, index) { 
        
        
      $.ajax({
          type: "GET",
          url: "indicadores/"+objD.Archivo+".csv",
          dataType: "text/csv",
          complete: function (result) {
            console.log(objD.Archivo, objD.Boton)
            theJson = $.csv.toObjects(result.responseText);
            n1 = ''
            html = ''
            theJson.forEach(function (obj, index) { 
              console.log(obj.indicador, obj.valores, obj.descriptores)
              if (index == 0) {
                  html =  '<li nav-item><div class="dropdown" style=" padding-right: 15px;">'+
                          '<button type="button" class="btn '+ objD.Boton +' dropdown-toggle" style="min-width: 150px !important; margin-bottom: 5px;" data-toggle="dropdown">'+
                            objD.Dominio +                  
                          '</button>'+
                          '<div class="dropdown-menu">' +
                          '<a class="dropdown-item" href="#" onclick="mkIndicador(\''+obj.valores+'\',\''+obj.descriptores+'\')">' +
                          obj.indicador +
                          '</a>'
              } else {
                  html += '<a class="dropdown-item" href="#" onclick="mkIndicador(\''+obj.valores+'\',\''+obj.descriptores+'\')">' +
                          obj.indicador +
                          '</a>'
              }
              
            })
            html += '</div></div></li>'
            $("#myMenu").append(html)
          },
          success: function (result) {
          },
        })
      
      })
    },
    success: function (result) {
    },
  })
});

// Variables globales
theJson = {}, mun = {}, oindica = {}, cves = [], th = [], Min = 0, Max = 0, minMun = '', maxMun = '', seleccionado = '';
estratos = {
  'Q1' : {
      'q': 'Q1',
      'min': 0,
      'max':0
  },
  'Q2' : {
      'q': 'Q2',
      'min': 0,
      'max':0
  },
  'Q3' : {
      'q': 'Q3',
      'min': 0,
      'max':0
  },
  'Q4' : {
      'q': 'Q4',
      'min': 0,
      'max':0
  },
  'Q5' : {
      'q': 'Q5',
      'min': 0,
      'max':0
  },
}


// Cargamos los municipios
$.ajax({
  type: "GET",
  url: "indicadores/municipios.json",
  dataType: "json",
  complete: function (result) {
    mun = JSON.parse(result.responseText)
  },
});

// inicializamos la tabla
mitabla = new DataTable("#tbl_indicador", {
  data: oindica,
  columns: [{ data: null }, { data: null }, { data: null }],
  scrollY: "615px",
});


$("#tbl_indicador thead>tr").each(function () {
  $("th", this).each(function () {
    th.push($(this).text());
  });
});




// Procesamos el arreglo, obtenemos Min, Max minMun, maxMun y procesamos el json de municipios,
// Estratificamos por metodo Dalenius-Hodges
    function mkArray(oindica) {
      Arr = sortJSON(oindica, "Valor", "asc");
      
      Min = Arr.hasMin('Valor').Valor;
      Max = Arr.hasMax('Valor').Valor;
      minMun = Arr.hasMin('Valor').Clave;
      maxMun = Arr.hasMax('Valor').Clave;

      // obtenemos el limite superiro de cada clase
      Arr.map(function (event, index) {
        /* console.log(Min , ' | ', index + 1, ' | ', Max - Min , ' | ',  Math.min(Arr.length, 5 * 10), ' | ')
        console.log((Max - Min) / Math.min(Arr.length, 5 * 10))
        console.log(index + 1 * ((Max - Min) / Math.min(Arr.length, 5 * 10)))
        console.log(Min + (index + 1 * ((Max - Min) / Math.min(Arr.length, 5 * 10)))) */
        event["lsup"] = Min + ((index + 1) * ((Max - Min) / Math.min(Arr.length, 5 * 10)));

        
      });


       Arr.forEach(function (obj, index) {
        index == 0 ? (Arr[0]["linf"] = parseFloat(Arr[0]["Valor"])) : null;
        index > 0 ? (Arr[index]["linf"] = parseFloat(Arr[index - 1]["lsup"])) : null;
      }); 

      Arr.map(function (obj, index) {
        t = 0;
        Arr.map(function (event) {
          parseFloat(event["Valor"]) >= Arr[index]["linf"] &&
          parseFloat(event["Valor"]) < Arr[index]["lsup"] ? (t += 1): null;
        });
        Arr[index]["frec"] = t;
      });

      Arr.map(function (event, index) {
        event["r2"] = Math.sqrt(event["frec"]);
      });

      Arr.map(function (event, index) {
        Arr[index]["r2"] = Math.sqrt(Arr[index]["frec"]);
        index == 0 ? (Arr[index]["r2a"] = Arr[index]["r2"]) : null;
        index > 0 ? (Arr[index]["r2a"] = Arr[index]["r2"] + Arr[index - 1]["r2a"]) : null;
      });

      Q1 = (1 / 5) * Arr[Arr.length - 1]["r2a"];
      Q2 = Q1 * 2;
      Q3 = Q1 * 3;
      Q4 = Q1 * 4;
      Q5 = Q1 * 5;

      

      maxQ1 = 0, maxQ2 = 0, maxQ3 = 0, maxQ4 = 0, maxQ5 = 0;
      minQ1 = 0, minQ2 = 0, minQ3 = 0, minQ4 = 0, minQ5 = 0;
      Arr.map(function (event, index) {         
              event.r2a <= Q1 ? minQ1 = index :null ;
              maxQ1 === 0 ? (event.r2a >= Q1 ? maxQ1 = index :null) : null ;
            
              event.r2a <= Q2 ? minQ2 = index :null ;
              maxQ2 === 0 ? (event.r2a >= Q2 ? maxQ2 = index :null) : null ;

              event.r2a <= Q3 ? minQ3 = index :null ;
              maxQ3 === 0 ? (event.r2a >= Q3 ? maxQ3 = index :null) : null ;

              event.r2a <= Q4 ? minQ4 = index :null ;
              maxQ4 === 0 ? (event.r2a >= Q4 ? maxQ4 = index :null) : null ;

              event.r2a <= Q5 && minQ5 != index ? minQ5 = index :null ;
              maxQ5 === 0 ? (event.r2a >= Q5 ? maxQ5 = index :null) : null ;
      })


      cmas(Arr[minQ1].r2a - Q1) <  cmas(Arr[maxQ1].r2a - Q1) ? lQ1 = Math.round(Arr[minQ1].lsup) :lQ1 = Math.round(Arr[maxQ1].lsup)
      cmas(Arr[minQ2].r2a - Q2) <  cmas(Arr[maxQ2].r2a - Q2) ? lQ2 = Math.round(Arr[minQ2].lsup) :lQ2 = Math.round(Arr[maxQ2].lsup)
      cmas(Arr[minQ3].r2a - Q3) <  cmas(Arr[maxQ3].r2a - Q3) ? lQ3 = Math.round(Arr[minQ3].lsup) :lQ3 = Math.round(Arr[maxQ3].lsup)
      cmas(Arr[minQ4].r2a - Q4) <  cmas(Arr[maxQ4].r2a - Q4) ? lQ4 = Math.round(Arr[minQ4].lsup) :lQ4 = Math.round(Arr[maxQ4].lsup)
      cmas(Arr[minQ5].r2a - Q5) <  cmas(Arr[maxQ5].r2a - Q5) ? lQ5 = Math.round(Arr[minQ5].lsup) :lQ5 = Math.round(Arr[maxQ5].lsup)

      E1 = miles(Min) + ' - ' + miles(lQ1)
      E2 = miles(lQ1 + 1) + ' - ' + miles(lQ2)
      E3 = miles(lQ2 + 1) + ' - ' + miles(lQ3)
      E4 = miles(lQ3 + 1) + ' - ' + miles(lQ4)
      E5 = miles(lQ4 + 1) + ' - ' + miles(Max)

      Arr.map(function (event, index) {
        Arr[index]["Valor"] < lQ1 + 1 ? (Arr[index]["intervalo"] = "Q1") : null; 
        Arr[index]["Valor"] >= lQ1 + 1 && Arr[index]["Valor"] < lQ2 +1 ? (Arr[index]["intervalo"] = "Q2") : null;
        Arr[index]["Valor"] >= lQ2 + 1 && Arr[index]["Valor"] < lQ3+1 ? (Arr[index]["intervalo"] = "Q3") : null;
        Arr[index]["Valor"] >= lQ3 + 1 && Arr[index]["Valor"] < lQ4 + 1 ? (Arr[index]["intervalo"] = "Q4") : null;
        Arr[index]["Valor"] >= lQ4 + 1 ? (Arr[index]["intervalo"] = "Q5") : null;
      });
      
      tq1 = 0, tq2 = 0, tq3 = 0, tq4 = 0, tq5 = 0;
      Arr.map(function (event, index) {
        Arr[index]["Valor"] < lQ1 + 1 ? tq1 += 1 : null; 
        Arr[index]["Valor"] >= lQ1 + 1 && Arr[index]["Valor"] < lQ2 +1 ? tq2 += 1 : null;
        Arr[index]["Valor"] >= lQ2 + 1 && Arr[index]["Valor"] < lQ3+1 ?tq3 +=1 : null;
        Arr[index]["Valor"] >= lQ3 + 1 && Arr[index]["Valor"] < lQ4 + 1 ? tq4 += 1 : null;
        Arr[index]["Valor"] >= lQ4 + 1 ? tq5 += 1 : null;
      });

      $.each(mun.features, function(key, val) {
        $.each(oindica, function(key2, val2) {
          if (val2.Clave ==  val.properties.cvegeo) {
            val.properties.Valor = val2.Valor
            val.properties.Q = val2.intervalo 
          }    
        });
      });

      mkCapa();

    } // End MkArray


    function mkCapa(params) {
      cves = []
      try {
        municipios.clearLayers();
        legend.remove()
      } catch (error) {
        
      }
      municipios = L.geoJson(mun, {
          style: style,
          onEachFeature: onEachFeature
      }).addTo(map);
      mkLegend(E1, E2, E3, E4, E5, 'municipios')
      map.invalidateSize();
      bounds = municipios.getBounds();
      map.fitBounds(bounds);

      cves.push(minMun)
      cves.push(maxMun)
      filterData(Arr,cves)
     
      const ctx = document.getElementById('myChart');
      try {
        myChart.destroy()
      } catch (error) {
        
      }
      

      myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: gLabels,
          datasets: [{
            
            data: gData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
              legend: false
          }
        }
      });

    }
    


// Función para leer un arhivo csv y transformarlo a json
function mkJson(file) {
  csv = $.ajax({
          type: "GET",
          url: "indicadores/"+file+".csv",
          dataType: "text/csv",
          complete: function (result) {
            theJson = $.csv.toObjects(csv.responseText);
          },
          success: function (result) {
          },
        })
}


 
// Despliega indicador, carga csv de metadato del indicador y su correspondiente csv de valores
function mkIndicador(i, d) {

  seleccionado = ''
  try {
    let bounds = municipios.getBounds();
  map.fitBounds(bounds);
  for (const key in municipios._layers) {
    municipios.resetStyle(municipios._layers[key]);
  }
  } catch (error) {
    
  }
  
  
  info.update();
  $.ajax({
    type: "GET",
    url: "indicadores/"+d+".csv",
    dataType: "text/csv",
    complete: function (result) {
      theJson = $.csv.toObjects(result.responseText);
      $("#banner").css("display", "none")
      $("#header").css("display", "block")
      $("#i-header").html(theJson[0]['Nombre'])
      $("#i-body").html(theJson[0]['Descripcion'])


      $.ajax({
        type: "GET",
        url: "indicadores/"+i+".csv",
        dataType: "text/csv",
        complete: function (result) {
          theJson = $.csv.toObjects(result.responseText);
          
          theJson.map(function (event) {
              event["Valor"] = event["Valor"].replace(/,/g, "");
              event["Valor"] = event["Valor"].replace(/ /g, "");
              event["Valor"] = parseFloat(event["Valor"])
            });
          oindica = sortJSON(theJson, "Clave", "asc");
          mitabla.destroy()
          mitabla = new DataTable("#tbl_indicador", {
            data: oindica,
            columns: [{ data: "Clave" }, { data: "Municipio" }, { data: "Valor", className: 'dt-body-right', render: $.fn.dataTable.render.number(',') }],
            scrollY: "615px",
          });
    
          th = [];
          $("#tbl_indicador thead>tr").each(function () {
            $("th", this).each(function () {
              th.push($(this).text());
            });
          });
          
          $("#indicadores").css("display", "block")
          mkArray(oindica);
        },
        success: function (result) {
        },
      })

    },
    success: function (result) {
    },
  })

}

$("#tbl_indicador tbody").on("click", "tr", function (e) {
  $(".selected").removeClass('selected')
  const cell = e.target.closest("td");
  if (!cell) {
    return;
  } // Quit, not clicked on a cell
  row = cell.parentElement;
  
  if (seleccionado === row.cells[0].innerHTML) {
    //row.classList.contains('selected')
    row.classList.remove('selected')
    cves = [minMun, maxMun]
    seleccionado = ''
    let bounds = municipios.getBounds();
    map.fitBounds(bounds);
    for (const key in municipios._layers) {
      municipios.resetStyle(municipios._layers[key]);
    }
    
    info.update();
      
  } else {
    try {
      for (const key in municipios._layers) {
        municipios.resetStyle(municipios._layers[key]);
      } row.classList.add('selected');
      cves = [minMun, row.cells[0].innerHTML, maxMun]
      seleccionado = row.cells[0].innerHTML;
     
      for (const key in municipios._layers) {
        if (municipios._layers[key].feature.properties.cvegeo === row.cells[0].innerHTML) {
          
          let bounds = municipios._layers[key]._bounds;
          //sucursal.getBounds();
          resaltarFeature(municipios._layers[key])
            map.fitBounds(bounds);
        }
      }
    } catch (error) {
      
    }

  }
  filterData(Arr, cves);
});

function miles(numero){
    numero =numero+'';
    var resultado = "";

    if(numero[0]=="-")  {
        nuevoNumero=numero.replace(/\,/g,'').substring(1);
    }else{
        nuevoNumero=numero.replace(/\,/g,'');
    }
    
    if(numero.indexOf(".")>=0)
        nuevoNumero=nuevoNumero.substring(0,nuevoNumero.indexOf("."));
    for (var j, i = nuevoNumero.length - 1, j = 0; i >= 0; i--, j++)
        resultado = nuevoNumero.charAt(i) + ((j > 0) && (j % 3 == 0)? ",": "") + resultado;
    
    if(numero.indexOf(".")>=0) {
        resultado+=numero.substring(numero.indexOf("."));
    }else{
      //resultado+='.00'
    }

    if(numero[0]=="-"){
        return "-"+resultado;
    }else{
        return ""+resultado;
    }
}




















 