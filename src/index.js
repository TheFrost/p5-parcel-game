/** Traditional reload after changes for JS parch ParcelJS */
if(module.hot)module.hot.dispose(()=>window.location.reload());
/** end parch */

import GameApp from './js/game.app';

const app = new GameApp({ w: 360, h: 640 }); // setup base dimentions. Default 360x640
app.init(2); // start with level ( multiplier ) game. Deafault 1