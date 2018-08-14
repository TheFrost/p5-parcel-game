import Sketch from './sketch';
import { pad } from './utils';
import store from './store';
import { Tween, Easing } from '@tweenjs/tween.js';

export default class SketchUI extends Sketch {
  constructor(config) {
    super(config);

    this.timer = config.timeLimit || 60; // in seconds
    this.timeFactor = 0;
    this.currentSecond = 0;

    // transform facors for tweening
    this.clockTransform = { scale: 1 };
    this.cheeseTransform = { scale: 1 };
    this.scorePulseTransform = { scale: 1 };

    this.init();
  }

  //#region p5.js main methods
  preload() {
    this.spriteMedia = this.p5.loadImage('resources/cheetos-ui.png');
    this.tilesetData = this.p5.loadJSON('resources/cheetos-ui.json');
  }
  
  setup() { 
    this.p5.noCursor();
    this.setupAssets();
    this.publishResources();
    store.dispatch({type: 'SET_UI_SKETCH_READY'});
  }

  draw() {
    const state = store.getState();

    switch(state.gameState) {
      case 'PLAY':
        this.renderUI();
        this.validateTimer();
        return;
      case 'GAME_OVER':
        this.renderUI();
        return;
      default: return;
    }
  }

  resize() { this.setupAssets(); }
  //#endregion p5.js main methods

  //#region Custom methods
  init() {
    this.setupTweens();
    this.bindEvents();
  }

  setupTweens() {
    // clock timeline ----------------------------
    const clockStep1 = new Tween(this.clockTransform)
      .to({ scale: 0.9 }, 80)
      .easing(Easing.Quadratic.Out);

    const clockStep2 = new Tween(this.clockTransform)
      .to({ scale: 0.95 }, 80)
      .easing(Easing.Quadratic.Out);
    
    const clockStep3 = new Tween(this.clockTransform)
      .to({ scale: 0.9 }, 80)
      .easing(Easing.Quadratic.Out);

    const clockStep4 = new Tween(this.clockTransform)
      .to({ scale: 1 }, 80)
      .easing(Easing.Quadratic.In);

    clockStep1.chain(clockStep2);
    clockStep2.chain(clockStep3);
    clockStep3.chain(clockStep4);

    this.clockPulseTween = clockStep1;

    // score pulse timeline ------------------------
    const scorePulseSetep1 = new Tween(this.scorePulseTransform)
      .to({ scale: 1.2 }, 100)
      .easing(Easing.Quadratic.In);
    
    const scorePulseSetep2 = new Tween(this.scorePulseTransform)
      .to({ scale: 1 }, 100)
      .easing(Easing.Quadratic.Out);

    scorePulseSetep1.chain(scorePulseSetep2);

    this.scorePulseTween = scorePulseSetep1;
  }

  bindEvents() {
    this.pubsub.suscribe('completedDraw', this.onCompleteDraw, this);
    this.pubsub.suscribe('startGame', this.onStartGame, this);
  }

  onStartGame() {
    this.startTime = Date.now();
  }

  onCompleteDraw() {
    store.dispatch({type: 'UP_SCORE'});
    this.scorePulseTween.start();
  }

  publishResources() {
    const { spriteMedia, tilesetData } = this;
    this.pubsub.publish('uiSpriteReady', { spriteMedia, tilesetData });
  }

  setupAssets() {
    // bar points -----------------------------
    const barPoints = this.tilesetData.frames['points-bar.png'];
    this.barPoints = {
      xDraw: this.GAME_WIDTH/2,
      yDraw: 63*this.GAME_SCALE,
      wDraw: barPoints.frame.w*this.GAME_SCALE,
      hDraw: barPoints.frame.h*this.GAME_SCALE,
      ...barPoints.frame
    };

    // cheese icon points ---------------------
    const cheesePointsIcon = this.tilesetData.frames['cheese-points.png'];
    this.cheesePointsIcon = {
      xDraw: this.GAME_WIDTH/2 + 9,
      yDraw: 60*this.GAME_SCALE,
      wDraw: cheesePointsIcon.frame.w*this.GAME_SCALE,
      hDraw: cheesePointsIcon.frame.h*this.GAME_SCALE,
      ...cheesePointsIcon.frame
    };

    // bar time empty -------------------------
    const barTimeEmpty = this.tilesetData.frames['time-bar.png'];
    this.timeBarEmpty = {
      xDraw: this.GAME_WIDTH/2,
      yDraw: this.GAME_HEIGHT - 63*this.GAME_SCALE,
      wDraw: barTimeEmpty.frame.w*this.GAME_SCALE,
      hDraw: barTimeEmpty.frame.h*this.GAME_SCALE,
      ...barTimeEmpty.frame
    };

    // bar time full --------------------------
    const barTimeFull = this.tilesetData.frames['time-bar-full.png'];
    this.timeBarFull = {
      xDraw: this.GAME_WIDTH/2-barTimeFull.frame.w*this.GAME_SCALE/2,
      yDraw: this.GAME_HEIGHT - 81*this.GAME_SCALE,
      wDraw: barTimeFull.frame.w*this.GAME_SCALE,
      hDraw: barTimeFull.frame.h*this.GAME_SCALE,
      ...barTimeFull.frame
    };

    // timer clock ----------------------------
    const timerClock = this.tilesetData.frames['clock.png'];
    this.timerClock = {
      xDraw: this.timeBarFull.xDraw,
      yDraw: this.timeBarFull.yDraw + this.timeBarFull.hDraw/2 - 2,
      wDraw: timerClock.frame.w*this.GAME_SCALE,
      hDraw: timerClock.frame.h*this.GAME_SCALE,
      ...timerClock.frame
    };

    // chester hand
    const pointer = this.tilesetData.frames['hand-pointer.png'];
    this.pointer = {
      wDraw: pointer.frame.w*this.GAME_SCALE,
      hDraw: pointer.frame.h*this.GAME_SCALE,
      ...pointer.frame
    }
  }

