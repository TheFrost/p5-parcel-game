import { createStore } from './utils';

const gameReducer = ( 
  state = {
    score: 0,
    scoreFactor: 0,
    finalScore: 0,
    comboCounter: 0,
    level: 0,
    gameState: 'LOADING',
    playerSketchReady: false,
    uiSketchReady: false,
  }, 
  action
) => {
  switch(action.type) {
    case 'UP_SCORE':
      return {
        ...state,
        score: state.score + state.scoreFactor
      };
    case 'UP_COMBO_COUNTER':
      return {
        ...state,
        comboCounter: state.comboCounter + 1
      };
    case 'CALC_FINAL_SCORE':
      return {
        ...state,
        finalScore: state.score * state.level
      };
    case 'SET_SCORE_FACTORS':
      return {
        ...state,
        scoreFactor: action.scoreFactor,
        level: action.level
      };
    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.gameState
      }
    case 'SET_PLAYER_SKETCH_READY':
      return {
        ...state,
        playerSketchReady: true
      };
    case 'SET_UI_SKETCH_READY':
      return {
        ...state,
        uiSketchReady: true
      };
    default:
      return state;
  }
};

const store = createStore(gameReducer);

export default store;