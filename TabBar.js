'use strict';

import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  Dimensions,
  PanResponder
} from 'react-native';
import Layout from './Layout';
import StaticContainer from './StaticContainer';

const {height} = Dimensions.get('window');

export default class TabBar extends React.Component {
  static propTypes = {
    ...Animated.View.propTypes,
    shadowStyle: View.propTypes.style,
  };
  constructor(props) {
    super(props);
    this.state = {
      positionY: new Animated.Value(0),
      tabBarOpacity: new Animated.Value(1),
      playerOpacity: new Animated.Value(0),
      overrideSwipe: false,
      maxHeight: -(height - 57),
      isOpen: false
    }
    this.swipeUpRenderProps = {
      disableSwipe: () => {
        this.state.overrideSwipe = true;
      },
      enableSwipe: () => {
        this.state.overrideSwipe = false;
      },
      close: () => {
        this.animateClosed();
      }
    }
  }
  componentWillMount() {
    this.pan = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (this.state.overrideSwipe) {
          return false;
        }
        if (Math.abs(gestureState.dx / gestureState.dy) >= 1.5) {
          return false;
        } else if (gestureState.dy === 0) {
          return false;
        }
        return true;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,

      onPanResponderGrant: (evt, gestureState) => {
        // The guesture has started. Show visual feedback so the user knows
        // what is happening!

        // gestureState.{x,y}0 will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        if (!this.state.isOpen && this.props.canSwipeUp) {
          if (gestureState.dy <= 0) {
            this.state.positionY.setValue(gestureState.dy)
            this.state.tabBarOpacity.setValue(1 - (gestureState.dy / this.state.maxHeight))
            this.state.playerOpacity.setValue(gestureState.dy / this.state.maxHeight)
          }
        } else {
          if (gestureState.dy >= 0) {
            this.state.positionY.setValue(this.state.maxHeight + gestureState.dy)
            this.state.tabBarOpacity.setValue(gestureState.dy / Math.abs(this.state.maxHeight))
            this.state.playerOpacity.setValue(1 - (gestureState.dy / Math.abs(this.state.maxHeight)))
          }
        }
        // }
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        if (!this.state.isOpen) {
          if (Math.abs(gestureState.dy) <= height / 10) {
            this.animateClosed();
          } else {
            this.animateOpen()
          }
        } else {
          if (gestureState.dy >= 0 && Math.abs(gestureState.dy) >= height / 4) {
            this.animateClosed()
          } else {
            this.animateOpen();
          }
        }
        // responder. This typically means a gesture has succeeded
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
        return true;
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return false;
      },
    });
  }
  animateOpen() {
    if (this.props.canSwipeUp) {
      Animated.parallel([
        Animated.spring(this.state.positionY, {isInteraction: false, toValue: this.state.maxHeight}).start(),
        Animated.spring(this.state.tabBarOpacity, {isInteraction: false, toValue: 0}).start(),
        Animated.spring(this.state.playerOpacity, {isInteraction: false, toValue: 1}).start()
      ]).start(() => {
        this.setState({
          isOpen: true
        })
      });
    }
  }
  animateClosed() {
    Animated.parallel([
      Animated.spring(this.state.positionY, {isInteraction: false, toValue: 0}).start(),
      Animated.spring(this.state.tabBarOpacity, {isInteraction: false, toValue: 1}).start(),
      Animated.spring(this.state.playerOpacity, {isInteraction: false, toValue: 0}).start()
    ]).start(() => {
      this.setState({
        isOpen: false
      })
    });
  }
  render() {
    return (
      <Animated.View {...this.props} style={[styles.container, {transform: [{translateY: this.state.positionY}]}]} {...this.pan.panHandlers}>
        <Animated.View pointerEvents={this.state.isOpen ? 'none' : 'auto'} style={[this.props.style, styles.inner, {opacity: this.state.tabBarOpacity}]}>
          {this.props.children}
        </Animated.View>
        <StaticContainer shouldUpdate={this.state.isOpen}>
          <Animated.View style={{opacity: this.state.playerOpacity}}>
            {this.props.renderSwipeUpContent && this.props.renderSwipeUpContent(this.swipeUpRenderProps)}
          </Animated.View>
        </StaticContainer>
      </Animated.View>
    );
  }
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    height: Layout.tabBarHeight,
    position: 'absolute',
    top: Layout.tabBarHeight - 57,
    left: 0,
    right: 0,
  },
  inner: {
    elevation: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowRadius: -3,
    shadowOffset: {width: 0, height: 10},
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    height: Layout.pixel,
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'android' ? 0 : -Layout.pixel,
  },
});