  getTimeEllapsed() {
    return (Date.now() - this.startTime) / 1000;
  }

  validateTimer() {
    const ellapsed = (Date.now() - this.startTime) / 1000;
    const intEllapsed = Math.ceil(ellapsed);

    this.timeFactor = ellapsed / this.timer;
    if (this.timeFactor > 1) this.triggerFinishGame();

    if (intEllapsed !== this.currentSecond) {
      this.clockPulseTween.start();
      this.currentSecond = intEllapsed;
    }
  }

  triggerFinishGame() {
    store.dispatch({type: 'CALC_FINAL_SCORE'});
    store.dispatch({
      type: 'SET_GAME_STATE',
      gameState: 'GAME_OVER'
    });

    const state = store.getState();
    this.pubsub.publish('gameOver', {
      log: 'log',
      score: state.finalScore
    });
  }

  renderUI() {
    this.p5.clear();
    this.renderPointer();
    this.renderBarPoints();
    this.renderTimeBar();
  }

  renderPointer() {
    const { p5 } = this;

    p5.imageMode(p5.CORNER);
    p5.image(
      this.spriteMedia,
      p5.mouseX-9*this.GAME_SCALE,
      p5.mouseY-10*this.GAME_SCALE,
      this.pointer.wDraw,
      this.pointer.hDraw,
      this.pointer.x,
      this.pointer.y,
      this.pointer.w,
      this.pointer.h
    );
  }

  renderBarPoints() {
    const { p5 } = this;

    p5.imageMode(p5.CENTER);
    p5.image(
      this.spriteMedia,
      this.barPoints.xDraw,
      this.barPoints.yDraw,
      this.barPoints.wDraw,
      this.barPoints.hDraw,
      this.barPoints.x,
      this.barPoints.y,
      this.barPoints.w,
      this.barPoints.h
    );

    p5.imageMode(p5.CENTER);
    p5.image(
      this.spriteMedia,
      this.cheesePointsIcon.xDraw,
      this.cheesePointsIcon.yDraw,
      this.cheesePointsIcon.wDraw * this.scorePulseTransform.scale,
      this.cheesePointsIcon.hDraw * this.scorePulseTransform.scale,
      this.cheesePointsIcon.x,
      this.cheesePointsIcon.y,
      this.cheesePointsIcon.w,
      this.cheesePointsIcon.h
    );

    this.renderPointsInfo();
  }

  renderTimeBar() {
    const { p5 } = this;

    p5.imageMode(p5.CENTER);

    // time bar empty
    p5.image(
      this.spriteMedia,
      this.timeBarEmpty.xDraw,
      this.timeBarEmpty.yDraw,
      this.timeBarEmpty.wDraw,
      this.timeBarEmpty.hDraw,
      this.timeBarEmpty.x,
      this.timeBarEmpty.y,
      this.timeBarEmpty.w,
      this.timeBarEmpty.h
    );

    // time bar full
    p5.imageMode(p5.CORNER);
    p5.image(
      this.spriteMedia,
      this.timeBarFull.xDraw,
      this.timeBarFull.yDraw,
      this.timeBarFull.wDraw*this.timeFactor,
      this.timeBarFull.hDraw,
      this.timeBarFull.x,
      this.timeBarFull.y,
      this.timeBarFull.w*this.timeFactor,
      this.timeBarFull.h
    );

    // timer clock
    p5.imageMode(p5.CENTER);
    p5.image(
      this.spriteMedia,
      this.timerClock.xDraw + this.timeFactor*this.timeBarEmpty.wDraw,
      this.timerClock.yDraw,
      this.timerClock.wDraw * this.clockTransform.scale,
      this.timerClock.hDraw * this.clockTransform.scale,
      this.timerClock.x,
      this.timerClock.y,
      this.timerClock.w,
      this.timerClock.h
    );
  }

  renderPointsInfo() {
    const { p5 } = this;

    // format
    p5.fill(255);
    p5.strokeWeight(2*this.GAME_SCALE);
    p5.stroke(255, 100, 0);
    p5.textStyle(p5.BOLD);

    this.renderPoints();
    this.renderMultiplier();
  }

  renderPoints() {
    const { p5 } = this;
    const state = store.getState();

    // format
    p5.textSize(20*this.GAME_SCALE*this.scorePulseTransform.scale);

    // points
    p5.textAlign(p5.CENTER);
    p5.text(pad(state.score, 4), this.GAME_WIDTH/2 - this.barPoints.wDraw/4 + 5, 63*this.GAME_SCALE);
  }

  renderMultiplier() {
    const { p5 } = this;
    const state = store.getState();

    // format
    p5.textSize(20*this.GAME_SCALE);

    // multiplier
    p5.textAlign(p5.RIGHT, p5.CENTER);
    p5.text(`x${state.level}`, this.GAME_WIDTH/2 + this.barPoints.wDraw/2 - this.barPoints.wDraw*0.15, 62*this.GAME_SCALE);
  }
  //#endregion Custom methods
};