// @flow strict

import scrollIntoView from 'scroll-into-view-if-needed';
import type { Options } from 'scroll-into-view-if-needed';

const test = scrollIntoView(document.body, { behavior: 'goo' });

function tests(options: Options) {
  console.log(options);
}

tests({ behavior: 'chocolate', duration: 4, boundary: 3 });
