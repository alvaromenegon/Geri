import { Text, View, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from "react";
import style from "../assets/style.json";
import { InputWithLabel } from "../components/InputWithLabel";
import firebase from '../services/firebaseConfig';
import { signInWithEmailAndPassword, getAuth ,signOut } from "firebase/auth";

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [err, setErr] = useState(false);
    const navigation = useNavigation();

    const logar = () => {
        const auth = getAuth();
        if (email !== '' && senha !== '') {

            signInWithEmailAndPassword(auth, email, senha)
                .then((userCredential) => {
                    console.log(userCredential)
                    if (userCredential.user.emailVerified !== true) {
                        Alert.alert('Erro', 'Email não verificado\n' +
                            'Verifique sua caixa de entrada e spam');
                            signOut(auth);
                        return false;
                    }
                    // Signed in
                    var user = userCredential.user;
                    AsyncStorage.setItem('user', JSON.stringify(
                        {
                            email: user.email,
                            uid: user.uid,
                            nome: user.displayName,
                        }
                    )).then(() => {
                        navigation.replace('Controle');
                    });
                })
                .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log(errorCode);
                    console.log(errorMessage);
                    Alert.alert('Erro ao fazer login', 'Usuário ou senha incorreta');
                });
        }
        else {
            Alert.alert('Erro', 'Usuário ou senha inválidos');
            return false;
        }
    }

    useEffect(() => {
        const getData = async () => {
            try {
                const value = await AsyncStorage.getItem('user')
                const prevUser = await AsyncStorage.getItem('prevUser');
                if (value !== null && value !== undefined) {
                    // Usuario Logado
                    navigation.replace('Controle');
                }
                if (prevUser !== null) {
                    setEmail(JSON.parse(prevUser).email);
                }
            } catch (e) {
                console.error(e);
            }
        }
        getData();
    }, []);


    return (
        <View style={style.container}>
            <View>
                <View style={{ height: 180 }}>
                    <InputWithLabel label="E-mail" type="email-address" value={email} onChangeText={t => setEmail(t)} />
                    <InputWithLabel label="Senha" value={senha} onChangeText={t => setSenha(t)} secure={true} />
                </View>
                <TouchableOpacity
                    onPress={() => { alert('Não implementado') }}>
                    <Text style={{ fontSize: 14, marginLeft: 5 }}>Esqueci minha senha</Text>
                </TouchableOpacity>
                <View
                    style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        marginTop: 30,
                    }}
                >

                    <TouchableOpacity
                        style={style.button}
                        onPress={() => { logar() }}
                    >
                        <Text style={style.textButton} >Entrar</Text>
                    </TouchableOpacity>

                    {
                        err ?
                            <Text>Erro ao salvar dados</Text>
                            :
                            null
                    }
                    <TouchableOpacity
                        onPress={() => { navigation.navigate('Cadastro') }}>
                        <Text style={style.text}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>
            </View>



        </View>

    )
}

export default Login;
