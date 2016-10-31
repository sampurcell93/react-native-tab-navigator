'use strict';

import React from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  Dimensions,
  StatusBar,
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
      },
      open: () => {
        this.animateOpen();
      }
    }
  }
  componentWillMount() {
    this.pan = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (this.state.overrideSwipe && this.state.isOpen) {
          return false;
        } else if (this.state.isOpen && gestureState.dy < 0) {
          return false;
        } else if (this.state.isClosed && gestureState.dy > 0) {
          return false;
        } else if (Math.abs(gestureState.dx / gestureState.dy) >= 1.5) {
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
        const {dy} = gestureState;
        const {maxHeight} = this.state;
        // The most recent move distance is gestureState.move{X,Y}
        if (!this.state.isOpen && this.props.canSwipeUp) {
          if (dy <= 0) {
            this.state.positionY.setValue(dy)
            this.state.tabBarOpacity.setValue(1 - (dy / maxHeight))
            this.state.playerOpacity.setValue(dy / maxHeight)
          }
        } else {
          if (dy >= 0) {
            this.state.positionY.setValue(maxHeight + dy)
            this.state.tabBarOpacity.setValue(dy / Math.abs(maxHeight))
            this.state.playerOpacity.setValue(1 - (dy / Math.abs(maxHeight)))
          }
        }
        // }
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        const vy = Math.abs(gestureState.vy);
        if (!this.state.isOpen) {
          if (Math.abs(gestureState.dy * (1 - vy)) <= height / 10) {
            this.animateClosed();
          } else {
            this.animateOpen()
          }
        } else {
          if (gestureState.dy >= 0 && Math.abs(gestureState.dy * (1 + vy)) >= height / 7) {
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
        if (this.isOpen) {
          this.animateOpen();
        } else {
          this.animateClosed();
        }
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
        Animated.spring(this.state.positionY, {toValue: this.state.maxHeight}).start(),
        Animated.spring(this.state.tabBarOpacity, {toValue: 0}).start(),
        Animated.spring(this.state.playerOpacity, {toValue: 1}).start()
      ]).start(() => {
        StatusBar.setHidden(true, true);
        this.setState({
          isOpen: true,
          overrideSwipe: true
        })
      });
    }
  }
  animateClosed() {
    StatusBar.setHidden(false, true);
    Animated.parallel([
      Animated.spring(this.state.positionY, {toValue: 0}).start(),
      Animated.spring(this.state.tabBarOpacity, {toValue: 1}).start(),
      Animated.spring(this.state.playerOpacity, {toValue: 0}).start()
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
          {this.props.renderPlayer && this.props.renderPlayer(this.swipeUpRenderProps)}
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
    borderTopColor: '#eee',
    borderTopWidth: 1
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
