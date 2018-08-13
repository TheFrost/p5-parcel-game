/** Traditional reload after changes for JS parch ParcelJS */
if(module.hot)module.hot.dispose(()=>window.location.reload());
/** end parch */

import GameApp from './js/game.app';

// instance App
const app = new GameApp({ 
  w: 360, 
  h: 640,
  containerId: 'sketch-wrapper'
});

// example game Loaded handler
const loadingMsg = document.querySelector('.loadingMsg');
const btnPlay = document.getElementById('play');
const overlay = document.querySelector('.overlay');
const scoreInfo = document.querySelector('.scoreInfo');
const scoreTxt = document.querySelector('.score');

// example of game loaded handler state and wait for start
app.on('gameLoaded', () => {
  btnPlay.style.display = 'block';
  loadingMsg.style.display = 'none';
});

// button start game with level parameter
['click', 'touchstart'].forEach(e => {
  btnPlay.addEventListener(e, () => {
    overlay.style.display = 'none';
    btnPlay.style.display = 'none';
  
    app.start(2); // start method and level param
  });
});

// example gameOver handler and args destructuring
app.on('gameOver', ({ log, score }) => {
  overlay.style.display = 'flex';
  scoreInfo.style.display = 'block';
  scoreTxt.textContent = score;
});