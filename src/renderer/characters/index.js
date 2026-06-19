// Character renderer registry. Maps each character id to its per-character hair
// drawer and exposes a single pure entry point, drawCharacter(), that the game
// renderer / a character-select preview can call. Imports zero React.

import { drawSlayer, getFabricPattern } from './slayerBody.js';
import { getCharacter, DEFAULT_CHARACTER_ID } from '../../data/characters.js';

import * as sunslayer from './sunslayer.js';
import * as thunderhunter from './thunderhunter.js';
import * as blossomwarden from './blossomwarden.js';
import * as torrentwarden from './torrentwarden.js';
import * as flamepillar from './flamepillar.js';

const HAIR_DRAWERS = {
  [sunslayer.id]: sunslayer.drawHair,
  [thunderhunter.id]: thunderhunter.drawHair,
  [blossomwarden.id]: blossomwarden.drawHair,
  [torrentwarden.id]: torrentwarden.drawHair,
  [flamepillar.id]: flamepillar.drawHair,
};

/**
 * Draw a character by id at a logical position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 * @param {string} [opts.id]     character id (defaults to the starter character)
 * @param {number} opts.x
 * @param {number} opts.y
 * @param {number} opts.scale
 * @param {string} [opts.pose]   'running' | 'slashing' | 'charging'
 * @param {number} [opts.time]
 */
export function drawCharacter(ctx, { id = DEFAULT_CHARACTER_ID, x, y, scale, pose = 'running', time = 0 }) {
  const char = getCharacter(id);
  const drawHair = HAIR_DRAWERS[char.id] || HAIR_DRAWERS[DEFAULT_CHARACTER_ID];
  drawSlayer(ctx, { x, y, scale, char, drawHair, pose, time });
}

export { getFabricPattern };
