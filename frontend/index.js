import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import App from './src/App';

// Suppress known non-critical deprecation and development warnings
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'pointerEvents',
  'Cannot connect to Expo CLI',
  'API 401 Unauthorized',
]);

registerRootComponent(App);

