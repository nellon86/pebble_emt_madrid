/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */
// Requires
var UI = require('ui');
var Feature = require('platform/feature');
var Vector2 = require('vector2');
var ajax = require('ajax');

// Variables
var idClientValue = 'WEB.SERV.a.chamorro.ruiz@gmail.com',
    passKeyValue = '68B693C0-9F8A-4994-9428-F853E6ACA741',
    urlBase = 'https://openbus.emtmadrid.es/emt-proxy-server/last',
    urlGetArriveStop = urlBase + '/geo/GetArriveStop.php';


// SPLASH WINDOW
var splashWindow = new UI.Window({
  status: {
    backgroundColor:'#0D47A1',
    color: 'white'
  }
});

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: Feature.round(new Vector2(180, 200),new Vector2(144, 168)),
  text:'EMT\nMadrid',
  font:'GOTHIC_28_BOLD',
  color:'white',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor: Feature.color('#2196F3','black')
});
splashWindow.add(text);
splashWindow.show();



// Metodo que retorna un array de items con la config de localStorage
var getSavedStops = function(){
  //  "[{"title":"Casa","stopId":"2616"},{"title":"Farmacia","stopId":"1043"}]"
  var items = [];
  var configData = localStorage.getItem('configData');
  if(configData !== undefined && configData !== ''){
    var jsonItems = JSON.parse(configData);
    for(var i in jsonItems){
      items.push({
        title: jsonItems[i].title,
        subtitle: jsonItems[i].stopId
      });
    }
  }
  return items;
};

var stopDetails = function(event){
  var stopId = event.item.subtitle;
  
  // Creamos la tarjeta para el detalle
  var detailCard = new UI.Window();
  
  console.log('Buscando parada ' + stopId);
  
  // Invocamos a EMT
  ajax({
      url: urlGetArriveStop,
      method: 'post',
      data: {
        idClient: idClientValue,
        passKey: passKeyValue,
        cultureInfo: 'es',
        idStop: stopId
      }
    },
    function(data) {
      console.log('Datos recibidos: ' + data);
      data = JSON.parse(data);
      // Tenemos las paradas y los autobuses
      if(data.arrives[0]){
        var arriveItems = [];
        for(var arrive in data.arrives){
          var busTimeLeft = data.arrives[arrive].busTimeLeft;
          var busDistance = data.arrives[arrive].busDistance + ' metros';
          if(busTimeLeft === 999999){
            busTimeLeft = '>20';
          }else{
            busTimeLeft = Math.round(busTimeLeft / 60);
          }
          
          if(busTimeLeft === 0){
            busTimeLeft = '>>';
          }else{
            busTimeLeft = busTimeLeft + ' min';
          }
          arriveItems.push({
            title: data.arrives[arrive].lineId,
            subtitle: busTimeLeft + ' ' + busDistance
          });
        }
        
        var detailMenu = new UI.Menu({
          status: {
            backgroundColor: Feature.color('#0D47A1','black'),
            color: 'white',
            separator: 'none'
          },
          textColor: Feature.color('white','black'),
          backgroundColor: Feature.color('#2196F3','white'),
          highlightBackgroundColor: Feature.color('white', 'black'),
          highlightTextColor: Feature.color('#2196F3','white'),
          sections: [{
            items: arriveItems,
            title: stopId
          }],
        });
        
        detailMenu.show();
      }
    },
    function(error){
      console.log('Ha ocurrido un error, intentalo de nuevo');
    }
  );
  
};




// MAIN MENU
var menuItems = getSavedStops();
var mainMenu = new UI.Menu({
  status: {
    backgroundColor: Feature.color('#0D47A1','black'),
    color: 'white',
    separator: 'none'
  },
  textColor: Feature.color('white','black'),
  backgroundColor: Feature.color('#2196F3','white'),
  highlightBackgroundColor: Feature.color('white', 'black'),
  highlightTextColor: Feature.color('#2196F3','white'),
  sections: [{
    items: menuItems,
    title: 'PARADAS'
  }],
});
// Evento de seleccion
mainMenu.on('select',stopDetails);


setTimeout(function(){
  // Mostramos menu y ocultamos splash
  mainMenu.show();
  splashWindow.hide();
}, 600);



// EVENTOS EXTRA PARA CONFIG

// Lanzamos config si no hay paradas
Pebble.addEventListener('ready',function(){
  if(! localStorage.getItem('configData')){
     var url = 'http://ach4m0.github.io/config-pebbleemtmadrid/';
     Pebble.openURL(url);
  }
});

// Cargamos ventana de configuracion
Pebble.addEventListener('showConfiguration', function() {
  var url = 'http://ach4m0.github.io/config-pebbleemtmadrid/';
  Pebble.openURL(url);
});

// Recogemos configuracion y guardamos en local
Pebble.addEventListener('webviewclosed', function(e) {
  console.log("Comienza la vuelta");
  console.log(e.response);
  if(e.response !== undefined && e.response !== '' && e.response !== 'CANCELLED'){
    // Recoge los parametros de configuracion
    var configData = decodeURIComponent(e.response); 
    // Almacenamos config en localStorage
    localStorage.setItem('configData',configData);  
  }
  mainMenu.items(0,getSavedStops());

});

