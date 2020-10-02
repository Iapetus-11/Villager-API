import Express from 'express';
import Canvas from 'canvas';
import Axios from 'axios';
import Fs from 'fs';

// import utility functions
import * as CUtil from '../util/canvas.js';
import * as MCUtil from '../util/mc.js';

Canvas.registerFont('../assets/Minecraftia.ttf', {family: 'Minecraft', style: 'normal'});
