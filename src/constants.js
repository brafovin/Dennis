// Court dimensions in meters (NBA standard)
export const COURT = {
  WIDTH: 15,
  LENGTH: 28,
  PAINT_WIDTH: 4.9,
  PAINT_LENGTH: 5.8,
  THREE_POINT_RADIUS: 7.24,
  FREE_THROW_LINE: 4.6,
  CENTER_RADIUS: 1.8,
};

export const HOOP = {
  HEIGHT: 3.05,
  RIM_RADIUS: 0.23,
  BACKBOARD_WIDTH: 1.83,
  BACKBOARD_HEIGHT: 1.07,
  BACKBOARD_THICKNESS: 0.05,
  POLE_RADIUS: 0.05,
  OVERHANG: 1.2,
};

export const PLAYER = {
  HEIGHT: 1.8,
  RADIUS: 0.25,
  WALK_SPEED: 4,
  RUN_SPEED: 8,
  SPRINT_SPEED: 11,
  JUMP_HEIGHT: 1.2,
  JUMP_DURATION: 0.5,
  SHOOT_RANGE: 9,
};

export const BALL = {
  RADIUS: 0.12,
  MASS: 0.62,
};

export const GAME = {
  QUARTER_DURATION: 120,
  SHOT_CLOCK: 24,
  MAX_FOULS: 6,
  FREE_THROW_POINTS: 1,
  NORMAL_SHOT_POINTS: 2,
  THREE_POINT_SHOT_POINTS: 3,
};

export const PACK_COSTS = {
  BRONZE: 5,
  SILVER: 15,
  GOLD: 30,
  PLATINUM: 100,
};

export const PLAYER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export const SKIN_COLORS = [
  '#FDBCB4', '#E8956D', '#C68642', '#8D5524', '#4A2912', '#2C1810',
];

export const JERSEY_COLORS = [
  '#FF0000', '#0000FF', '#00AA00', '#FFA500', '#800080',
  '#000000', '#FFFFFF', '#FFD700', '#00FFFF', '#FF69B4',
];

export const GAME_MODES = {
  ONE_V_ONE: '1v1',
  TWO_V_TWO: '2v2',
  THREE_V_THREE: '3v3',
};

export const CONTROL_MODES = {
  AUTO: 'auto',
  MANUAL: 'manual',
};
