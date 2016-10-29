'use strict';

import { PixelRatio, Dimensions } from 'react-native';

export default {
  pixel: 1 / PixelRatio.get(),
  tabBarHeight: Dimensions.get('window').height,
};
