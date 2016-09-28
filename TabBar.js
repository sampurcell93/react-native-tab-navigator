'use strict';

import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  Dimensions
} from 'react-native';
import Layout from './Layout';

export default class TabBar extends React.Component {
  static propTypes = {
    ...Animated.View.propTypes,
    shadowStyle: View.propTypes.style,
  };

  render() {
    return (
      <Animated.View {...this.props} style={[styles.container, this.props.style]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: Layout.tabBarHeight,
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    elevation: 12,
    borderRadius: 4
  }
});
