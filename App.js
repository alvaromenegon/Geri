import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Login from './src/pages/Login';
import Main from './src/pages/Main';
import { MateriasPrimas, Formulacoes, Produtos, Saidas } from './src/pages/Listagens';
import Profile from './src/pages/Profile';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TopBar from './src/components/TopBar';
import { CadFormulacoes, CadMateriasPrimas, CadProdutos, CadSaidas } from './src/pages/Cadastros';
import Faturamento from './src/pages/Faturamento';
import { Cadastro } from './src/pages/Cadastro';
import QRCodeScanner from './src/components/QRCodeScanner';
import Calculadora from './src/pages/Calculadora';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style='auto' backgroundColor='#edc4b5' translucent={false} />
      <Stack.Navigator
        screenOptions={{
          header: () => <TopBar />,
        }}
      >
          <Stack.Screen name='Login' component={Login} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
          <Stack.Screen name="Geri" component={Main} />
          <Stack.Screen name="Perfil" component={Profile} />
          <Stack.Screen name="Matérias-Primas" component={MateriasPrimas} />
          <Stack.Screen name="Cadastrar Matéria-Prima" component={CadMateriasPrimas} />
          <Stack.Screen name="Produtos" component={Produtos} />
          <Stack.Screen name="Cadastrar Produto" component={CadProdutos} />
          <Stack.Screen name="Formulações" component={Formulacoes} />
          <Stack.Screen name="Cadastrar Formulação" component={CadFormulacoes} />
          <Stack.Screen name="Calculadora" component={Calculadora} />
          <Stack.Screen name="Saídas" component={Saidas} />
          <Stack.Screen name="Cadastrar Saída" component={CadSaidas} />
          <Stack.Screen name="Faturamento" component={Faturamento} />
          <Stack.Screen name="Gerenciar Matéria-Prima" component={CadMateriasPrimas} />
          <Stack.Screen name="Ler QR Code" component={QRCodeScanner} />
      </Stack.Navigator>
    </NavigationContainer>

  );
}
