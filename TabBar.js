'use strict';

import React, {PropTypes} from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  Easing,
  Dimensions,
  StatusBar,
  PanResponder
} from 'react-native';
import Layout from './Layout';
import StaticContainer from './StaticContainer';

const {width, height} = Dimensions.get('window');

export default class TabBar extends React.Component {
  static propTypes = {
    ...Animated.View.propTypes,
    shadowStyle: View.propTypes.style,
    onOpenSwipeContent: PropTypes.func,
    onCloseSwipeContent: PropTypes.func,
    renderSwipeUpContent: PropTypes.func,
    renderPlayer: PropTypes.func
  };
  constructor(props) {
    super(props);
    this.state = {
      positionY: new Animated.Value(0),
      tabBarPosition: new Animated.Value(0),
      swipeUpContentOpacity: new Animated.Value(1),
      tabBarWrapperOpacity: new Animated.Value(1),
      overrideSwipe: false,
      maxHeight: -(height - 97),
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
        } else if (!this.state.isOpen && gestureState.dy > 0) {
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
            this.state.tabBarPosition.setValue(57 * Math.abs(dy / 57))
            this.state.tabBarWrapperOpacity.setValue(1 - (dy / maxHeight))
            this.state.swipeUpContentOpacity.setValue(.25 + Math.abs(dy / maxHeight))
          }
        } else {
          if (dy >= 0) {
            this.state.positionY.setValue(maxHeight + dy)
            this.state.tabBarPosition.setValue(57 * Math.abs(dy / 57))
            this.state.tabBarWrapperOpacity.setValue(dy / Math.abs(maxHeight))
            this.state.swipeUpContentOpacity.setValue(1 - (dy / Math.abs(maxHeight)))
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
  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.canSwipeUp && this.props.canSwipeUp && this.swipeUpContent) {
      this.swipeUpContent.forceUpdate();
    }
  }
  animateOpen() {
    if (this.props.canSwipeUp) {
      Animated.parallel([
        Animated.timing(this.state.positionY, {
          toValue: this.state.maxHeight,
          duration: 200,
          easing: Easing.elastic(0.8)
        }),
        Animated.timing(this.state.tabBarPosition, {
          toValue: 0, 
          duration: 200,
          easing: Easing.elastic(0.8)
        }),
        Animated.timing(this.state.tabBarWrapperOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.elastic(0.8)
        }),
        Animated.timing(this.state.swipeUpContentOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.elastic(0.8)
        })
      ]).start(() => {
        this.props.onOpenSwipeContent && this.props.onOpenSwipeContent()
        this.setState({
          hasOpenedBefore: true,
          isOpen: true
        })
      });
    }
  }
  animateClosed() {
    this.props.onCloseSwipeContent && this.props.onCloseSwipeContent();
    Animated.parallel([
      Animated.timing(this.state.positionY, {
        toValue: 0,
        duration: 200,
        easing: Easing.elastic(0.8)
      }),
      Animated.timing(this.state.tabBarPosition, {
        toValue: 0,
        duration: 200,
        easing: Easing.elastic(0.8)
      }),
      Animated.timing(this.state.tabBarWrapperOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.elastic(0.8)
      }),
      Animated.timing(this.state.swipeUpContentOpacity, {
        toValue: .25,
        duration: 200,
        easing: Easing.elastic(0.8)
      })
    ]).start(() => {
      this.setState({
        isOpen: false
      })
    });
  }
  render() {
    return (
      <Animated.View {...this.props} style={[styles.container, this.props.hasPlayer && styles.withPlayer]} {...this.pan.panHandlers}>
        <Animated.View pointerEvents={this.state.isOpen ? 'none' : 'auto'} style={{opacity: this.state.tabBarWrapperOpacity}}>
          {this.props.hasPlayer && 
            <Animated.View style={{transform: [{translateY: this.state.positionY}]}}>
              {this.props.renderPlayer(this.swipeUpRenderProps)}
            </Animated.View>
          }
          <Animated.View style={[this.props.style, styles.inner, {transform: [{translateY: this.state.tabBarPosition}]}]}>
            {this.props.children}
          </Animated.View>
        </Animated.View>
        <StaticContainer ref={c => this.swipeUpContent = c} shouldUpdate={this.state.isOpen}>
          <Animated.View style={[styles.swipeUpWrapper, {transform: [{translateY: this.state.positionY}]}]}>
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
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  swipeUpWrapper: {
    width, height,
    position: 'absolute',
    top: 0, left: 0,
    zIndex: -1
  },
  inner: {
    elevation: 12,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowRadius: -3,
    shadowOffset: {width: 0, height: 10},
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    height: Layout.pixel,
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'android' ? 0 : -Layout.pixel,
  },
  withPlayer: {
    top: Layout.tabBarHeight - 97,
    height: 97,
    borderTopWidth: 0
  }
});
