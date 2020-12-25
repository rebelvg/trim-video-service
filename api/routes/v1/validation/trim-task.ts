import * as Joi from 'joi';
import * as _ from 'lodash';
import { JoiObject } from 'joi';

import { BadRequest } from '../../../errors';

export const postSchema = Joi.object({
  startTime: Joi.number().required(),
  endTime: Joi.number().required(),
}).required();

export function validationMiddleware(schema: JoiObject, path: string) {
  return (ctx, next) => {
    const { error } = Joi.validate(_.get(ctx, path), schema, {
      abortEarly: false,
    });

    if (!error) {
      return next();
    }

    throw new BadRequest(error.message);
  };
}
