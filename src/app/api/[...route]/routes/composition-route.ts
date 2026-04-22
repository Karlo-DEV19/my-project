import { Hono } from 'hono';
import {
  getAllCompositions,
  createComposition,
  deleteComposition,
} from '@/app/api/controller/composition-controller';

const compositionRoute = new Hono();

compositionRoute.get('/', getAllCompositions);
compositionRoute.post('/', createComposition);
compositionRoute.delete('/:id', deleteComposition);

export default compositionRoute;
