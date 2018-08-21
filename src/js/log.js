const logger = {
  log: [],
  currentLog: {
    interactions: [],
    level: 1,
    totalShapePixels: 0,
    nameShape: ''
  },
  currentInteraction: {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    delta0: 0,
    delta1: 0
  },

  saveInteractionState() {
    this.currentLog.interactions.push({...this.currentInteraction});
  },
  saveLogState() {
    this.log.push({...this.currentLog});
    this.currentLog.interactions = [];
  }
};

export default logger;