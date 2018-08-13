import SketchPlayer from './sketch.player';
import SketchUI from './sketch.ui';
import PubSub from './pubsub';
import store from './store';

export default class GameApp {
  constructor(config = {}) {
    this.config = config;
    this.pubsub = new PubSub();

    // flags
    this.gameOver = false;
  }

  init(gameLevel) {
    this.sketchPlayer = new SketchPlayer({
      setupBuffer: true,
      parent: 'sketch-player',
      ...this.config
    });
    
    this.sketchUi = new SketchUI({
      parent: 'sketch-ui',
      gameLevel: gameLevel,
      ...this.config
    });
    
    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    this.pubsub.suscribe('gameOver', this.stopDraw, this);
  }

  draw() {
    const state = store.getState();

    if (this.gameOver) return;

    this.requestId = window.requestAnimationFrame(this.draw.bind(this));

    if (state.playerSketchReady && state.uiSketchReady) {
      if (state.gameState !== 'PLAY') {
        store.dispatch({
          type: 'SET_GAME_STATE',
          gameState: 'PLAY'
        });
      }

      this.sketchPlayer.draw();
      this.sketchUi.draw();
    }
  }

  stopDraw() {
    this.gameOver = true;
    window.cancelAnimationFrame(this.requestId);
  }

  // global event handler method of game
  on(event, callback) { this.pubsub.suscribe(event, callback); }
}