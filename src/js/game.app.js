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

    this.buildBaseMarkup();
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

  buildBaseMarkup() {
    const fragment = document.createDocumentFragment();

    // validate container configuration
    const { containerId } = this.config;
    const mainSelector = containerId ? document.getElementById(containerId) : null;
    const main = mainSelector || document.body;

    // container node
    const containerNode = document.createElement('div');
    Object.assign(containerNode.style, {
      position: 'relative'
    });
    
    // player node
    const playerNode = document.createElement('div');
    playerNode.id = 'sketch-player';
    
    // ui node
    const uiNode = document.createElement('div');
    uiNode.id = 'sketch-ui';
    Object.assign(uiNode.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: '10'
    });

    // build
    containerNode.appendChild(playerNode);
    containerNode.appendChild(uiNode);
    fragment.appendChild(containerNode);

    main.appendChild(fragment);
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