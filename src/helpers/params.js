import { subDays, parse } from 'date-fns';

export const getParams = params => {
  const param = params[2];
  if (param.length > 2) {
    return parse(`${param}`);
  } else if (param === '-1') {
    return subDays(new Date(), 1);
  } else {
    return new Date();
  }
};
