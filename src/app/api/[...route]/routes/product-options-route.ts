import { Hono } from 'hono';
import { createProductOptionsHandlers } from '@/app/api/controller/product-options-controller';

/**
 * Creates a fully CRUD-capable Hono router for a given option type.
 * Mount it at the desired path in route.ts:
 *   app.route('/fabric-widths', createOptionsRoute('fabric-widths'))
 */
export function createOptionsRoute(type: string): Hono {
  const route = new Hono();
  const { getAll, create, remove } = createProductOptionsHandlers(type);

  route.get('/', getAll);
  route.post('/', create);
  route.delete('/:id', remove);

  return route;
}
