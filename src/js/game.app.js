import SketchPlayer from './sketch.player';
import SketchUI from './sketch.ui';
import PubSub from './pubsub';
import store from './store';
import TWEEN from '@tweenjs/tween.js';

export default class GameApp {
  constructor(config = {}) {
    this.config = config;
    this.pubsub = new PubSub();

    this.init();
  }

  start(gameLevel) {
    // setup store basics
    store.dispatch({
      type: 'SET_SCORE_FACTORS',
      scoreFactor: 10,
      level: gameLevel
    });

    store.dispatch({
      type: 'SET_GAME_STATE',
      gameState: 'PLAY'
    });

    this.pubsub.publish('startGame');
  }

  init() {
    this.buildBaseMarkup();
    this.setupSketches();
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

  setupSketches() {
    this.sketchPlayer = new SketchPlayer({
      setupBuffer: true,
      parent: 'sketch-player',
      ...this.config
    });
    
    this.sketchUi = new SketchUI({
      parent: 'sketch-ui',
      ...this.config
    });
  }
  
  draw() {
    this.requestId = window.requestAnimationFrame(this.draw.bind(this));

    TWEEN.update();
    
    const state = store.getState();
    if (state.playerSketchReady && state.uiSketchReady) {
      switch(state.gameState) {
        case 'LOADING':
          this.publishLoaded();
          return;
        case 'PLAY':
          this.sketchDraw();
          return;
        case 'GAME_OVER':
          this.stopDraw();
        default: return;
      }
    }
  }

  stopDraw() {
    window.cancelAnimationFrame(this.requestId);
  }

  sketchDraw() {
    this.sketchPlayer.draw();
    this.sketchUi.draw();
  }

  publishLoaded() {
    store.dispatch({
      type: 'SET_GAME_STATE',
      gameState: 'LOADED'
    });

    this.pubsub.publish('gameLoaded');
  }

  // global event handler method of game
  on(event, callback) { this.pubsub.suscribe(event, callback); }
}