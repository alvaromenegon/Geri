import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useWindowDimensions } from 'react-native';
import BottomBar from './components/BottomBar';
import TopBar from './components/TopBar';
import Main from './pages/Main';
//import styles from './styles.json';


export default function App() {
  const {height, width} = useWindowDimensions();
  return (
    <View style={{flex:1}}>
      <TopBar/>
      <Main/>
      <BottomBar/>
      <StatusBar/>
    </View>
    
  );
}
//const {height, width} = useWindowDimensions();
