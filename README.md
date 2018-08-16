## Uso

agregar antes de la etiqueta de cierre de `<body>`

    <script src="path-to/game.app.xxyy.js"></script>

Después ya pueden crear la instancia del juego, recomiendo lo hagan en una IIFE

    (function () {
      var app = new GameApp({ options })
    })();
## Options
**Option**|**Type**|**Default**|**description**
:-----|:-----:|:-----:|:-----
w|Number|360|Width del canvas en relacion 16/9 Orientacion Portrait
h|Number|640|Height del canvas en relacion 16/9 Orientacion Portrait
containerId|String|sketch-wrapper'|Si no pasan un id para seleccionar en el DOM toma por default el document.body y se monta el juego en ese nodo.
movilePointer|Boolean|true'|Esta opción muestra el cursor de la mano de chester en mobile, en escritorio siempre esta, pero en mobile no creo sea bueno tener ese recurso seria tener un doble cursor por eso lo parametrize.
resourcesPath|String|resources/'|Carpeta donde debe resolver la carga de assets.
timeLimit|Number|60|60 Segundos regla del juego, solo en caso de que quieran experimentar con partidas mas cortas o largas, con finalidades de desarrolo.
minLimitDrawDesk|Number|80|Este es el porcentage que debe cumplirse como mínimo, para hacer assert de que la figura esta dibujada en escritorio esta a un 80% por la relación al grosor del pincel y la dificultad de usar el recurso del mouse.
minLimitDrawMob|Number|90|Este es el porcentage que debe cumplirse como mínimo, para hacer assert de que la figura esta dibujada en mobile esta a un 90% por la relación al grosor del pincel es más grande y la facilidad de usar el recurso del drag.
brushSizeDesk|Number|13|Grosor del pincel para escritorio
brushSizeMob|Number|20|Grosor del pincel para mobiles
scaleCanvasFactor|Number|0.9|Por dentro el juego, usa una función para escalarse y ajustarse al ancho/alto de la ventana, para evitar quede fit a la ventana pueden usar este factor, es decir ahorita en lugar de tomar un 100% del alto toma un 90%

Los eventos van a estar disponibles después de crear la instancia del juego.

    app.on('gameLoaded', function() {
      console.log('game loaded!');
      app.start(1); // 1 easy, 2 medium, 3 hard 
    });
    
    app.on('gameOver', function(data) {
      console.log(data) // data = { log, score }
    });
